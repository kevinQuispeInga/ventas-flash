# Guía de Instalación y Ejecución en Windows · Ventas Flash

**Requisitos previos:**
- Sistema Operativo: Windows 10 u 11 (64-bit).
- Node.js: Versión 20, 22 o 24 LTS instalada.
- Java: Versión 17 o 21 LTS instalada (requerida por Firebase Emulator Suite).
- PowerShell: Versión 5.1 o PowerShell 7.

---

## 1. Clonación o Apertura del Workspace

Abre una terminal PowerShell en la carpeta del proyecto:
```powershell
cd d:\KEVIN\Desktop\ventas-flash
```

---

## 2. Instalación de Dependencias

Si es la primera vez que se ejecuta en este equipo:
```powershell
npm install
npm --prefix functions install
```

---

## 3. Métodos de Inicio en Windows

### Método A: Inicio Rápido Todo en Uno (Recomendado)
Hemos provisto un script que orquesta automáticamente los emuladores y el frontend en ventanas independientes:
```powershell
powershell -ExecutionPolicy Bypass -File .\iniciar-todo.ps1
```
Este script:
1. Configura `.env.local` para Firebase local.
2. Abre la consola de Firebase Emulator Suite (Auth, Firestore, Functions, Storage).
3. Espera 5 segundos a la inicialización de puertos.
4. Abre la consola del servidor de desarrollo Vite.
5. Deja la aplicación lista en `http://127.0.0.1:5173`.

---

### Método B: Ejecución en Dos Ventanas (Control Manual)

#### Ventana 1 — Emuladores Firebase:
```powershell
powershell -ExecutionPolicy Bypass -File .\iniciar-emuladores.ps1
```
*O mediante npm:*
```powershell
npm run emulators
```
Puertos utilizados:
- Authentication Emulator: `http://127.0.0.1:9099`
- Firestore Emulator: `http://127.0.0.1:8080`
- Cloud Functions Emulator: `http://127.0.0.1:5001`
- Cloud Storage Emulator: `http://127.0.0.1:9199`
- Panel de Control Web UI: `http://127.0.0.1:4000`

#### Ventana 2 — Frontend React:
```powershell
powershell -ExecutionPolicy Bypass -File .\iniciar-frontend.ps1
```
*O mediante npm:*
```powershell
npm run dev
```
Accede desde tu navegador web a:
`http://127.0.0.1:5173`

---

### Método C: Modo DEMO (Desconectado sin Java ni Emuladores)
Si no deseas iniciar los emuladores de Firebase o no tienes Java instalado:
```powershell
powershell -ExecutionPolicy Bypass -File .\iniciar-modo-demo.ps1
```
Este modo almacena todo en el `localStorage` del navegador y permite alternar entre los perfiles de **Marta** y **Carlos**.

---

## 4. Solución de Problemas Comunes en Windows

### A. Error de Proxy o Conexión gRPC (HTTP 400 en Emulador)
En entornos corporativos o sandboxes con proxies HTTP configurados, las llamadas del Admin SDK a `127.0.0.1:8080` pueden ser interceptadas por el proxy.
- **Solución integrada:** Todos los scripts de npm y PowerShell en Ventas Flash inyectan automáticamente:
  ```powershell
  $env:NO_PROXY = "127.0.0.1,localhost"
  $env:no_proxy = "127.0.0.1,localhost"
  ```

### B. Error al escribir notificación de actualización en Firebase Tools
En Windows, `update-notifier` de Firebase puede lanzar una advertencia de permisos al cerrarse los emuladores.
- **Solución integrada:** Los scripts incluyen `$env:NO_UPDATE_NOTIFIER = "1"`, evitando bloqueos.

### C. Advertencia de versión de Node.js en Cloud Functions
`firebase-tools` puede mostrar una advertencia si el host corre Node 24 y el package.json indica Node 22. Esto es puramente informativo y las funciones se ejecutan con total compatibilidad.

---

## 5. Detener los Servicios

Para detener cualquier proceso, haz clic en la ventana correspondiente de PowerShell y presiona:
`Ctrl + C`
