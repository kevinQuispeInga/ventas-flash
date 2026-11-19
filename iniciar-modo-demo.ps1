# =====================================================================
# Ventas Flash · Iniciar Frontend en Modo DEMO (LocalStorage)
# =====================================================================

Set-Content -Path .env.local -Value "VITE_BACKEND=demo`nVITE_USE_FIREBASE_EMULATORS=false`n"
Write-Host "======================================================" -ForegroundColor Green
Write-Host "   VENTAS FLASH · MODO DEMO LOCAL (MARTA Y CARLOS)    " -ForegroundColor Green
Write-Host "   Persistencia en LocalStorage del navegador         " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Accede a la aplicación en: http://127.0.0.1:5173" -ForegroundColor Cyan
Write-Host "Para detener: presiona Ctrl + C en esta ventana." -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""

npm run dev
