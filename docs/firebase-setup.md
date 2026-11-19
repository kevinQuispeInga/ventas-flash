# Conectar Firebase

## Estado y alcance

El proyecto arranca en DEMO si `VITE_BACKEND` no está definida. No se ha creado una cuenta/proyecto Firebase ni se ha desplegado nada. Firebase SDK instalado, funciones compilables y reglas preparadas. Los pagos siguen siendo DEMO incluso con Firebase: no hay proveedor de cobro real ni custodia de dinero.

## Desarrollo local con Emulator Suite

Requisitos: Node 22 (runtime del backend), Java 21+, npm. El equipo actual tiene Node 24; las pruebas locales pueden ejecutarse con él, pero producción está declarada en Node 22.

1. `npm ci` y `npm ci --prefix functions`.
2. `npm run test` prueba el motor puro. `npm run test:emulators` levanta servicios locales, ejecuta reglas/integración y los detiene. No necesita cuenta Firebase.
3. Para probar la interfaz: `npm run emulators`. Los emuladores usan el proyecto sintético oficial de desarrollo `demo-ventas-flash`, no una cuenta existente.
4. Copia `.env.example` a `.env.local` y utiliza **solo para emuladores**:

```dotenv
VITE_BACKEND=firebase
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_PROJECT_ID=demo-ventas-flash
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_AUTH_DOMAIN=localhost
VITE_FIREBASE_STORAGE_BUCKET=demo-ventas-flash.appspot.com
VITE_FIREBASE_APP_ID=demo-app
VITE_FIREBASE_FUNCTIONS_REGION=us-central1
```

Estos valores son identificadores de emulación, no credenciales ni un servicio conectado. Ejecuta `npm run dev`, registra dos usuarios en `/acceso`. El emulador Auth imprime los enlaces de verificación/recuperación en su terminal. Abre el enlace y pulsa «Ya verifiqué mi correo». El UI de emuladores está en http://127.0.0.1:4000. No activar emuladores en un sitio público.

5. Para volver a DEMO: `VITE_BACKEND=demo` y reiniciar Vite. Los datos locales anteriores permanecen. No se importan a Firestore.

## Tu cuenta Firebase (paso manual pendiente)

1. En [Firebase Console](https://console.firebase.google.com/) crea o selecciona tu proyecto. Registra una aplicación web y copia su configuración pública. No necesitas generar claves de cuentas de servicio para el navegador.
2. Activa Authentication → Email/Password. Revisa dominios autorizados y plantillas de verificación/recuperación; añade el dominio donde alojarás la app.
3. Crea Cloud Firestore en modo producción y elige región antes de guardar datos. Activa Storage. Para funciones, Scheduler y Storage puede requerirse facturación Blaze; revisa presupuesto y cuotas. No se ha habilitado facturación desde este trabajo.
4. Introduce los valores reales del bloque de configuración web en `.env.local`, `VITE_BACKEND=firebase`, `VITE_USE_FIREBASE_EMULATORS=false`. Nunca pegues JSON de una cuenta de servicio o una clave privada en variables VITE: son públicas en el bundle.
5. Backend usa `us-central1`; si eliges otra región, cambia `setGlobalOptions` y VITE_FIREBASE_FUNCTIONS_REGION de forma consistente antes de desplegar.
6. Después de tu autorización explícita para producción, autenticar CLI y seleccionar el ID real. El despliegue de reglas, índices, Storage y Functions debe completarse antes de usar datos remotos. No se incluye ningún comando automático de deploy en build ni se ejecutó un deploy.
7. En producción valida IAM, cuotas y alertas, App Check y protección contra abuso. Los índices pueden tardar en estar listos; sus errores se muestran en la interfaz.

La app Firebase inicia con catálogo vacío. Crea publicaciones con un usuario verificado y compra con otro. La identidad KYC no se considera verificada por tener un correo verificado. Las colecciones futuras de KYC, métodos de pago, reseñas y transmisiones están modeladas y cerradas a escritura cliente; no hay servicios externos conectados.

## Fuentes oficiales consultadas

- [Transacciones Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions): lecturas antes de escrituras, reintentos y atomicidad.
- [Runtime de Cloud Functions](https://firebase.google.com/docs/functions/manage-functions): Node 22 y configuración.
- [Pruebas de reglas](https://firebase.google.com/docs/firestore/security/test-rules-emulator): Admin SDK omite reglas, por eso se prueban clientes con identidades distintas.
- [Emuladores de Functions](https://firebase.google.com/docs/functions/local-emulator).
