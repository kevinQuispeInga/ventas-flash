# Ventas Flash ⚡ Marketplace Peruano

Plataforma web SPA completa de comercio electrónico y subastas en tiempo real para Perú (moneda en Soles `S/`), construida con **React 19**, **TypeScript**, **Vite 6**, **Tailwind CSS 4** y **Firebase Emulator Suite**.

**Costo de desarrollo e infraestructura:** **S/ 0.00** (sin tarjetas de crédito, sin plan Blaze y sin servicios de pago).

---

## 🚀 Características Principales

1. **Subastas Contrarreloj & Reloj Anti-Robo (Anti-Sniping):**
   - Subastas con cuenta regresiva en vivo e incrementos mínimos de S/ 50.
   - Extensión automática de 60 segundos si ingresa una puja en los últimos 30 segundos.
   - **Auto-puja inteligente:** Configura un tope máximo confidencial; el motor puja por ti el mínimo necesario para liderar sin revelar tu presupuesto.
2. **Remates Descendentes:**
   - Descenso automático de precio cada 30 segundos basado en tiempo del servidor hasta un piso garantizado.
3. **Compra Inmediata & Protección del 4%:**
   - Checkout con desglose exacto de la tarifa de protección del 4%. Fondos en depósito en garantía (escrow) simulado.
4. **Radar Flash (Geolocalización & Búsqueda Espacial):**
   - Mapa interactivo con **Leaflet** y teselas de **OpenStreetMap**.
   - Detección GPS del navegador o selección manual entre 12 distritos de Lima.
   - Filtros de proximidad en tiempo real (1 km, 2 km, 3 km, 5 km, 10 km y Todos).
   - Privacidad garantizada: dispersión espacial de publicaciones para proteger domicilios exactos.
5. **Flash Live (Transmisiones en Directo):**
   - Salas interactivas donde los vendedores presentan productos en vídeo.
   - **Arquitectura Híbrida:** Cámara WebRTC P2P con señalización en Firestore o Modo Demostración asistido por Canvas sintético a 30 FPS.
   - Subastas y compras sincronizadas durante la transmisión.
   - Chat público en vivo independiente del chat privado postventa.
6. **Postventa Bilateral & Confirmación de Recepción:**
   - Mensajería en tiempo real entre comprador y vendedor para coordinar la entrega física en Lima.
   - Confirmación de recepción exclusiva del comprador para liberar el escrow simulado.

---

## 🛠️ Inicio Rápido con Un Solo Comando

Ventas Flash opera como una **única aplicación unificada** utilizando **Firebase Emulator Suite** como su backend principal y fuente única de datos, con persistencia automática de registros en `./emulator-data`:

### Opción 1: Script de PowerShell (Windows)
```powershell
.\iniciar-todo.ps1
```

### Opción 2: Script Node / npm
```bash
npm start
```

Ambos comandos verifican dependencias, levantan Firebase Emulator Suite (Auth, Firestore, Functions, Storage) importando `./emulator-data` y arrancan el servidor web frontend.

- **Aplicación Web:** [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **Panel de Control de Emuladores:** [http://127.0.0.1:4000](http://127.0.0.1:4000)

---

## 👥 Credenciales de Prueba (Pre-Pobladas en Auth y Firestore)

> **Contraseña universal para todas las cuentas:** `Password123!`

- **Vendedor:** `diego.vendedor@ventasflash.pe` (Miraflores, Insignia Verificada)
- **Vendedora:** `camila.vendedora@ventasflash.pe` (San Isidro, Insignia Verificada)
- **Comprador:** `carlos.comprador@ventasflash.pe` (Miraflores, Insignia Verificada)
- **Compradora:** `marta.compradora@ventasflash.pe` (San Isidro, Insignia Verificada)

*(Ver lista completa de 15 usuarios en [docs/datos-demo.md](docs/datos-demo.md) o en la barra inferior de desarrollo de la aplicación).*

---

## 🧪 Pruebas Automatizadas

El proyecto cuenta con **68 pruebas automatizadas** ejecutadas con 100% de aprobación:

```bash
# Ejecutar 40 pruebas unitarias, de dominio, geolocalización, transmisiones y seed:
npm test

# Ejecutar 28 pruebas completas de emuladores (reglas de seguridad, integración y 8 flujos E2E):
npm run test:emulators
```

```powershell
# Pruebas unitarias de dominio, demo, radar y directos (30 pruebas):
npm test

# Pruebas de emuladores: reglas de seguridad, integración y 8 flujos E2E (28 pruebas):
npm run test:emulators

# Verificación de compilación TypeScript y producción:
npm run build
```

---

## 📚 Documentación del Proyecto

- [Guía del Usuario](docs/guia-usuario.md): Manual paso a paso para compradores y vendedores.
- [Instalación en Windows](docs/instalacion-windows.md): Requisitos y solución de problemas comunes.
- [Arquitectura Técnica](docs/arquitectura-final.md): Diagrama global y decisiones de diseño.
- [Informe de Pruebas](docs/pruebas-finales.md): Detalle de las 58 pruebas automatizadas.
- [Limitaciones y Alcance Gratuito](docs/limitaciones.md): Transparencia sobre pasarelas reales y cloud.
- [Estado de Desarrollo](docs/estado-desarrollo.md): Registro de fases y hoja de ruta.
