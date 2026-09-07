$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $projectDir ".a2_cmda_server.pid"

if (-not (Test-Path -LiteralPath $pidFile)) {
  Write-Host "No saved A2 CMDA server process was found."
  exit 0
}
$pidText = (Get-Content -LiteralPath $pidFile -Raw).Trim()
if (-not $pidText) {
  Remove-Item -LiteralPath $pidFile -Force
  Write-Host "Empty server process file removed."
  exit 0
}

try {
  $process = Get-Process -Id ([int]$pidText) -ErrorAction Stop
  Stop-Process -Id $process.Id -Force
  Remove-Item -LiteralPath $pidFile -Force
  Write-Host "Stopped A2 CMDA local server process $pidText."
} catch {
  Remove-Item -LiteralPath $pidFile -Force
  Write-Host "Saved server process was not running. Cleaned up the process file."
}
