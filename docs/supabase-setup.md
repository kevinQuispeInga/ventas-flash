# Conectar y desplegar Ventas Flash con Supabase

La aplicación usa Supabase Auth, PostgreSQL, Storage y Realtime. No necesita Firebase, Java ni Cloud Functions para arrancar o desplegar el frontend. Aún no hay proyecto remoto conectado: las variables públicas están vacías intencionalmente.

## 1. Crear la base de datos

1. Crea un proyecto en [Supabase Dashboard](https://supabase.com/dashboard). Guarda su contraseña de base de datos fuera del repositorio.
2. En SQL Editor, ejecuta **una vez y en este orden** los archivos completos:
   - `supabase/migrations/202611250001_marketplace.sql`: tablas, funciones, permisos y RLS.
   - `supabase/migrations/202611250002_storage_realtime.sql`: bucket público `products` y publicación Realtime.
   - `supabase/migrations/202611250003_cron.sql`: cierre de subastas cada minuto con pg_cron.
   - `supabase/migrations/202611250004_seller_commission.sql`: comisión del 4% a cargo del vendedor para ventas nuevas; preserva los términos de pedidos anteriores.
3. Comprueba en Cron el trabajo `ventas-flash-close-auctions`. Las compras también validan el vencimiento dentro de su transacción; cron evita depender de visitantes para actualizar el estado del catálogo.

Usa un proyecto vacío para esta instalación. Estos archivos son migraciones versionadas, no scripts para repetir sobre tablas existentes. Si administras el proyecto con Supabase CLI, incorpora estos archivos a su historial y aplica `supabase db push` en vez de repetirlos manualmente.

Si ya ejecutaste las tres primeras migraciones, ejecuta únicamente la cuarta. El nuevo cliente requiere esta actualización para completar compras.

## 2. Configurar el acceso

En Authentication habilita Email/Password y mantén activa la confirmación de correo. Configura Site URL con la URL del frontend y añade estas Redirect URLs, sustituyendo el dominio por el tuyo:

```text
http://localhost:5173/perfil
http://localhost:5173/restablecer
http://127.0.0.1:5173/perfil
http://127.0.0.1:5173/restablecer
https://tu-dominio/perfil
https://tu-dominio/restablecer
```

Configura SMTP para enviar verificación y recuperación a usuarios externos. El servicio de correo predeterminado de Supabase está restringido a miembros del equipo y tiene límites bajos; no sirve para abrir el registro al público. [Documentación de SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

En Connect/API Keys copia la URL del proyecto y la clave **publishable**. Se admite también la antigua clave `anon`. Nunca uses `service_role`, `sb_secret_...` ni contraseñas en variables `VITE_`: se incluyen en el navegador. [Claves API](https://supabase.com/docs/guides/getting-started/api-keys).

## 3. Arranque local

Requisitos: Node 22.18 o posterior y npm. Completa `.env.local`:

```dotenv
VITE_BACKEND=supabase
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE
```

```powershell
npm.cmd ci
npm.cmd start
```

También puedes ejecutar `iniciar-todo.ps1`. Ningún script de inicio normal sobrescribe tus claves. Reinicia Vite después de cambiar variables. Sin claves se muestra una pantalla de configuración; no se sustituye la conexión por datos ficticios.

Para explorar únicamente la interfaz sin cuenta remota: `npm.cmd run dev:demo`. Este modo explícito usa datos del navegador y no envía operaciones a Supabase. Las cuentas de prueba de Firebase no existen en Supabase.

## 4. Publicar el frontend

El repositorio incluye `vercel.json` y `netlify.toml` con soporte para rutas SPA como `/producto/...`, `/perfil` y `/restablecer`.

- Conecta el repositorio al proveedor elegido.
- Comando de compilación: `npm run build`; directorio de salida: `dist`.
- Configura las tres variables anteriores en el entorno del hosting **antes de compilar**.
- Añade la URL definitiva a Authentication según el paso 2.
- No despliegues `functions/`, emuladores ni claves de servidor.

No se publicó ningún sitio ni se creó infraestructura remota durante esta migración.

## 5. Verificación

```powershell
npm.cmd test
npm.cmd run build
```

La suite usa PostgreSQL embebido (PGlite) para ejecutar las dos primeras migraciones y probar permisos RLS, auto-puja, cierre, compras, comisiones, chat, favoritos, Live y políticas de Storage. También verifica suscripciones y limpieza de sesión del cliente. No requiere Docker ni una cuenta remota.

PGlite no verifica envío de correos, transporte Realtime, servicio HTTP de Storage, ejecución real de pg_cron ni concurrencia entre conexiones PostgreSQL. Después de conectar el proyecto, registra dos compradores y un vendedor y prueba: confirmación/recuperación de correo, foto, compra simultánea desde dos sesiones (una sola orden), pujas simultáneas, chat, recepción, actualización entre navegadores, cierre sin visitantes y recarga de rutas en el hosting.

## Alcance conservado

- Las compras y la retención de dinero siguen siendo **simuladas** (`provider=demo`, `real_funds_held=false`).
- Live conserva salas, productos y chat; el vídeo existente es una demostración o previsualización local de cámara. No había transporte de vídeo remoto implementado y esta migración no añade un servicio audiovisual.
- Coordenadas ocultas no se guardan en el catálogo público. Las aproximadas se redondean en el servidor a dos decimales.
- Catálogo y consultas actuales se orientan a un MVP y quedan sujetos al límite de filas del API de Supabase; para catálogos grandes hay que implementar paginación y búsqueda de servidor.
- Los datos locales de `emulator-data/` se conservaron. No se importaron cuentas, contraseñas ni datos ficticios a la nube. El código, las reglas, las dependencias y los scripts de Firebase se retiraron; se pueden consultar en el historial de Git.

Referencias: [funciones y privilegios](https://supabase.com/docs/guides/database/functions), [Storage RLS](https://supabase.com/docs/guides/storage/security/access-control), [Cron](https://supabase.com/docs/guides/cron), [Realtime](https://supabase.com/docs/guides/realtime/postgres-changes).
