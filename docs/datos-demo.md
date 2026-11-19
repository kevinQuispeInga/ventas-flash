# 🇵🇪 Guía Maestra de Datos de Prueba (SEED) - Ventas Flash

Este documento detalla el sistema de datos iniciales (**SEED**) de Ventas Flash, diseñado para pruebas funcionales, visuales y de rendimiento bajo una **restricción estricta de Costo S/ 0** (Firebase Emulator Suite y Modo DEMO en LocalStorage).

---

## 👥 Tabla Completa de los 15 Usuarios de Prueba

Todos los usuarios cuentan con la **contraseña universal**:  
👉 `Password123!`

### 🛒 Vendedores (6 Cuentas)

| Nombre | Rol | Correo Electrónico | Distrito | Verificado | Especialidad / Catálogo |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Diego Rodríguez** | Vendedor | `diego.vendedor@ventasflash.pe` | Miraflores | ✅ Sí | Ecosistema Apple, MacBooks, Gadgets de alta gama |
| **Camila Paredes** | Vendedora | `camila.vendedora@ventasflash.pe` | San Isidro | ✅ Sí | Smartphones, iPhones de última generación |
| **Andrés Mendoza** | Vendedor | `andres.vendedor@ventasflash.pe` | Barranco | ✅ Sí | Instrumentos musicales, guitarras, sintetizadores |
| **Lucía Vega** | Vendedora | `lucia.vendedora@ventasflash.pe` | Surco | ✅ Sí | Fotografía profesional, cámaras Sony, lentes |
| **Renzo Salazar** | Vendedor | `renzo.vendedor@ventasflash.pe` | San Borja | ⏳ Pendiente | Consolas PlayStation 5, videojuegos, gaming |
| **Patricia Benavides** | Vendedora | `patricia.vendedora@ventasflash.pe` | Jesús María | ⏳ Pendiente | Audio Hi-Fi, audífonos inalámbricos Bose y Sony |

### 🛍️ Compradores (9 Cuentas)

| Nombre | Rol | Correo Electrónico | Distrito | Verificado | Perfil de Compra |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Carlos Ramos** | Comprador | `carlos.comprador@ventasflash.pe` | Miraflores | ✅ Sí | Postor activo en tecnología y laptops |
| **Marta Castillo** | Compradora | `marta.compradora@ventasflash.pe` | San Isidro | ✅ Sí | Compradora recurrente, chats postventa |
| **Fernando Chávez** | Comprador | `fernando.comprador@ventasflash.pe` | Surco | ❌ No | Fanático de gaming y consolas |
| **Sofía Alarcón** | Compradora | `sofia.compradora@ventasflash.pe` | Barranco | ✅ Sí | Pujadora en iPhones y accesorios |
| **Rodrigo Morales** | Comprador | `rodrigo.comprador@ventasflash.pe` | San Borja | ❌ No | Interesado en instrumentos y audio |
| **Valeria Tello** | Compradora | `valeria.comprador@ventasflash.pe` | Magdalena | ❌ No | Cazadora de ofertas en remates |
| **Gonzalo Rivas** | Comprador | `gonzalo.comprador@ventasflash.pe` | Lince | ❌ No | Coleccionista de cámaras y zapatillas |
| **Andrea Quintana** | Compradora | `andrea.comprador@ventasflash.pe` | Pueblo Libre | ❌ No | Compradora en transmisiones Flash Live |
| **Javier Cáceres** | Comprador | `javier.comprador@ventasflash.pe` | San Miguel | ❌ No | Búsquedas de proximidad en Radar Flash |

---

## 🚀 Guía de Inicio Rápido

### Opción A: Modo DEMO (Navegador 100% Autónomo)

No requiere levantar terminales adicionales ni emuladores:

1. Inicia la aplicación web:
   ```bash
   npm run dev
   ```
2. Abre en tu navegador `http://localhost:5173`.
3. Verás en la parte inferior la **Barra de Pruebas (Dev Toolbar)**:
   - Haz clic en **`🌱 Cargar 60 productos SEED`** para poblar el catálogo completo al instante.
   - Usa el selector rápido de usuario para cambiar de identidad con un solo clic.
   - Haz clic en **`Credenciales (15)`** para abrir el panel modal, copiar correos o contraseñas y alternar entre vendedores y compradores.
   - Si deseas volver a un estado limpio, haz clic en **`Restablecer`**.

---

### Opción B: Modo Firebase Emulator Suite (Backend Local Completo)

1. En una terminal, arranca los emuladores locales de Firebase:
   ```bash
   npm run emulators
   ```
   *(Levanta Auth en :9099, Firestore en :8080, Functions en :5001 y Storage en :9199)*.

2. En una segunda terminal, ejecuta el script de población SEED:
   ```bash
   npm run seed:emulators
   ```
   *Poblará de forma idempotente los 15 usuarios en Authentication y Firestore, 60 productos en Firestore con sus subastas, ofertas y remates, 5 transmisiones Flash Live con mensajes de chat y órdenes postventa con custodia simulada.*

3. Inicia el frontend conectado a los emuladores:
   ```bash
   VITE_BACKEND=firebase npm run dev
   ```

---

## 📦 Resumen de Datos Generados

| Módulo | Cantidad | Detalle |
| :--- | :---: | :--- |
| **Usuarios** | 15 | 6 vendedores y 9 compradores peruanos con avatares y bios. |
| **Productos Totales** | 60 | En moneda nacional Soles (**S/**). |
| ↳ *Ventas Normales* | 25 | Compra inmediata con checkout simulado (4% comisión). |
| ↳ *Subastas Contrarreloj* | 25 | 15 activas (con reloj anti-robo), 5 programadas y 5 cerradas. |
| ↳ *Remates Descendentes* | 10 | Precio en decremento periódico cada 30s hasta precio piso. |
| **Categorías** | 12 | Tecnología, Laptops, Celulares, Videojuegos, Fotografía, Música, Zapatillas, Deportes, Accesorios, Electrodomésticos, Muebles, Ropa. |
| **Distritos de Lima** | 12 | Miraflores, San Isidro, Barranco, Surco, San Borja, Jesús María, Magdalena, Lince, Pueblo Libre, San Miguel, La Molina, Cercado de Lima. |
| **Flash Live** | 5 | 2 en vivo (live), 2 programadas y 1 finalizada. |
| **Mensajes de Chat Live** | 12+ | Preguntas de compradores y respuestas de anfitriones. |
| **Órdenes y Custodia** | 2 | Transacciones con chat bilateral, pago en custodia y confirmación de entrega. |

---

## 🎯 Casos de Uso y Pruebas Recomendadas

### 1. Subasta Activa y Reloj Anti-robo
- Cambia a **Carlos Ramos** (`carlos.comprador@ventasflash.pe`).
- Entra al producto `prod-sub-01` (**MacBook Air M1**).
- Observa el cronómetro en reversa.
- Realiza una puja cuando falten menos de 30 segundos: el reloj se extenderá automáticamente en 60 segundos (reloj anti-robo).

### 2. Remate con Precio Descendente
- Entra al producto `prod-rem-01` (**Sony WH-1000XM5**) o `prod-rem-02`.
- Observa la etiqueta de remate con el precio actual disminuyendo cada 30 segundos hacia el precio piso.
- Haz clic en **Comprar ahora** para congelar el precio en su valor exacto actual.

### 3. Radar Flash con Anillos de Distancia
- Haz clic en la pestaña **Radar Flash** en la barra de navegación superior.
- Selecciona tu distrito base:
  - **Miraflores**: Verás 11 productos inmediatos en el anillo de 1 km a 2 km.
  - **San Isidro**: Verás los productos del centro financiero.
  - **Surco** o **Barranco**: Observa cómo cambia la densidad de pines.
- Filtra por distancia: **1 km**, **2 km**, **3 km**, **5 km** o **10 km** para verificar la precisión del cálculo Haversine.

### 4. Flash Live Streaming
- Haz clic en la pestaña **Flash Live** en la navegación.
- Entra a la transmisión **"TecnoFlash Live: Subasta de MacBook y Gadgets de Lima"** conducida por **Diego Rodríguez**.
- Como espectador (**Marta** o **Carlos**), escribe en el chat público interactivo.
- Observa la insignia de anfitrión en los mensajes del vendedor.
- Puja directamente en el producto destacado de la transmisión.

### 5. Chat Postventa y Custodia Simulada
- Inicia sesión como **Marta Castillo** e ingresa a **Mis Pedidos**.
- Abre la orden del **Apple Watch Ultra 2**.
- Observa los mensajes intercambiados con Diego Rodríguez.
- Si el producto está pendiente de recepción, pulsa **"Confirmar que recibí el producto"** para liberar el depósito simulado en custodia (escrow).
