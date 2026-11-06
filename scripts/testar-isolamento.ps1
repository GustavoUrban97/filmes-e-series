# Confere, no projeto de testes, que uma conta não alcança os dados de outra.
# Lê as credenciais de .env.teste e recusa rodar contra o projeto de produção.
$ErrorActionPreference = 'Stop'

$PROJETO_PRODUCAO = 'djbouioeghjzzgmsveiu'
$arquivo = Join-Path $PSScriptRoot '..\.env.teste'
if (-not (Test-Path $arquivo)) { throw 'Arquivo .env.teste não encontrado.' }

$credenciais = @{}
Get-Content $arquivo -Encoding UTF8 | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object {
  $partes = $_ -split '=', 2
  $credenciais[$partes[0]] = $partes[1].Trim()
}

$url = $credenciais['SUPABASE_URL'].TrimEnd('/')
$chave = $credenciais['SUPABASE_PUBLISHABLE_KEY']
if (-not $url -or -not $chave) { throw 'Preencha SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY em .env.teste.' }
if ($url -match $PROJETO_PRODUCAO) { throw 'Este script não roda contra o projeto de produção.' }

$falhas = 0

function Conferir([string]$nome, [bool]$passou, [string]$detalhe = '') {
  if ($passou) {
    Write-Output "OK     $nome"
  } else {
    $script:falhas++
    Write-Output "FALHOU $nome $detalhe"
  }
}

# Devolve o status e o corpo da resposta, sem interromper o script em respostas de erro.
function Chamar([string]$metodo, [string]$caminho, [string]$token, $corpo, [string]$preferencia = 'return=representation') {
  $cabecalhos = @{ apikey = $chave; Prefer = $preferencia }
  if ($token) { $cabecalhos['Authorization'] = "Bearer $token" }
  $parametros = @{
    Method = $metodo
    Uri = "$url$caminho"
    Headers = $cabecalhos
    ContentType = 'application/json; charset=utf-8'
    UseBasicParsing = $true
  }
  if ($null -ne $corpo) {
    $parametros['Body'] = [Text.Encoding]::UTF8.GetBytes(($corpo | ConvertTo-Json -Depth 5))
  }
  try {
    $resposta = Invoke-WebRequest @parametros
    $dados = $null
    if ($resposta.Content) { $dados = @($resposta.Content | ConvertFrom-Json | ForEach-Object { $_ }) }
    return @{ status = [int]$resposta.StatusCode; dados = $dados }
  } catch [System.Net.WebException] {
    if (-not $_.Exception.Response) { throw }
    return @{ status = [int]$_.Exception.Response.StatusCode; dados = $null }
  }
}

function Entrar([string]$email, [string]$senha) {
  $resposta = Chamar 'POST' '/auth/v1/token?grant_type=password' $null @{ email = $email; password = $senha }
  if ($resposta.status -ne 200) { throw "Não foi possível entrar com $email (status $($resposta.status))." }
  return $resposta.dados[0]
}

$a = Entrar $credenciais['TESTE_A_EMAIL'] $credenciais['TESTE_A_SENHA']
$b = Entrar $credenciais['TESTE_B_EMAIL'] $credenciais['TESTE_B_SENHA']
Conferir 'As duas contas são diferentes' ($a.user.id -ne $b.user.id)

$titulo = (Chamar 'POST' '/rest/v1/titles' $a.access_token @{ title = 'Teste de isolamento'; type = 'series'; status = 'watching' }).dados[0]
Conferir 'A conta A cria um título' ($null -ne $titulo.id)
$vista = Chamar 'POST' '/rest/v1/episode_views' $a.access_token @{ title_id = $titulo.id; season = 1; episode = 1 }
Conferir 'A conta A marca um episódio' ($vista.status -eq 201)
$dispensado = Chamar 'POST' '/rest/v1/dismissed_titles' $a.access_token @{ tmdb_id = 1; type = 'movie' }
Conferir 'A conta A dispensa um título' ($dispensado.status -eq 201)

try {
  foreach ($tabela in 'titles', 'episode_views', 'dismissed_titles') {
    $leitura = Chamar 'GET' "/rest/v1/$($tabela)?select=*" $b.access_token $null
    Conferir "A conta B não lê $tabela da conta A" ($leitura.status -eq 200 -and @($leitura.dados | Where-Object { $_.user_id -eq $a.user.id }).Count -eq 0)
    $anonimo = Chamar 'GET' "/rest/v1/$($tabela)?select=*" $null $null
    Conferir "Sem login, $tabela é recusada" ($anonimo.status -eq 401) "status $($anonimo.status)"
  }

  # Controle: garante que a contagem enxerga linhas quando a conta tem acesso.
  $proprio = Chamar 'PATCH' "/rest/v1/titles?id=eq.$($titulo.id)" $a.access_token @{ notes = 'controle' }
  Conferir 'A conta A altera o próprio título' (@($proprio.dados).Count -eq 1)

  $alteracao = Chamar 'PATCH' "/rest/v1/titles?id=eq.$($titulo.id)" $b.access_token @{ title = 'Invadido' }
  Conferir 'A conta B não altera o título da conta A' (@($alteracao.dados).Count -eq 0)
  $exclusao = Chamar 'DELETE' "/rest/v1/titles?id=eq.$($titulo.id)" $b.access_token $null
  Conferir 'A conta B não exclui o título da conta A' (@($exclusao.dados).Count -eq 0)

  $emNomeDeA = Chamar 'POST' '/rest/v1/titles' $b.access_token @{ user_id = $a.user.id; title = 'Falso'; type = 'movie'; status = 'planned' }
  Conferir 'A conta B não cria título em nome da conta A' ($emNomeDeA.status -in 401, 403) "status $($emNomeDeA.status)"
  $episodioAlheio = Chamar 'POST' '/rest/v1/episode_views' $b.access_token @{ title_id = $titulo.id; season = 1; episode = 2 }
  Conferir 'A conta B não marca episódio em título da conta A' ($episodioAlheio.status -in 401, 403) "status $($episodioAlheio.status)"
  $dispensadoAlheio = Chamar 'POST' '/rest/v1/dismissed_titles' $b.access_token @{ user_id = $a.user.id; tmdb_id = 2; type = 'movie' }
  Conferir 'A conta B não dispensa título em nome da conta A' ($dispensadoAlheio.status -in 401, 403) "status $($dispensadoAlheio.status)"

  $intacto = (Chamar 'GET' "/rest/v1/titles?id=eq.$($titulo.id)&select=title" $a.access_token $null).dados[0]
  Conferir 'O título da conta A continua intacto' ($intacto.title -eq 'Teste de isolamento')

  $emailNovo = "cadastro-$([guid]::NewGuid().ToString('N').Substring(0, 8))@example.com"
  $cadastro = Chamar 'POST' '/auth/v1/signup' $null @{ email = $emailNovo; password = [guid]::NewGuid().ToString() }
  Conferir 'O cadastro de novas contas está fechado' ($cadastro.status -ne 200) "status $($cadastro.status)"

  $funcao = Chamar 'POST' '/functions/v1/swift-handler' $null @{ q = 'matrix' }
  Conferir 'A função recusa pedidos sem login' ($funcao.status -eq 401) "status $($funcao.status)"
} finally {
  $null = Chamar 'DELETE' "/rest/v1/titles?id=eq.$($titulo.id)" $a.access_token $null
  $null = Chamar 'DELETE' '/rest/v1/dismissed_titles?tmdb_id=eq.1' $a.access_token $null
}

if ($falhas) {
  Write-Output "$falhas verificação(ões) falharam."
  exit 1
}
Write-Output 'Todas as verificações passaram.'
