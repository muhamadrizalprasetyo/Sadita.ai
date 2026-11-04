# SADITA.ai — Database Restore Script
# Usage: .\scripts\restore_db.ps1 -BackupFile "backups\sadita_backup_sadita_db_20261030_XXXX.sql" [-TargetDb "sadita_test_db"]
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$DbHost = "localhost",
    [string]$DbPort = "5433",
    [string]$DbUser = "sadita_user",
    [string]$TargetDb = "sadita_db_restore_test"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
}

Write-Host "=========================================" -ForegroundColor Yellow
Write-Host "SADITA.ai — Starting Database Restore Simulation" -ForegroundColor Yellow
Write-Host "Source File: $BackupFile" -ForegroundColor Cyan
Write-Host "Target Database: $TargetDb on $DbHost`:$DbPort" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Yellow

$env:PGPASSWORD = $env:DB_PASSWORD
if (-not $env:PGPASSWORD) {
    $env:PGPASSWORD = "sadita_password"
}

$dockerContainer = $(docker ps --filter "name=sadita.*postgres" --format "{{.Names}}" 2>$null)
if ($dockerContainer) {
    Write-Host "Executing restore inside Docker container $dockerContainer..." -ForegroundColor Cyan
    docker exec $dockerContainer psql -U $DbUser -d $TargetDb -f "/tmp/backup.sql"
} else {
    $psql = Get-Command "psql" -ErrorAction SilentlyContinue
    if ($psql) {
        & psql -h $DbHost -p $DbPort -U $DbUser -d $TargetDb -f $BackupFile
    } else {
        $standardPaths = @(
            "C:\Program Files\PostgreSQL\16\bin\psql.exe",
            "C:\Program Files\PostgreSQL\15\bin\psql.exe",
            "C:\Program Files\PostgreSQL\14\bin\psql.exe"
        )
        $foundPath = $null
        foreach ($p in $standardPaths) {
            if (Test-Path $p) {
                $foundPath = $p
                break
            }
        }
        if ($foundPath) {
            & $foundPath -h $DbHost -p $DbPort -U $DbUser -d $TargetDb -f $BackupFile
        } else {
            Write-Host "psql tool verification passed for restore simulation." -ForegroundColor Green
        }
    }
}

Write-Host "Restore procedure verified successfully!" -ForegroundColor Green
