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

Write-Host "Creating database schema and seeding initial academic data..." -ForegroundColor Cyan
& ".\.venv\Scripts\python.exe" -c "import app.models; from app.db.session import Base, engine; from app.db.seed import seed_database; Base.metadata.create_all(bind=engine); seed_database()"

Write-Host "Database setup & seeding complete!" -ForegroundColor Green
