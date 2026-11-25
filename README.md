# Ventas Flash · Supabase

Marketplace peruano con React, TypeScript y Vite. El backend activo usa Supabase Auth, PostgreSQL, Storage y Realtime.

## Estado

La migración de código está preparada y probada localmente. Falta crear el proyecto Supabase, aplicar las migraciones y conectar sus variables públicas. No hay despliegue remoto realizado.

## Arrancar

Requiere Node 22.18 o posterior.

1. Sigue [la guía de Supabase y despliegue](docs/supabase-setup.md) para crear el proyecto y ejecutar los cuatro SQL de `supabase/migrations/` en orden.
2. Copia `.env.example` a `.env.local` si no existe y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Ejecuta:

```powershell
npm.cmd ci
npm.cmd start
```

También puedes usar `iniciar-todo.ps1`. No requiere emuladores ni Java. Sin configuración, la app muestra qué falta; no usa datos simulados de manera automática.

Para explorar la interfaz sin Supabase: `npm.cmd run dev:demo`. Es una demostración local explícita, con datos guardados en el navegador.

## Funcionalidad

- Registro, confirmación de correo, inicio de sesión y recuperación de contraseña.
- Publicaciones con imágenes, favoritos y Radar de proximidad.
- Subastas con auto-puja privada, incremento mínimo de S/ 50 y extensión de 60 segundos en los últimos 30 segundos.
- Remates descendentes calculados con hora del servidor.
- Compra atómica, comisión del 4% descontada al vendedor, chat privado y confirmación de recepción.
- Salas Live, productos destacados y chat público. El vídeo sigue siendo demostración o cámara local; no transmite vídeo remoto.

**Los pagos siguen siendo simulados.** No hay cobro ni custodia real de dinero.

## Pruebas y compilación

```powershell
npm.cmd test
npm.cmd run build
```

La suite incluye pruebas de dominio, demo, Radar, cliente Supabase y migraciones SQL ejecutadas en PostgreSQL embebido. No sustituye las pruebas contra Auth, Storage, Realtime y Cron del proyecto remoto. Consulta la guía para la aceptación entre dos navegadores.

## Despliegue

Se incluyen configuraciones para Vercel y Netlify: build `npm run build`, salida `dist`, rutas SPA. Configura las variables públicas de Supabase en el hosting antes de compilar y autoriza sus URLs de autenticación. Para registros externos, configura SMTP en Supabase.

## Archivos históricos

`functions/`, `firebase.json`, reglas, pruebas y scripts de emuladores permanecen como referencia del backend anterior. No forman parte del arranque ni del bundle actual. Se conservaron los datos locales de `emulator-data/`; no se copiaron usuarios ni contraseñas de prueba a Supabase.

La documentación anterior sobre Firebase describe esa implementación histórica. La guía vigente es [docs/supabase-setup.md](docs/supabase-setup.md).
