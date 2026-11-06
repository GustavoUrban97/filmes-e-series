# Confere, no projeto de testes, que uma conta não alcança os dados de outra.
# Lê as credenciais de .env.teste e só roda contra o projeto do bloco TESTES de js/config.js.
$ErrorActionPreference = 'Stop'

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

$configuracao = Get-Content (Join-Path $PSScriptRoot '..\js\config.js') -Raw -Encoding UTF8
$projetoTestes = [regex]::Match($configuracao, "TESTES = \{[\s\S]*?supabaseUrl: '([^']+)'").Groups[1].Value
if (-not $projetoTestes -or $url -ne $projetoTestes) {
  throw 'SUPABASE_URL precisa ser igual à URL do bloco TESTES de js/config.js.'
}

$falhas = 0

function Conferir([string]$nome, [bool]$passou, [string]$detalhe = '') {
  if ($passou) {
    Write-Output "OK     $nome"
  } else {
    $script:falhas++
    Write-Output "FALHOU $nome $detalhe"
  }
}

function LerJson([string]$texto) {
  if (-not $texto) { return $null }
  try { return @($texto | ConvertFrom-Json | ForEach-Object { $_ }) } catch { return $null }
}

# Devolve o status e o corpo da resposta, sem interromper o script em respostas de erro.
# $autorizacao é o valor de Authorization: uma sessão de login ou a chave pública.
function Chamar([string]$metodo, [string]$caminho, [string]$autorizacao, $corpo) {
  $cabecalhos = @{ apikey = $chave; Prefer = 'return=representation' }
  if ($autorizacao) { $cabecalhos['Authorization'] = "Bearer $autorizacao" }
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
    return @{ status = [int]$resposta.StatusCode; dados = LerJson $resposta.Content }
  } catch [System.Net.WebException] {
    if (-not $_.Exception.Response) { throw }
    # No Windows PowerShell, o corpo de uma resposta de erro fica em ErrorDetails.
    return @{ status = [int]$_.Exception.Response.StatusCode; dados = LerJson $_.ErrorDetails.Message }
  }
}

function Entrar([string]$conta) {
  $corpo = @{ email = $credenciais["TESTE_$($conta)_EMAIL"]; password = $credenciais["TESTE_$($conta)_SENHA"] }
  $resposta = Chamar 'POST' '/auth/v1/token?grant_type=password' $null $corpo
  if ($resposta.status -ne 200) { throw "Não foi possível entrar com a conta $conta (status $($resposta.status))." }
  return $resposta.dados[0]
}

function BloqueouEscrita($resposta) {
  return $resposta.status -eq 200 -and @($resposta.dados).Count -eq 0
}

function RecusouCriacao($resposta) {
  return $resposta.status -in 401, 403
}

$a = Entrar 'A'
$b = Entrar 'B'
Conferir 'As duas contas são diferentes' ($a.user.id -ne $b.user.id)

function Limpar($conta) {
  foreach ($tabela in 'titles', 'dismissed_titles') {
    $limpeza = Chamar 'DELETE' "/rest/v1/$($tabela)?user_id=eq.$($conta.user.id)" $conta.access_token $null
    if ($limpeza.status -ne 200) { Conferir "Limpeza de $tabela" $false "status $($limpeza.status)" }
  }
}

# Sobras de uma rodada interrompida não podem contaminar esta.
Limpar $a
Limpar $b

try {
  $titulo = (Chamar 'POST' '/rest/v1/titles' $a.access_token @{ title = 'Teste de isolamento'; type = 'series'; status = 'watching' }).dados[0]
  Conferir 'A conta A cria um título' ($null -ne $titulo.id)
  $vista = Chamar 'POST' '/rest/v1/episode_views' $a.access_token @{ title_id = $titulo.id; season = 1; episode = 1 }
  Conferir 'A conta A marca um episódio' ($vista.status -eq 201)
  $dispensado = Chamar 'POST' '/rest/v1/dismissed_titles' $a.access_token @{ tmdb_id = 1; type = 'movie' }
  Conferir 'A conta A dispensa um título' ($dispensado.status -eq 201)
  $idVista = $vista.dados[0].id
  $idDispensado = $dispensado.dados[0].id

  foreach ($tabela in 'titles', 'episode_views', 'dismissed_titles') {
    $propria = Chamar 'GET' "/rest/v1/$($tabela)?select=*" $a.access_token $null
    Conferir "A conta A lê $tabela" ($propria.status -eq 200 -and @($propria.dados).Count -eq 1)
    $leitura = Chamar 'GET' "/rest/v1/$($tabela)?select=*" $b.access_token $null
    Conferir "A conta B não lê $tabela da conta A" ($leitura.status -eq 200 -and @($leitura.dados).Count -eq 0)
    $anonimo = Chamar 'GET' "/rest/v1/$($tabela)?select=*" $null $null
    Conferir "Sem login, $tabela é recusada" ($anonimo.status -eq 401) "status $($anonimo.status)"
  }

  # Controle: garante que a contagem enxerga linhas quando a conta tem acesso.
  $proprio = Chamar 'PATCH' "/rest/v1/titles?id=eq.$($titulo.id)" $a.access_token @{ notes = 'controle' }
  Conferir 'A conta A altera o próprio título' ($proprio.status -eq 200 -and @($proprio.dados).Count -eq 1)

  $alvos = @(
    @{ nome = 'título'; caminho = "/rest/v1/titles?id=eq.$($titulo.id)"; mudanca = @{ title = 'Invadido' } },
    @{ nome = 'episódio'; caminho = "/rest/v1/episode_views?id=eq.$idVista"; mudanca = @{ rating = 1 } },
    @{ nome = 'dispensado'; caminho = "/rest/v1/dismissed_titles?id=eq.$idDispensado"; mudanca = $null }
  )
  foreach ($alvo in $alvos) {
    if ($alvo.mudanca) {
      Conferir "A conta B não altera $($alvo.nome) da conta A" (BloqueouEscrita (Chamar 'PATCH' $alvo.caminho $b.access_token $alvo.mudanca))
    }
    Conferir "A conta B não exclui $($alvo.nome) da conta A" (BloqueouEscrita (Chamar 'DELETE' $alvo.caminho $b.access_token $null))
    $intacto = Chamar 'GET' "$($alvo.caminho)&select=*" $a.access_token $null
    Conferir "O $($alvo.nome) da conta A continua lá" (@($intacto.dados).Count -eq 1)
  }
  $tituloAtual = (Chamar 'GET' "/rest/v1/titles?id=eq.$($titulo.id)&select=title" $a.access_token $null).dados[0]
  Conferir 'O título da conta A não foi alterado' ($tituloAtual.title -eq 'Teste de isolamento')
  $vistaAtual = (Chamar 'GET' "/rest/v1/episode_views?id=eq.$idVista&select=rating" $a.access_token $null).dados[0]
  Conferir 'O episódio da conta A não foi alterado' ($null -eq $vistaAtual.rating)

  Conferir 'A conta B não cria título em nome da conta A' (RecusouCriacao (Chamar 'POST' '/rest/v1/titles' $b.access_token @{ user_id = $a.user.id; title = 'Falso'; type = 'movie'; status = 'planned' }))
  Conferir 'A conta B não marca episódio em título da conta A' (RecusouCriacao (Chamar 'POST' '/rest/v1/episode_views' $b.access_token @{ title_id = $titulo.id; season = 1; episode = 2 }))
  Conferir 'A conta B não dispensa título em nome da conta A' (RecusouCriacao (Chamar 'POST' '/rest/v1/dismissed_titles' $b.access_token @{ user_id = $a.user.id; tmdb_id = 2; type = 'movie' }))

  # Linhas da própria conta B não podem ser redirecionadas para a conta A.
  $tituloB = (Chamar 'POST' '/rest/v1/titles' $b.access_token @{ title = 'Da conta B'; type = 'series'; status = 'watching' }).dados[0]
  $vistaB = (Chamar 'POST' '/rest/v1/episode_views' $b.access_token @{ title_id = $tituloB.id; season = 1; episode = 1 }).dados[0]
  Conferir 'A conta B não passa um título para a conta A' (RecusouCriacao (Chamar 'PATCH' "/rest/v1/titles?id=eq.$($tituloB.id)" $b.access_token @{ user_id = $a.user.id }))
  Conferir 'A conta B não aponta um episódio para título da conta A' (RecusouCriacao (Chamar 'PATCH' "/rest/v1/episode_views?id=eq.$($vistaB.id)" $b.access_token @{ title_id = $titulo.id }))

  # Lê a configuração em vez de tentar um cadastro, que criaria contas se estivesse aberto.
  $ajustes = Chamar 'GET' '/auth/v1/settings' $null $null
  $cadastroFechado = $ajustes.status -eq 200 -and $ajustes.dados[0].disable_signup -eq $true
  Conferir 'O cadastro de novas contas está fechado' $cadastroFechado "status $($ajustes.status)"

  $busca = @{ q = 'matrix' }
  $semLogin = Chamar 'POST' '/functions/v1/swift-handler' $null $busca
  Conferir 'A função recusa pedidos sem autorização' ($semLogin.status -eq 401) "status $($semLogin.status)"
  $comChave = Chamar 'POST' '/functions/v1/swift-handler' $chave $busca
  Conferir 'A função recusa a chave pública no lugar do login' ($comChave.status -eq 401) "status $($comChave.status)"
  $comLogin = Chamar 'POST' '/functions/v1/swift-handler' $a.access_token $busca
  Conferir 'A função atende uma conta conectada' ($comLogin.status -eq 200) "status $($comLogin.status)"
} finally {
  Limpar $a
  Limpar $b
}

if ($falhas) {
  Write-Output "$falhas verificação(ões) falharam."
  exit 1
}
Write-Output 'Todas as verificações passaram.'
