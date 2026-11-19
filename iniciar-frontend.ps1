# =====================================================================
# Ventas Flash · Iniciar Frontend React (VITE_BACKEND=firebase)
# =====================================================================

Set-Content -Path .env.local -Value "VITE_BACKEND=firebase`nVITE_USE_FIREBASE_EMULATORS=true`nVITE_FIREBASE_PROJECT_ID=demo-ventas-flash`nVITE_FIREBASE_API_KEY=demo-key`nVITE_FIREBASE_AUTH_DOMAIN=localhost`nVITE_FIREBASE_STORAGE_BUCKET=demo-ventas-flash.appspot.com`nVITE_FIREBASE_APP_ID=demo-app`nVITE_FIREBASE_FUNCTIONS_REGION=us-central1`n"

Write-Host "======================================================" -ForegroundColor Green
Write-Host "   VENTAS FLASH · SERVIDOR DE DESARROLLO FRONTEND     " -ForegroundColor Green
Write-Host "   Conectado a Firebase Emulator Suite (S/ 0)         " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Requisito: Los emuladores deben estar corriendo en otra ventana" -ForegroundColor Yellow
Write-Host "(ejecuta .\iniciar-emuladores.ps1)." -ForegroundColor Yellow
Write-Host ""
Write-Host "Accede a la aplicación en: http://127.0.0.1:5173" -ForegroundColor Cyan
Write-Host "Para detener el frontend: presiona Ctrl + C en esta ventana." -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""

npm run dev
