# Arquitectura Técnica Final · Ventas Flash

**Ventas Flash** ha sido construido bajo un estándar de ingeniería Full Stack Senior, priorizando integridad transaccional, seguridad basada en privilegios mínimos, costo S/ 0 y resiliencia ante caídas de red o fallos de hardware.

---

## 1. Diagrama de Arquitectura Global

```
+---------------------------------------------------------------------------------------+
|                                    NAVEGADOR CLIENTE                                  |
|                                                                                       |
|   React 19 + TypeScript + Vite 6 + Tailwind 4                                         |
|                                                                                       |
|   [Catálogo / Subastas]    [Radar Flash (Leaflet/OSM)]   [Flash Live (WebRTC / Demo)] |
|             |                            |                              |             |
|   +---------v----------------------------v------------------------------v---------+   |
|   |                        MarketplaceService (Contrato)                         |   |
|   +-------------------+-----------------------------------+-----------------------+   |
|                       |                                   |                           |
|             +---------v---------+               +---------v---------+                 |
|             |   FirebaseService |               |    DemoService    |                 |
|             +---------+---------+               +---------+---------+                 |
|                       | (gRPC / HTTP / WSS)               | (In-Memory / LocalStorage)|
+-----------------------|-----------------------------------|---------------------------+
                        |                                   |
+-----------------------v-----------------------------------+---------------------------+
|                          BACKEND LOCAL: FIREBASE EMULATOR SUITE                       |
|                                                                                       |
|   +-----------------------+     +-----------------------+     +-------------------+   |
|   |  Firebase Auth (9099) |     | Cloud Storage (9199)  |     |   Firestore (8080)|   |
|   |  Perfiles & Tokens    |     | Fotos de Productos    |     |   Colecciones     |   |
|   +-----------------------+     +-----------------------+     +---------^---------+   |
|                                                                         |             |
|                                                                   Transacciones       |
|                                                                     Atómicas          |
|                                                                         |             |
|                           +-------------------------------+             |             |
|                           | Cloud Functions v2 (Port 5001)|-------------+             |
|                           |                               |                           |
|                           | * placeBid (Anti-sniping)     |                           |
|                           | * setAutoBid (Privacidad)     |                           |
|                           | * purchaseProduct (4% Tarifa) |                           |
|                           | * createLiveStream / start/end|                           |
|                           | * confirmReceipt (Escrow)     |                           |
|                           +-------------------------------+                           |
+---------------------------------------------------------------------------------------+
```

---

## 2. Decisiones Arquitectónicas Clave

### A. Prevención de Manipulación Cliente (Zero Trust)
Ninguna operación financiera, de pujas o de cambio de titularidad se delega al navegador:
1. `products/{id}` tiene `allow write: if false` en Firestore Rules. Solo Cloud Functions modifica precios, ganadores o líderes tras verificar la validez del estado.
2. Las coordenadas geográficas son redondeadas por Cloud Functions a 4 decimales (~11m de precisión) para impedir que un usuario inyecte coordenadas de alta precisión que revelen una dirección física privada.

### B. Motor de Subastas Determinista y Anti-Robo
- **Sincronización:** El tiempo oficial se calcula mediante `serverTimestamp` / hora del servidor en Firestore.
- **Reloj Anti-robo:** Si `endAt - now <= 30 segundos`, la Cloud Function `placeBid` extiende automáticamente `endAt = now + 60 segundos`.
- **Auto-puja Segura:** Los documentos `auctions/{id}/autoBids/{uid}` solo son legibles por su propio autor (`allow read: if self(uid)`). El motor de backend calcula internamente la competencia de posturas sin exponer los topes a postores rivales ni al vendedor.

### C. Módulo Geográfico Determinista (Radar Flash)
- **Cálculo Haversine Puro:** Implementado en `src/lib/geo.ts` y exportado en `functions/src/domain.ts` con paridad matemática estricta a nivel de céntimos de kilómetro.
- **Mapas:** Integración de OpenStreetMap mediante Leaflet, utilizando iconos vectoriales (`L.divIcon` con SVG en línea) para eliminar dependencias de imágenes externas que fallen offline.
- **Dispersión de Privacidad (`approximateCoordinates`):** Aplica una dispersión radial máxima de ~250m sobre el centroide distrital, evitando concentraciones masivas de publicaciones en el mismo píxel del mapa.

### D. Flash Live: Arquitectura Híbrida de Vídeo
- **WebRTC P2P:** Captura mediante `getUserMedia` y señalización en `liveStreams/{id}/signaling/{uid}` protegida por reglas de Firestore.
- **Modo Demostración Sintético:** Si el evaluador no cuenta con cámara física o se deniegan los permisos, el sistema conmuta a un reproductor canvas que simula una emisión de estudio a 30 FPS con audio gráfico y reloj sincronizado.
- **Independencia de Subastas:** Finalizar un directo no interrumpe ni anula subastas vigentes; estas continúan corriendo en el catálogo general hasta su vencimiento natural.

---

## 3. Modelo de Datos de Firestore

| Colección / Ruta | Propósito | Regla de Acceso |
| :--- | :--- | :--- |
| `/users/{uid}` | Perfil público, verificación e historial | Lectura propia, escritura solo por backend |
| `/users/{uid}/operations/{id}` | Idempotencia de solicitudes | Privado para el backend |
| `/products/{id}` | Catálogo de productos, precios y geo | Lectura pública, escritura por backend |
| `/auctions/{id}` | Estado económico de subastas activas | Lectura pública, escritura por backend |
| `/auctions/{id}/bids/{bidId}` | Historial público de pujas | Lectura pública, escritura por backend |
| `/auctions/{id}/autoBids/{uid}` | Límite máximo confidencial de auto-puja | Solo lectura por el postor dueño |
| `/descendingSales/{id}` | Configuración del remate holandés | Lectura pública, cálculo por backend |
| `/transactions/{id}` | Órdenes de compra y tarifa del 4% | Solo participantes (comprador y vendedor) |
| `/escrowPayments/{id}` | Depósito en garantía simulado | Solo participantes, escritura por backend |
| `/deliveries/{id}` | Estado de recepción física | Solo participantes, confirmable por comprador |
| `/conversations/{id}/messages/{mid}` | Chat bilateral postventa | Solo participantes de la transacción |
| `/liveStreams/{id}` | Salas de transmisión Flash Live | Lectura pública, control por anfitrión vía Functions |
| `/liveStreams/{id}/messages/{mid}` | Chat público del directo | Lectura pública, creación por usuarios verificados |
| `/liveStreams/{id}/signaling/{uid}` | Ofertas, respuestas e ICE WebRTC | Participantes autenticados |
| `/favorites/{uid}/items/{pid}` | Artículos favoritos personales | Privado por usuario autenticado |
