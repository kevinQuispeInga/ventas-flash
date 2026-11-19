# Limitaciones Técnicas y Alcance Gratuito · Ventas Flash

**Ventas Flash** ha sido desarrollado bajo la premisa irrestricta de **Costo S/ 0**, sin requerir tarjetas bancarias, facturación ni activación del plan Firebase Blaze.

A continuación se documentan de forma transparente las limitaciones inherentes a este alcance y las adaptaciones implementadas para garantizar una experiencia completa y profesional.

---

## 1. Infraestructura Cloud y Costo S/ 0

| Componente | Alcance Gratuito Actual (Local / Spark) | Requisito para Producción a Escala |
| :--- | :--- | :--- |
| **Backend & Base de Datos** | Firebase Emulator Suite local (`demo-ventas-flash`) | Proyecto Firebase remoto en la nube con plan Blaze (pago por uso) |
| **Cloud Functions** | Emuladas localmente en Node.js v24 (`http://127.0.0.1:5001`) | Despliegue de funciones serverless en Google Cloud Functions |
| **Almacenamiento de Fotos** | Cloud Storage Emulator (`http://127.0.0.1:9199`) | Bucket real de Google Cloud Storage con reglas de seguridad |
| **Base de Datos en Tiempo Real** | Cloud Firestore Emulator (`http://127.0.0.1:8080`) | Instancia multi-región de Cloud Firestore |

---

## 2. Transmisión de Vídeo WebRTC (Flash Live)

1. **Topología P2P (Peer-to-Peer):**
   - El sistema utiliza WebRTC directo entre navegadores utilizando servidores STUN públicos gratuitos (`stun:stun.l.google.com:19302`) y señalización mediante Firestore.
   - **Limitación:** En entornos con NATs simétricos corporativos o firewalls estrictos sin servidor TURN de retransmisión, la conexión P2P directa entre dos equipos remotos puede no establecerse.
   - **Solución implementada:** Se diseñó el **Modo Demostración (Canvas 30 FPS)**, que asegura que cualquier evaluador pueda visualizar la sala, pujar en vivo y chatear sin depender de conectividad externa ni servidores TURN comerciales.
   - **Escalabilidad masiva:** Para directos con más de 10-20 espectadores simultáneos, una topología Mesh P2P satura el ancho de banda del vendedor. En producción se requiere un servidor SFU (Selective Forwarding Unit) como LiveKit o Mediasoup.

---

## 3. Pagos y Pasarelas Financieras

1. **Transacciones Simuladas:**
   - La tarifa del 4% y los importes de compra se calculan de manera exacta en céntimos enteros en el servidor, pero **no se debitan fondos reales de cuentas bancarias**.
   - El proveedor figura como `"demo"` en las transacciones y pagos de escrow.
2. **Depósito en Garantía (Escrow):**
   - El campo `realFundsHeld` en `escrowPayments` se mantiene estrictamente en `false`.
   - Para producción, se requeriría una pasarela de pago peruana autorizada (Culqi, Izipay, Niubiz o Mercado Pago) con cuenta recaudadora bancaria.

---

## 4. Verificación de Identidad (RENIEC)

1. **Estado de Verificación:**
   - Los perfiles de demostración (Marta, Carlos, Diego) muestran insignias de verificación basadas en los campos booleanos de Firestore (`identityVerified: true`).
   - El sistema **no consulta la base de datos oficial de RENIEC**, ya que esta exige convenios institucionales de pago por consulta y credenciales gubernamentales peruanas.

---

## 5. Mapas y Geolocalización (Radar Flash)

1. **OpenStreetMap y Leaflet:**
   - Se utilizan teselas públicas gratuitas de OpenStreetMap respetando la política de uso razonable y atribución en pantalla. No se utiliza Google Maps Platform (que requiere tarjeta de crédito y facturación activa).
2. **Geolocalización del Navegador:**
   - La precisión depende del hardware del usuario (antena GPS en celular o triangulación IP/Wi-Fi en computadora de escritorio).
   - Cuando el usuario deniega el permiso o se encuentra fuera de Lima, el sistema ofrece una selección de distritos de referencia con fallback transparente a Miraflores.
