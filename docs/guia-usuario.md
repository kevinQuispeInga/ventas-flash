# Guía del Usuario · Ventas Flash

**Ventas Flash** es un marketplace peruano diseñado para la compraventa ágil, segura y sin esperas, combinando subastas en tiempo real, remates descendentes, geolocalización por radar y transmisiones en vivo.

---

## 1. Modos de Operación

Puedes utilizar Ventas Flash en dos modalidades gratuitas:

| Modo | Características | Cómo activarlo |
| :--- | :--- | :--- |
| **Modo Firebase (Emuladores)** | Backend real local con Authentication, Firestore, Cloud Functions y Cloud Storage. Soporta múltiples usuarios simultáneos en ventanas de incógnito. | Ejecutar `.\iniciar-emuladores.ps1` y luego `.\iniciar-frontend.ps1` |
| **Modo DEMO (LocalStorage)** | Funciona completamente desconectado sin emuladores. Permite alternar entre los usuarios ficticios **Marta** y **Carlos**. | Ejecutar `.\iniciar-modo-demo.ps1` |

---

## 2. Registro e Inicio de Sesión

1. Haz clic en el botón de perfil superior derecho ("Ingresar").
2. En la pantalla de acceso puedes:
   - Crear una nueva cuenta con nombre, correo y contraseña.
   - Iniciar sesión con una cuenta existente.
   - En **Modo DEMO**, alternar con un clic entre **Marta** y **Carlos**.
3. **Verificación de correo:** Para operar en Firebase, verifica tu correo con el enlace que genera el emulador de Auth (visible en la consola del emulador o en la interfaz `http://127.0.0.1:4000/auth`).

---

## 3. Explorar el Catálogo y Comprar

### Modalidades de Publicación:
- **Subasta Flash (Verde Lima):** Artículos contrarreloj de corta duración.
  - El precio sube con cada puja (mínimo S/ 50 de incremento).
  - **Reloj Anti-robo:** Si ingresa una puja cuando quedan menos de 30 segundos, el reloj se extiende automáticamente 60 segundos más.
  - **Auto-puja:** Puedes configurar un tope máximo. El sistema pujará por ti el mínimo necesario para liderar sin revelar tu tope a nadie.
- **Remate Flash (Naranja):** El precio desciende automáticamente cada 30 segundos hasta un valor piso. Quien hace clic primero en "Comprar ahora", se lo lleva.
- **Compra Directa (Verde Bosque):** Venta tradicional con precio fijo e inmediata.

### Checkout y Tarifa de Protección:
- Al comprar, se desglosa el precio y la **Tarifa de Protección del 4%** (destinada a la garantía de entrega y soporte).
- En este entorno de demostración **no se requiere tarjeta ni se cobra dinero real**.

---

## 4. Radar Flash (Exploración Geográfica)

1. Ingresa desde el menú superior en **"Radar Flash"** o desde el botón en el banner de inicio.
2. **Permisos de Ubicación:**
   - Si autorizas el GPS del navegador, el mapa se centrará en tu posición aproximada.
   - Si deniegas el permiso, puedes elegir manualmente cualquiera de los **12 distritos de Lima** disponibles (Miraflores, San Isidro, Barranco, Surco, San Borja, etc.).
3. **Filtros de Radio:** Selecciona 1 km, 2 km, 3 km, 5 km, 10 km o "Todos" para descubrir ofertas cercanas a tu zona.
4. **Pines en el Mapa:**
   - Verde lima: Subasta.
   - Naranja: Remate.
   - Verde bosque: Compra directa.
   - Rojo pulsante: Artículo transmitiéndose en vivo en Flash Live.
5. Haz clic en cualquier pin para ver la foto, precio actual, distancia estimada y botón para ver la ficha completa.

---

## 5. Flash Live (Transmisiones en Directo)

### Cómo Ver y Participar en un Directo:
1. Haz clic en la pestaña **"Flash Live"** en la navegación.
2. Selecciona un directo con el badge rojo **"EN DIRECTO"**.
3. Dentro de la sala interactiva podrás:
   - Ver el vídeo en directo del anfitrión (conmutando entre cámara WebRTC o Modo Demostración).
   - Observar el producto destacado en tiempo real con su precio y temporizador.
   - Realizar **pujas rápidas** (+S/ 50, +S/ 100, +S/ 200) o ingresar una postura personalizada.
   - Chatear con el anfitrión y otros compradores en el chat público en vivo.

### Cómo Crear tu Propia Transmisión (Vendedores):
1. Publica primero uno o más productos desde **"Vender rápido"**.
2. En la página de Flash Live, presiona **"Transmitir en Flash Live"**.
3. Escribe un título, descripción y marca los productos de tu catálogo que vas a mostrar.
4. Entra a tu sala como anfitrión y presiona **"Iniciar transmisión en vivo"**.
5. Podrás conmutar entre los productos presentados y finalizar el directo cuando lo desees.

---

## 6. Postventa: Chat y Confirmación de Entrega

1. Tras ganar una subasta o comprar un producto, la orden aparece en **"Mis compras"** (`/pedidos`).
2. Haz clic en la orden para abrir el **Chat Postventa Bilateral** para coordinar la entrega física (lugar seguro en Lima, fecha y hora).
3. Una vez recibido el artículo a satisfacción, el comprador debe hacer clic en **"Confirmar recepción del producto"**.
4. Esta acción cierra definitivamente la transacción y libera el depósito en garantía simulado.
