# Serve o site em http://localhost:8123 para testes. Só atende esta máquina.
param([int]$Port = 8123)

$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json'
  '.svg' = 'image/svg+xml'
  '.woff2' = 'font/woff2'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "Servindo em http://localhost:$Port/"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
  if (-not $rel) { $rel = 'index.html' }
  $full = [IO.Path]::GetFullPath((Join-Path $Root $rel))

  # Arquivos e pastas com ponto, como .env.teste e .git, nunca são servidos.
  $oculto = @($rel -split '[\\/]' | Where-Object { $_.StartsWith('.') }).Count -gt 0
  $dentro = $full.StartsWith($Root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)

  if ($dentro -and -not $oculto -and (Test-Path $full -PathType Leaf)) {
    $bytes = [IO.File]::ReadAllBytes($full)
    $ct = $types[[IO.Path]::GetExtension($full)]
    if ($ct) { $ctx.Response.ContentType = $ct }
    $ctx.Response.Headers.Add('Cache-Control', 'no-store')
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.Close()
}
