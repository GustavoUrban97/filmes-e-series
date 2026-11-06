# Serve o site em http://localhost:8123 para testes. Só atende pedidos desta máquina.
# A porta é fixa porque a função do TMDB só libera esta origem.
$ErrorActionPreference = 'Stop'
$Port = 8123

$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json'
  '.svg' = 'image/svg+xml'
  '.woff2' = 'font/woff2'
}

# Só o que o site usa é servido. Isso deixa de fora .env.teste, .git, scripts e documentação.
$PERMITIDOS = '^(index\.html|(css|js|img|fonts)/[A-Za-z0-9_-][A-Za-z0-9._-]*)$'

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "Servindo em http://localhost:$Port/"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $ctx.Response.StatusCode = 404
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if (-not $rel) { $rel = 'index.html' }
    if ($ctx.Request.IsLocal -and $rel -cmatch $PERMITIDOS) {
      $full = Join-Path $Root $rel
      if (Test-Path -LiteralPath $full -PathType Leaf) {
        $bytes = [IO.File]::ReadAllBytes($full)
        $ct = $types[[IO.Path]::GetExtension($full)]
        if ($ct) { $ctx.Response.ContentType = $ct }
        $ctx.Response.Headers.Add('Cache-Control', 'no-store')
        $ctx.Response.StatusCode = 200
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    }
  } catch {
    $ctx.Response.StatusCode = 500
  } finally {
    $ctx.Response.Close()
  }
}
