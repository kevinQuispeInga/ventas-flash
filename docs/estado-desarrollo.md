# Estado de Desarrollo y Hoja de Ruta · Ventas Flash

**Fecha de actualización:** 19 de Noviembre de 2026  
**Proyecto:** Ventas Flash (Marketplace Peruano con Subastas, Remates, Radar Flash y Flash Live)  
**Entorno de ejecución:** Windows, Node.js v24+, React 19, Vite 6, Tailwind 4, Firebase Emulator Suite  
**Arquitectura:** Aplicación Única Unificada con Firebase como fuente principal y única de datos  
**Costo total acumulado:** S/ 0.00 (Firebase Spark / Emulator Suite en Localhost)

---

## 1. Resumen Ejecutivo del Estado del Sistema

El desarrollo de **Ventas Flash** ha completado de forma integral y comprobable todas las fases, culminando con la **Unificación Definitiva de Arquitectura**:

| Fase | Denominación | Estado | Validación |
| :--- | :--- | :---: | :--- |
| **Fase 1** | Frontend, Marketplace, Subastas, Remates, Checkout Demo | **Completado** | 17 pruebas unitarias aprobadas |
| **Fase 2** | Backend Firebase Emulator Suite (Auth, Firestore, Functions, Storage) | **Completado** | 24 pruebas de emuladores aprobadas |
| **Fase 3** | Radar Flash (Leaflet, OpenStreetMap, Geolocation, Haversine, Privacidad) | **Completado** | 9 pruebas geográficas + 1 E2E aprobadas |
| **Fase 4** | Flash Live (Transmisiones en Vivo, WebRTC P2P, Demo Canvas, Subastas en Vivo, Chat Público) | **Completado** | 4 pruebas unitarias + 1 E2E + 1 Reglas aprobadas |
| **Fase 5** | Auditoría UX/UI, Accesibilidad, Seguridad, Scripts Windows y Documentación | **Completado** | 58 pruebas globales aprobadas (0 fallos) |
| **Fase 6** | **Unificación de Arquitectura a Fuente Única Firebase y Persistencia SEED** | **Completado** | **68 pruebas globales aprobadas (100% verdes)** |

---

## 2. Unificación de Arquitectura (Fase 6)

### A. Eliminación de la Dualidad de Modos
- Se ha eliminado la necesidad de alternar entre modo DEMO y modo FIREBASE para la operación normal.
- La aplicación se conecta de manera directa e incondicional a **Firebase Emulator Suite** como su backend principal y fuente única de verdad.
- Se retiraron de la experiencia del usuario final los banners técnicos divisores (`backend-banner`) y los bypasses manuales ("Entrar como Marta / Carlos").
- Se conserva un único flujo estándar de autenticación basado en **Firebase Authentication** (Registro, Inicio de Sesión y Recuperación de Contraseña).

### B. Persistencia Real de Datos entre Reinicios
- Se configuró la exportación e importación automática de datos en `./emulator-data`.
- Cuenta con 15 usuarios peruanos pre-registrados en Authentication y Firestore.
- 60 productos catalogados en Soles (S/) y distribuidos geográficamente en 12 distritos de Lima.
- 5 transmisiones Flash Live con salas y chat público persistidos.
- 2 transacciones postventa con custodia simulada (escrow) y chat bilateral.
- Al reiniciar los emuladores o el sistema, los datos se recargan intactos sin reinicializarse a cero.

### C. Inicio Rápido Todo en Uno
- **PowerShell:** `.\iniciar-todo.ps1`
- **Node / npm:** `npm start`
- Ambos comandos verifican dependencias, limpian bloqueos de puertos y sockets temporales de Windows, levantan Firebase Emulator Suite con `--import=./emulator-data --export-on-exit=./emulator-data`, y abren el frontend en `http://127.0.0.1:5173`.

---

## 3. Detalle de Módulos Unificados sobre Firebase

### A. Catálogo y Modalidades de Venta
- **Subastas Contrarreloj:** Sincronizadas en tiempo real vía Firestore y Cloud Functions `placeBid` / `setAutoBid`.
- **Reloj Anti-robo (Anti-sniping):** Extensión automática de 60 segundos si ingresa una puja en los últimos 30 segundos, ejecutada atómicamente en Cloud Functions.
- **Auto-puja Inteligente:** Posturas automáticas en incrementos sin revelar el tope máximo a terceros ni al vendedor.
- **Remates Descendentes:** Descenso escalonado de precio cada 30 segundos calculado en tiempo real con paridad estricta frontend-backend.
- **Compra Inmediata & Checkout:** Cálculo transparente de comisión de servicio del 4% en céntimos enteros, ejecutada en Cloud Functions `purchaseProduct`.
- **Chat Postventa Bilateral:** Mensajería en tiempo real almacenada en subcolección `conversations/{id}/messages`.
- **Confirmación de Recepción:** Solo el comprador puede confirmar la entrega; liberación de escrow simulada ejecutada en Cloud Functions `confirmReceipt`.

### B. Radar Flash (Geolocalización y Búsqueda Espacial)
- Mapa interactivo Leaflet con OpenStreetMap y atribución legal obligatoria.
- Los 60 productos se leen directamente de la colección `products` de Firestore.
- Filtros de proximidad en anillos concéntricos: 1 km, 2 km, 3 km, 5 km, 10 km y Todos los distritos.
- Coordenadas con privacidad aproximada (`approximateCoordinates`) en los 12 distritos de Lima Metropolitana.

### C. Flash Live (Transmisiones en Directo)
- **Hub de Transmisiones (`/live`):** Explorador de directos activos ("🔴 EN DIRECTO"), programados y finalizados leyendo de Firestore `liveStreams`.
- **Panel del Anfitrión:** Creación de salas vía Cloud Functions `createLiveStream`, inicio con `startLiveStream` y cierre con `endLiveStream`.
- **Chat Público en Tiempo Real:** Subcolección `liveStreams/{id}/messages` protegida por reglas de Firestore, con distinción visual del vendedor anfitrión.

---

## 4. Estado de la Suite de Pruebas

- **Compilación de Producción:** `npm run build` (`tsc -b && vite build`) genera los bundles limpios en `dist/` (0 errores TypeScript).
- **Pruebas Unitarias, de Dominio y de Integridad (`npm test`):** **40 / 40 aprobadas** (Dominio, Demo, Radar Flash, Flash Live, Seed de 15 usuarios / 60 productos y Unificación de arquitectura).
- **Pruebas de Emuladores (`npm run test:emulators`):** **28 / 28 aprobadas** (Reglas de seguridad de Firestore, Authentication, Functions y Storage con 8 flujos E2E completos).
- **Total de pruebas automatizadas activas:** **68 pruebas** (100% aprobadas).

---

## 5. Tabla de Usuarios de Prueba Pre-Poblados

Contraseña universal para todas las cuentas en Firebase Auth: `Password123!`

| Nombre | Rol | Correo Electrónico | Distrito | Verificado |
| :--- | :--- | :--- | :--- | :---: |
| **Diego Rodríguez** | Vendedor | `diego.vendedor@ventasflash.pe` | Miraflores | ✅ Sí |
| **Camila Paredes** | Vendedora | `camila.vendedora@ventasflash.pe` | San Isidro | ✅ Sí |
| **Andrés Mendoza** | Vendedor | `andres.vendedor@ventasflash.pe` | Barranco | ✅ Sí |
| **Lucía Vega** | Vendedora | `lucia.vendedora@ventasflash.pe` | Surco | ✅ Sí |
| **Renzo Salazar** | Vendedor | `renzo.vendedor@ventasflash.pe` | San Borja | ⏳ Pendiente |
| **Patricia Benavides** | Vendedora | `patricia.vendedora@ventasflash.pe` | Jesús María | ⏳ Pendiente |
| **Carlos Ramos** | Comprador | `carlos.comprador@ventasflash.pe` | Miraflores | ✅ Sí |
| **Marta Castillo** | Compradora | `marta.compradora@ventasflash.pe` | San Isidro | ✅ Sí |
| **Fernando Chávez** | Comprador | `fernando.comprador@ventasflash.pe` | Surco | ❌ No |
| **Sofía Alarcón** | Compradora | `sofia.compradora@ventasflash.pe` | Barranco | ✅ Sí |
| **Rodrigo Morales** | Comprador | `rodrigo.comprador@ventasflash.pe` | San Borja | ❌ No |
| **Valeria Tello** | Compradora | `valeria.comprador@ventasflash.pe` | Magdalena | ❌ No |
| **Gonzalo Rivas** | Comprador | `gonzalo.comprador@ventasflash.pe` | Lince | ❌ No |
| **Andrea Quintana** | Compradora | `andrea.comprador@ventasflash.pe` | Pueblo Libre | ❌ No |
| **Javier Cáceres** | Comprador | `javier.comprador@ventasflash.pe` | San Miguel | ❌ No |
