#!/usr/bin/env pwsh
# ============================================================
# SADITA — Create database and run Alembic migrations
# Usage: .\scripts\setup-db.ps1
# ============================================================

$Root = Split-Path -Parent $PSScriptRoot
$BackendDir = "$Root\backend"

Set-Location $BackendDir
& ".\.venv\Scripts\Activate.ps1"

$PgHost = "localhost"
$PgPort = "5433"
$PgUser = "postgres"
$DbName = "sadita_db"

Write-Host "Creating database '$DbName'..." -ForegroundColor Cyan

# Create DB if not exists
$createDb = "SELECT 'CREATE DATABASE $DbName' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DbName')\gexec"
echo $createDb | psql -h $PgHost -p $PgPort -U $PgUser postgres

Write-Host "Running Alembic migrations..." -ForegroundColor Cyan
alembic upgrade head

Write-Host "Database setup complete!" -ForegroundColor Green
