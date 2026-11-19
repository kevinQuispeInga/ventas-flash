# =====================================================================
# Ventas Flash · Iniciar Firebase Emulator Suite (Costo: S/ 0)
# =====================================================================

$env:NO_PROXY = "127.0.0.1,localhost"
$env:no_proxy = "127.0.0.1,localhost"
$env:NO_UPDATE_NOTIFIER = "1"

# Limpiar hub temporal previo si existe
$hubTemp = Join-Path $env:TEMP "hub-demo-ventas-flash.json"
if (Test-Path $hubTemp) {
    Remove-Item -Path $hubTemp -Force -ErrorAction SilentlyContinue
}

Write-Host "======================================================" -ForegroundColor Green
Write-Host "   VENTAS FLASH · FIREBASE EMULATOR SUITE LOCAL       " -ForegroundColor Green
Write-Host "   Costo: S/ 0 · Proyecto: demo-ventas-flash          " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Puertos de emulación:" -ForegroundColor Cyan
Write-Host "  * Auth Emulator:       http://127.0.0.1:9099"
Write-Host "  * Firestore Emulator:  http://127.0.0.1:8080"
Write-Host "  * Functions Emulator:  http://127.0.0.1:5001"
Write-Host "  * Storage Emulator:    http://127.0.0.1:9199"
Write-Host "  * Panel de Control UI: http://127.0.0.1:4000"
Write-Host ""
Write-Host "Para detener los emuladores: presiona Ctrl + C en esta ventana." -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""

npm run emulators
