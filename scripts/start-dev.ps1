#!/usr/bin/env pwsh
# ============================================================
# SADITA — Start all services (development)
# Usage: .\scripts\start-dev.ps1
# ============================================================

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$MqttOnly
)

$Root = Split-Path -Parent $PSScriptRoot

function Write-Header($msg) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " $msg" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

# --- Start Mosquitto MQTT ---
if (-not $BackendOnly -and -not $FrontendOnly) {
    Write-Header "Starting Mosquitto MQTT Broker"
    $mqttStatus = (Get-Service -Name mosquitto -ErrorAction SilentlyContinue).Status
    if ($mqttStatus -ne "Running") {
        Start-Service -Name mosquitto
        Write-Host "Mosquitto started" -ForegroundColor Green
    } else {
        Write-Host "Mosquitto already running" -ForegroundColor Yellow
    }
}

# --- Start Backend ---
if (-not $FrontendOnly -and -not $MqttOnly) {
    Write-Header "Starting FastAPI Backend (port 8000)"
    Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", @"
Set-Location '$Root\backend'
& '.\.venv\Scripts\python.exe' -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"@ -WindowStyle Normal
    Write-Host "Backend starting at http://localhost:8000" -ForegroundColor Green
    Write-Host "  API docs: http://localhost:8000/docs" -ForegroundColor Gray
}

# --- Start Frontend ---
if (-not $BackendOnly -and -not $MqttOnly) {
    Write-Header "Starting Next.js Frontend (port 3000)"
    Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", @"
Set-Location '$Root\frontend'
npm run dev
"@ -WindowStyle Normal
    Write-Host "Frontend starting at http://localhost:3000" -ForegroundColor Green
}

Write-Header "SADITA Development Environment"
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  MQTT:     localhost:1883" -ForegroundColor White
Write-Host ""
