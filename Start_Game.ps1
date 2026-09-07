$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverScript = Join-Path $projectDir "local_openclip_server_v4.py"
$pidFile = Join-Path $projectDir ".a2_cmda_server.pid"
$logDir = Join-Path $projectDir "logs"
$port = 8776
$url = "http://127.0.0.1:$port/"
$healthUrl = "http://127.0.0.1:$port/api/health"

function Write-Step($message) {
  Write-Host "[A2 CMDA] $message"
}

function Test-ServerReady {
  try {
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Find-Python {
  $candidates = @(
    "F:\develop\PythonInstall\python.exe",
    "python"
  )
  foreach ($candidate in $candidates) {
    if ($candidate -eq "python") {
      $command = Get-Command python -ErrorAction SilentlyContinue
      if ($command) { return "python" }
    } elseif (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }
  return $null
}

Write-Step "Starting Cross-Modal Disguise Agent V4.6..."
Set-Location -LiteralPath $projectDir

$pythonPath = Find-Python
if (-not $pythonPath) {
  Write-Host ""
  Write-Host "Python was not found." -ForegroundColor Red
  Write-Host "Please install Python 3.10+ or update Start_Game.ps1 with your Python path."
  exit 1
}

Write-Step "Using Python: $pythonPath"

$dependencyCheck = & $pythonPath -c "import open_clip, torch, PIL; print('ok')" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Required Python packages are missing or not working." -ForegroundColor Yellow
  Write-Host "Run this command in PowerShell:"
  Write-Host "pip install -r requirements.txt" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Original message:"
  Write-Host $dependencyCheck
  exit 1
}

if (Test-ServerReady) {
  Write-Step "Server is already running."
  Start-Process $url
  Write-Step "Opened $url"
  exit 0
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stdoutLog = Join-Path $logDir "server.out.log"
$stderrLog = Join-Path $logDir "server.err.log"

if (Test-Path -LiteralPath $pidFile) {
  Remove-Item -LiteralPath $pidFile -Force
}

Write-Step "Launching local model server on port $port..."
$process = Start-Process -FilePath $pythonPath `
  -ArgumentList @("`"$serverScript`"", "--port", "$port") `
  -WorkingDirectory $projectDir `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -PassThru

Set-Content -LiteralPath $pidFile -Value $process.Id -Encoding ascii

$ready = $false
for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Milliseconds 500
  if ($process.HasExited) {
    break
  }
  if (Test-ServerReady) {
    $ready = $true
    break
  }
}

if (-not $ready) {
  Write-Host ""
  if ($process.HasExited) {
    Write-Host "The server process exited before it became ready." -ForegroundColor Red
  } else {
    Write-Host "The server did not become ready in time." -ForegroundColor Red
  }
  Write-Host "Please check:"
  Write-Host $stdoutLog
  Write-Host $stderrLog
  exit 1
}

Write-Step "Server ready."
Start-Process $url
Write-Step "Opened $url"
Write-Step "Use Stop_Game.bat when you want to stop the local server."
