#!/usr/bin/env bash
# ============================================================
# SADITA.ai — Unified Development Runner (Linux)
# ============================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================================"
echo " Memulai SADITA.ai (FastAPI + Next.js + PostgreSQL)"
echo "============================================================"

# Pastikan PostgreSQL berjalan
if ! pg_isready -q; then
    echo "Menjalankan service PostgreSQL..."
    echo "1812005" | sudo -S systemctl start postgresql
fi

# Jalankan backend di background
echo "Memulai Backend FastAPI pada port 8000..."
cd "$ROOT_DIR/backend"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Jalankan frontend
echo "Memulai Frontend Next.js pada port 3000..."
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run dev &
FRONTEND_PID=$!

echo ""
echo "============================================================"
echo " SADITA.ai Development Servers Aktif:"
echo "   - Frontend : http://localhost:3000"
echo "   - Backend  : http://localhost:8000"
echo "   - API Docs : http://localhost:8000/docs"
echo "============================================================"
echo "Tekan [Ctrl+C] untuk menghentikan seluruh service."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM EXIT
wait
