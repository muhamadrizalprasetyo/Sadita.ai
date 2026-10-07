#!/usr/bin/env pwsh
# ============================================================
# SADITA — Run backend tests
# Usage: .\scripts\run-tests.ps1 [-Coverage] [-Verbose]
# ============================================================

param(
    [switch]$Coverage,
    [switch]$Verbose
)

$Root = Split-Path -Parent $PSScriptRoot
$BackendDir = "$Root\backend"

Set-Location $BackendDir

# Activate venv
& ".\.venv\Scripts\Activate.ps1"

$args = @("tests/")
if ($Coverage) {
    $args = @("--cov=app", "--cov-report=term-missing", "--cov-report=html") + $args
}
if ($Verbose) {
    $args = @("-v") + $args
}

Write-Host "Running SADITA test suite..." -ForegroundColor Cyan
python -m pytest @args
