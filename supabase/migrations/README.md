# Migraciones y políticas RLS

Este directorio debe contener las migraciones SQL y políticas RLS versionadas para trazabilidad y revisión previa al deploy.

## Cómo exportar políticas desde el proyecto actual

1. **Desde el Dashboard de Supabase**: SQL Editor → ejecutar y guardar el resultado:
   ```sql
   -- Listar políticas existentes
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

2. **Con Supabase CLI** (recomendado):
   ```bash
   supabase db dump -f schema_and_policies.sql
   ```
   Mover/ajustar el archivo generado a `migrations/YYYYMMDDHHMMSS_description.sql`.

3. **Tablas críticas** que deben tener RLS documentado/versionado:
   - `users`, `notifications`, `device_tokens`
   - `purchases`, `purchase_items`, `products`
   - `yacht_work_messages`, `yacht_work_offers`, `yacht_work_chat_state`
   - Cualquier otra tabla con datos sensibles

## Convención

- Un archivo por migración: `YYYYMMDDHHMMSS_descripcion_corta.sql`
- Incluir comentarios con el propósito de cada política.
- Revisar en PR antes de aplicar en producción.
