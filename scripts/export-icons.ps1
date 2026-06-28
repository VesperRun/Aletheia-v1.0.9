param(
  [string]$Source = "..\assets\aletheia-icon-simple.png",
  [string]$OutputDir = ".\icons"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$sizes = @(16, 32, 48, 128)

function Get-CommandOrNull($name) {
  Get-Command $name -ErrorAction SilentlyContinue
}

$magick = Get-CommandOrNull "magick"
$inkscape = Get-CommandOrNull "inkscape"

if ($magick) {
  $magickPath = $magick.Source
  foreach ($size in $sizes) {
    & $magickPath $Source -resize "${size}x${size}" -strip (Join-Path $OutputDir "icon$size.png")
  }
  Write-Host "Exported PNG icons with ImageMagick."
  exit 0
}

if ($inkscape -and $Source.ToLowerInvariant().EndsWith(".svg")) {
  $inkscapePath = $inkscape.Source
  foreach ($size in $sizes) {
    & $inkscapePath $Source --export-type=png --export-width=$size --export-height=$size --export-filename=(Join-Path $OutputDir "icon$size.png")
  }
  Write-Host "Exported PNG icons with Inkscape."
  exit 0
}

Write-Error "Install ImageMagick ('magick') or Inkscape, then rerun this script. Example: powershell -ExecutionPolicy Bypass -File .\scripts\export-icons.ps1"

