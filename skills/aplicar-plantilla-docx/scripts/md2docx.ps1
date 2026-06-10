<#
.SYNOPSIS
  Convierte un Markdown en .docx con la plantilla corporativa de A2R llamando al
  endpoint publico POST https://voice.a2r.com/api/v1/md2docx
.EXAMPLE
  .\md2docx.ps1 -MarkdownPath doc.md -OutFile doc.docx -Locale es -ClientName "Cliente S.A."
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$MarkdownPath,
  [string]$OutFile,
  [ValidateSet('en', 'es')][string]$Locale = 'es',
  [string]$AuthorName,
  [string]$Subtitle,
  [string]$Abstract,
  [string]$ClientName,
  [string]$DateText,
  [string]$Filename
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$endpoint = 'https://voice.a2r.com/api/v1/md2docx'

if (-not (Test-Path -LiteralPath $MarkdownPath)) {
  Write-Error "No existe el Markdown: $MarkdownPath"; exit 2
}
$markdown = Get-Content -LiteralPath $MarkdownPath -Raw -Encoding UTF8
if ([string]::IsNullOrWhiteSpace($markdown)) { Write-Error 'El Markdown esta vacio.'; exit 2 }
$bytes = [System.Text.Encoding]::UTF8.GetByteCount($markdown)
if ($bytes -gt 1MB) { Write-Error "El Markdown ($bytes bytes) supera el limite de 1 MB."; exit 2 }
if ($markdown -notmatch '(?m)^\s*#\s+\S') { Write-Warning 'El Markdown no parece tener un "# H1" (se usa como titulo de portada).' }

$body = @{ markdown = $markdown; locale = $Locale }
if ($AuthorName) { $body.authorName = $AuthorName }
if ($Subtitle)   { $body.subtitle   = $Subtitle }
if ($Abstract)   { $body.abstract   = $Abstract }
if ($ClientName) { $body.clientName = $ClientName }
if ($DateText)   { $body.date       = $DateText }
if ($Filename)   { $body.filename   = $Filename }

if (-not $OutFile) { if ($Filename) { $OutFile = $Filename } else { $OutFile = 'a2r-document.docx' } }

$json = $body | ConvertTo-Json -Depth 5 -Compress
$payloadBytes = [System.Text.Encoding]::UTF8.GetBytes($json)

try {
  Invoke-WebRequest -Uri $endpoint -Method Post `
    -ContentType 'application/json; charset=utf-8' `
    -Body $payloadBytes -TimeoutSec 130 -OutFile $OutFile
}
catch {
  $resp = $_.Exception.Response
  if ($resp) {
    try {
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $errBody = $reader.ReadToEnd()
    } catch { $errBody = '(sin cuerpo)' }
    $code = [int]$resp.StatusCode
    Write-Error "md2docx failed ($code): $errBody"; exit 1
  }
  Write-Error "md2docx failed: $($_.Exception.Message)"; exit 1
}

$size = (Get-Item -LiteralPath $OutFile).Length
Write-Output "OK: $OutFile ($size bytes)"
Write-Output 'Nota: al abrir el .docx, Word pedira actualizar los campos para mostrar los numeros de pagina del indice. Acepta.'
