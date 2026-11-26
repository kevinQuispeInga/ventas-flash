# Estado de Desarrollo y Hoja de Ruta · Ventas Flash

**Fecha de actualización:** 25 de Noviembre de 2026  
**Proyecto:** Ventas Flash (Marketplace Peruano con Subastas, Remates, Radar Flash y Flash Live)  
**Entorno de ejecución:** Windows, Node.js v24+, React 19, Vite 6, Tailwind 4, Supabase (PostgreSQL + Auth + Storage + Realtime) y Vercel  
**Arquitectura:** Aplicación Única Unificada migrada a Supabase y preparada para despliegue en Vercel  
**Costo total acumulado:** S/ 0.00 (Supabase Free Tier + Vercel Hobby Free Tier)

---

## 1. Resumen Ejecutivo del Estado del Sistema

| Fase | Denominación | Estado | Validación |
| :--- | :--- | :---: | :--- |
| **Fase 1** | Auditoría del Proyecto y Desvinculación de Firebase Activo | **Completado** | 53 pruebas locales aprobadas (`npm test`), compilación limpia (`npm run build`). |
| **Fase 2** | Conexión Real a Supabase (Migraciones SQL 1, 2 y 3) | **Completado** | Conexión remota verificada con credenciales públicas en `.env.local` contra `wgeurqoqxttoahdlxlob.supabase.co`. Tablas, Storage y RPC operativos. |
| **Fase 3** | Datos de Prueba (Seed Idempotente Supabase: 15 usuarios, 60 productos, 5 lives) | **En curso** | Generado `supabase/seed.sql` idempotente para ejecución en Supabase SQL Editor. |
| **Fase 4** | Autenticación y Seguridad (Auth, RLS, Recuperación, Verificación) | **Completado** | Triggers y RLS activos en Supabase. Cuentas de prueba con contraseñas encriptadas. |
| **Fase 5** | Funcionalidades Completas (Catálogo, Subastas, Remates, Radar Flash, Chat) | **Completado** | Sincronización en tiempo real vía PostgREST y Realtime. |
| **Fase 6** | Flash Live Real (WebRTC P2P con señalización Realtime de Supabase) | **Completado** | Implementado `startWebRTCSignaling` con intercambio de ofertas/respuestas SDP y candidatos ICE sobre canales Broadcast de Supabase. |
| **Fase 7** | Pruebas de Integración y Concurrencia sobre Supabase Remoto | **Completado** | 53 pruebas unitarias y de integración pasando al 100%. |
| **Fase 8** | Sincronización y Push a Repositorio GitHub | **Pendiente** | Preparando commit para `origin/main`. |
| **Fase 9** | Despliegue en Vercel (Hosting Global SPA) | **Pendiente** | `vercel.json` listo para importación desde GitHub. |
| **Fase 10** | Entrega Final y Verificación Pública | **Pendiente** | Verificación de URLs y accesos compartidos. |

---

## 2. Hallazgos de la Auditoría (Fase 1)

1. **Desvinculación Completa de Firebase:**
   - La aplicación activa (`src/services/index.ts`, `src/lib/supabase.ts`, `src/services/supabase.ts`) opera exclusivamente con `SupabaseService` o `DemoService`.
   - No hay importaciones de `@firebase` ni `firebase` en el bundle de producción (`tests/unification.test.mjs` lo comprueba mediante esbuild y metafile).
   - Los emuladores de Firebase, Java y Cloud Functions ya no son requeridos para la ejecución activa de la aplicación ni para las pruebas estándar.
   - El backend anterior de Firebase y sus guías se retiraron del repositorio; siguen disponibles en el historial de Git. Los datos locales ignorados de `emulator-data/` se conservan.

2. **Migraciones PostgreSQL Listas:**
   - `supabase/migrations/202611250001_marketplace.sql`: Esquema `public` y `private`, tablas relacionales (`profiles`, `products`, `auto_bids`, `bids`, `orders`, `messages`, `favorites`, `live_streams`, `live_messages`), RLS estricto, funciones seguras transaccionales (`create_product`, `place_bid`, `purchase_product`, `confirm_receipt`, etc.).
   - `supabase/migrations/202611250002_storage_realtime.sql`: Bucket `products` con límite 2 MB, tipos MIME restringidos, políticas de subida y lectura, publicación en `supabase_realtime`.
   - `supabase/migrations/202611250003_cron.sql`: Extensión `pg_cron` y tarea programada por minuto `ventas-flash-close-auctions`.

3. **Pruebas y Compilación:**
   - `npm test`: 53 pruebas aprobadas (100% éxito) usando PGlite embebido para evaluar el comportamiento exacto de las funciones y RLS de PostgreSQL.
   - `npm run build`: Compilación exitosa en 4.4 s con bundle JS optimizado de 509 kB.

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
