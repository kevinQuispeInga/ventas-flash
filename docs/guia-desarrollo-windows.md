# Guía de Ejecución en Windows · Ventas Flash (Costo S/ 0)

Esta guía explica cómo ejecutar y verificar Ventas Flash en tu computadora utilizando **Firebase Emulator Suite** y el frontend en **React + Vite**, con costo S/ 0 y sin requerir cuentas de pago ni tarjetas de crédito.

---

## 1. Requisitos Previos

- **Node.js:** v22 o v24 instalado.
- **Java JDK:** Java 21+ instalado (necesario para el emulador de Firestore).
- **Navegador web:** Chrome, Edge o Firefox.

---

## 2. Iniciar el Entorno con Firebase Emulator Suite

Para probar el backend completo (Authentication, Cloud Firestore, Cloud Functions y Storage):

### Paso 1: Levantar los Emuladores
Abre una terminal PowerShell en la carpeta del proyecto y ejecuta:

```powershell
.\iniciar-emuladores.ps1
```
*(O alternativamente: `npm run emulators`)*

Esto iniciará los siguientes servicios locales en tu máquina:
- **Panel de Control UI:** [http://127.0.0.1:4000](http://127.0.0.1:4000) (puedes ver usuarios, colecciones Firestore y archivos Storage visualmente).
- **Auth Emulator:** `http://127.0.0.1:9099`
- **Firestore Emulator:** `http://127.0.0.1:8080`
- **Functions Emulator:** `http://127.0.0.1:5001`
- **Storage Emulator:** `http://127.0.0.1:9199`

### Paso 2: Iniciar el Frontend React
En **otra ventana** de PowerShell en la misma carpeta, ejecuta:

```powershell
.\iniciar-frontend.ps1
```
*(O alternativamente: `npm run dev`)*

Abre tu navegador en:
**[http://127.0.0.1:5173](http://127.0.0.1:5173)**

Verás el cintillo superior:  
`Modo Firebase · datos de Firestore · Pagos DEMO: no se cobra ni se retiene dinero real.`

---

## 3. Flujo de Prueba Paso a Paso entre Dos Usuarios

### A. Crear el Usuario 1 (Vendedor - Diego)
1. Ve a `/acceso` (haz clic en "Ingresar" en la barra superior).
2. Selecciona **"Crear cuenta"**.
3. Ingresa:
   - **Nombre:** Diego Vendedor
   - **Correo:** `diego@test.pe`
   - **Contraseña:** `Password123!` (mínimo 8 caracteres)
4. Pulsa **"Registrarme"**.
5. Ve a **"Mi perfil"**. Verás `Correo: Pendiente de verificación`.
6. En la ventana donde corren los emuladores, verás el enlace de verificación generado por Auth Emulator:
   `http://127.0.0.1:9099/emulator/action?mode=verifyEmail&...`
   Abre ese enlace en tu navegador para verificar el correo y luego pulsa en la app **"Ya verifiqué mi correo"**.

### B. Publicar un Producto con Imagen
1. Ve a **"Vender rápido"** (`/vender`).
2. Sube una foto (JPG, PNG o WebP, menor a 2 MB).
3. Ingresa título: *Bicicleta Montaña Trek*.
4. Prueba el botón **"Ayúdame con IA simulada"** para rellenar la descripción automáticamente.
5. Elige modalidad **Subasta**, precio inicial `500`.
6. Pulsa **"Publicar producto"**.
7. La foto se sube a Firebase Storage local y el producto se indexa en Firestore.

### C. Crear el Usuario 2 (Compradora - Camila) y Probar Tiempo Real
1. Abre una ventana de **incógnito** o un navegador secundario en `http://127.0.0.1:5173`.
2. Regístrate como `camila@test.pe` / `Password123!`.
3. Verifica su correo siguiendo el mismo procedimiento.
4. En el catálogo, Camila verá la publicación de Diego en tiempo real.
5. Camila ingresa al detalle de la subasta y puja `550`.
6. **En la pantalla de Diego**, la puja se actualiza en vivo sin recargar la página.
7. Camila prueba la **Auto-puja inteligente** estableciendo un techo privado de `1000`.

### D. Compra Inmediata, Chat Postventa y Confirmación de Recepción
1. En un producto de compra directa o al ganar una subasta, Camila hace clic en **"Comprar ahora"**.
2. En el checkout, se calcula la tarifa del 4% (S/ 20.00 en una compra de S/ 500.00). Total: S/ 520.00.
3. Se confirma la compra DEMO (sin dinero real).
4. Ambas partes van a **"Mis compras"** (`/pedidos`):
   - Se abre el panel con estado `Entrega pendiente`.
   - Se abre el **Chat de entrega**. Camila escribe un mensaje y Diego lo recibe instantáneamente vía Firestore listener.
   - Solo Camila (la compradora) tiene habilitado el botón **"Confirmar que recibí el producto"**.
   - Al confirmarlo, el pedido pasa a `Completado` y el depósito simulado se libera.

---

## 4. Cómo Detener los Servicios

- Para detener el Frontend: presiona `Ctrl + C` en su ventana de PowerShell.
- Para detener los Emuladores: presiona `Ctrl + C` en su ventana de PowerShell.

---

## 5. Volver al Modo DEMO (LocalStorage)

Si deseas utilizar la aplicación sin tener los emuladores de Firebase encendidos (con usuarios locales simulados Marta y Carlos):

Ejecuta:
```powershell
.\iniciar-modo-demo.ps1
```

O edita `.env.local`:
```dotenv
VITE_BACKEND=demo
VITE_USE_FIREBASE_EMULATORS=false
```
Y ejecuta `npm run dev`.
