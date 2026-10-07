@echo off
title SADITA - Sistem Absensi Digital Terintegrasi Akademik
echo ============================================================
echo  Memulai SADITA (FastAPI + Next.js + Mosquitto + PostgreSQL)
echo ============================================================
powershell.exe -ExecutionPolicy Bypass -File "%~dp0scripts\start-dev.ps1"
pause
