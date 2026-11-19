# =====================================================================
# Ventas Flash · Inicio Rápido Todo en Uno (Windows / PowerShell)
# =====================================================================
# Inicia Firebase Emulator Suite con persistencia local y el Frontend React
# como una sola aplicación unificada.
# Costo: S/ 0 (No requiere Blaze ni servicios externos facturables).
# =====================================================================

$ErrorActionPreference = "Stop"
$env:NO_PROXY = "127.0.0.1,localhost"
$env:no_proxy = "127.0.0.1,localhost"
$env:NO_UPDATE_NOTIFIER = "1"

Clear-Host
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "   🇵🇪  VENTAS FLASH · SISTEMA UNIFICADO (WINDOWS)  🇵🇪          " -ForegroundColor Green
Write-Host "   Frontend React 19 + Firebase Emulator Suite (S/ 0)            " -ForegroundColor Green
Write-Host "   Fuente única de datos: Firestore + Authentication + Storage   " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""

# 1. Verificar Node.js
Write-Host "[1/6] Verificando dependencias del entorno..." -ForegroundColor Cyan
try {
    $nodeVer = & node -v
    Write-Host "  * Node.js detectado: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js no está instalado o no se encuentra en el PATH." -ForegroundColor Red
    exit 1
}

# 2. Verificar Java (Requerido por Firestore Emulator)
try {
    $javaVer = & java -version 2>&1 | Select-Object -First 1
    Write-Host "  * Java detectado: $javaVer" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Advertencia: Java no detectado en PATH. El emulador de Firestore requiere Java Runtime." -ForegroundColor Yellow
}

# 3. Limpiar bloqueos temporales de sesiones previas en Windows
$hubTemp = Join-Path $env:TEMP "hub-demo-ventas-flash.json"
if (Test-Path $hubTemp) {
    Remove-Item -Path $hubTemp -Force -ErrorAction SilentlyContinue
    Write-Host "  * Limpiado archivo temporal de hub de sesión anterior." -ForegroundColor DarkGray
}

# 4. Asegurar configuración en .env.local
Write-Host "`n[2/6] Configurando variables de entorno (.env.local)..." -ForegroundColor Cyan
$envContent = @"
VITE_BACKEND=firebase
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_PROJECT_ID=demo-ventas-flash
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_AUTH_DOMAIN=localhost
VITE_FIREBASE_STORAGE_BUCKET=demo-ventas-flash.appspot.com
VITE_FIREBASE_APP_ID=demo-app
VITE_FIREBASE_FUNCTIONS_REGION=us-central1
"@
Set-Content -Path .env.local -Value $envContent
Write-Host "  * .env.local configurado: VITE_BACKEND=firebase (Emuladores locales)" -ForegroundColor Green

# 5. Comprobar datos persistentes (./emulator-data)
Write-Host "`n[3/6] Verificando datos persistentes (SEED)..." -ForegroundColor Cyan
$hasData = Test-Path "./emulator-data/firebase-export-metadata.json"
if ($hasData) {
    Write-Host "  * Datos persistentes encontrados en ./emulator-data (15 usuarios, 60 productos, 5 transmisiones)." -ForegroundColor Green
} else {
    Write-Host "  * Primera ejecución: se iniciará el emulador y se importarán datos tras iniciar." -ForegroundColor Yellow
}

# 6. Función para verificar si un puerto está en uso
function Test-PortListening ($port) {
    $con = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -WarningAction SilentlyContinue
    return $con.TcpTestSucceeded
}

# 7. Iniciar Firebase Emulators
Write-Host "`n[4/6] Comprobando Firebase Emulator Suite..." -ForegroundColor Cyan
$firestoreRunning = Test-PortListening 8080
$authRunning = Test-PortListening 9099

if ($firestoreRunning -and $authRunning) {
    Write-Host "  * Emuladores ya están en ejecución en puertos 8080 y 9099." -ForegroundColor Green
} else {
    Write-Host "  * Levantando emuladores en ventana independiente con persistencia..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", ".\iniciar-emuladores.ps1"

    Write-Host "  * Esperando disponibilidad de Firestore y Auth..." -ForegroundColor Yellow
    $attempts = 0
    while ($attempts -lt 30) {
        Start-Sleep -Seconds 1
        $attempts++
        if ((Test-PortListening 8080) -and (Test-PortListening 9099)) {
            Write-Host "  * ✅ Emuladores listos en el intento $attempts." -ForegroundColor Green
            break
        }
        Write-Host -NoNewline "."
    }
}

# Si no había datos exportados, sembrar y exportar ahora
if (-not $hasData -and (Test-PortListening 8080)) {
    Write-Host "`n[5/6] Poblando Firestore y Auth por primera vez..." -ForegroundColor Cyan
    npm run seed:emulators
    node scripts/export-data.mjs
}

# 8. Iniciar Frontend
Write-Host "`n[6/6] Iniciando Frontend React (Vite)..." -ForegroundColor Cyan
$frontendRunning = Test-PortListening 5173
if (-not $frontendRunning) {
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", ".\iniciar-frontend.ps1"
} else {
    Write-Host "  * Frontend ya en ejecución en http://127.0.0.1:5173" -ForegroundColor Green
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "   🎉 ¡VENTAS FLASH ESTÁ LISTO PARA USAR!                        " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "   🌐 Aplicación Web:       http://127.0.0.1:5173                " -ForegroundColor Cyan
Write-Host "   🎛️  Panel de Emuladores:  http://127.0.0.1:4000                " -ForegroundColor Cyan
Write-Host "   👥 15 Usuarios de prueba: diego.vendedor@ventasflash.pe       " -ForegroundColor Yellow
Write-Host "                            carlos.comprador@ventasflash.pe      " -ForegroundColor Yellow
Write-Host "                            Contraseña: Password123!             " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "   Para detener el sistema, cierra las ventanas de PowerShell.   " -ForegroundColor DarkGray
Write-Host "=================================================================" -ForegroundColor Green
