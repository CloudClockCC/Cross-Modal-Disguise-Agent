$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverScript = Join-Path $projectDir "local_openclip_server_v4.py"
$port = 8774

$pythonCandidates = @(
  "F:\develop\PythonInstall\python.exe",
  "python"
)

$pythonPath = $null
foreach ($candidate in $pythonCandidates) {
  if ($candidate -eq "python") {
    $command = Get-Command python -ErrorAction SilentlyContinue
    if ($command) {
      $pythonPath = "python"
      break
    }
  } elseif (Test-Path -LiteralPath $candidate) {
    $pythonPath = $candidate
    break
  }
}

if (-not $pythonPath) {
  throw "Python was not found. Please install Python or update this launcher with your Python path."
}

Write-Host "Starting A2_CMDA V4 real model game server..."
Write-Host "URL: http://127.0.0.1:$port/"
Write-Host "Keep this PowerShell window open while using the prototype."
Write-Host "The first scan may take longer while OpenCLIP loads."
Write-Host ""

Set-Location -LiteralPath $projectDir
& $pythonPath $serverScript --port $port
