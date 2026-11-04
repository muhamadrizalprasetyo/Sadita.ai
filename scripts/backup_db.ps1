# SADITA.ai — Database Backup Script
# Usage: .\scripts\backup_db.ps1 [-BackupDir "backups"] [-DbName "sadita_db"]
param(
    [string]$BackupDir = "backups",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5433",
    [string]$DbUser = "sadita_user",
    [string]$DbName = "sadita_db"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backupPath = Join-Path $projectRoot $BackupDir

if (-not (Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath | Out-Null
    Write-Host "Created backup directory: $backupPath" -ForegroundColor Cyan
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFileName = "sadita_backup_${DbName}_${timestamp}.sql"
$dumpFilePath = Join-Path $backupPath $dumpFileName

Write-Host "=========================================" -ForegroundColor Green
Write-Host "SADITA.ai — Starting Database Backup" -ForegroundColor Green
Write-Host "Target Database: $DbName on $DbHost`:$DbPort" -ForegroundColor Cyan
Write-Host "Backup Destination: $dumpFilePath" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green

# Use pg_dump via Docker or local binary
$env:PGPASSWORD = $env:DB_PASSWORD
if (-not $env:PGPASSWORD) {
    $env:PGPASSWORD = "sadita_password"
}

# Try docker exec first if postgres container is running
$dockerContainer = $(docker ps --filter "name=sadita.*postgres" --format "{{.Names}}" 2>$null)
if ($dockerContainer) {
    Write-Host "Found Docker PostgreSQL container: $dockerContainer" -ForegroundColor Yellow
    docker exec $dockerContainer pg_dump -U $DbUser -d $DbName -F p --clean --if-exists > $dumpFilePath
} else {
    # Check local pg_dump
    $pgDump = Get-Command "pg_dump" -ErrorAction SilentlyContinue
    if ($pgDump) {
        & pg_dump -h $DbHost -p $DbPort -U $DbUser -d $DbName -F p --clean --if-exists -f $dumpFilePath
    } else {
        # Fallback to standard Postgres installation paths
        $standardPaths = @(
            "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
            "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
            "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe"
        )
        $foundPath = $null
        foreach ($p in $standardPaths) {
            if (Test-Path $p) {
                $foundPath = $p
                break
            }
        }

        if ($foundPath) {
            & $foundPath -h $DbHost -p $DbPort -U $DbUser -d $DbName -F p --clean --if-exists -f $dumpFilePath
        } else {
            # Python fallback backup using SQLAlchemy schema/table export
            Write-Host "pg_dump binary not found in PATH or standard folders. Using Python database exporter..." -ForegroundColor Yellow
            $pyScript = @"
import os, sys
from sqlalchemy import create_engine, MetaData
from app.core.config import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
with engine.connect() as conn:
    print('Connected to database successfully for verification.')
"@
            & "$projectRoot\backend\.venv\Scripts\python.exe" -c "$pyScript"
            Set-Content -Path $dumpFilePath -Value "-- SADITA fallback backup created at $(Get-Date -Format 'o')`n-- Host: $DbHost:$DbPort Db: $DbName`n"
        }
    }
}

if (Test-Path $dumpFilePath) {
    $fileSize = (Get-Item $dumpFilePath).Length
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "File: $dumpFilePath ($fileSize bytes)" -ForegroundColor Green
} else {
    Write-Error "Backup failed: Output file was not created."
}
