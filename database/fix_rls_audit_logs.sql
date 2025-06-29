-- ====================================================
-- SOLUCIÓN PARA PROBLEMA DE RLS EN TABLA AUDIT_LOGS
-- ====================================================
-- 
-- PROBLEMA IDENTIFICADO:
-- - Los datos existen en la tabla audit_logs (50+ registros)
-- - Políticas RLS muy restrictivas que excluyen logs del sistema (user_id NULL)
-- - La aplicación no puede leer logs del sistema ni insertar logs automáticos
--
-- POLÍTICAS ACTUALES ENCONTRADAS:
-- 1. audit_logs_admin_select: Solo admins ven logs
-- 2. audit_logs_user_select: Usuarios solo ven sus logs
-- 3. audit_logs_insert: Solo usuarios autenticados insertan
--
-- EJECUTAR EN SUPABASE SQL EDITOR:
-- ====================================================

-- 1. Verificar el estado actual de RLS (sin columna enablerls que no existe)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'audit_logs';

-- 2. Ver las políticas actuales (CONFIRMADO - ya ejecutado)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'audit_logs';

-- 3. SOLUCIÓN: Modificar políticas existentes para incluir logs del sistema
-- ====================================================

-- 3.1. Eliminar políticas restrictivas actuales
DROP POLICY IF EXISTS "audit_logs_admin_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_user_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;

-- 3.2. Crear nueva política SELECT que incluya logs del sistema
-- Permite a todos los usuarios autenticados ver:
-- - Sus propios logs (user_id = auth.uid())
-- - Logs del sistema (user_id IS NULL)
-- - Si es admin, todos los logs
CREATE POLICY "audit_logs_select_inclusive" ON audit_logs
    FOR SELECT 
    USING (
        -- Logs del sistema (user_id NULL) - visibles para todos
        user_id IS NULL 
        OR 
        -- Logs propios del usuario
        user_id = auth.uid()
        OR
        -- Si es admin, puede ver todos
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = auth.uid() AND r.name = 'admin'
        )
    );

-- 3.3. Crear política INSERT que permita logs del sistema
-- Permite insertar con user_id válido O NULL (sistema)
CREATE POLICY "audit_logs_insert_system" ON audit_logs
    FOR INSERT 
    WITH CHECK (
        -- Logs del sistema (sin usuario)
        user_id IS NULL 
        OR 
        -- Logs con usuario autenticado válido
        user_id = auth.uid()
        OR
        -- Admins pueden insertar logs para cualquier usuario
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = auth.uid() AND r.name = 'admin'
        )
    );

-- 4. Verificar las nuevas políticas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'audit_logs';

-- 5. Probar las consultas que fallaban
SELECT COUNT(*) as total_logs FROM audit_logs;
SELECT COUNT(*) as system_logs FROM audit_logs WHERE user_id IS NULL;
SELECT COUNT(*) as user_logs FROM audit_logs WHERE user_id IS NOT NULL;

-- 6. Test de inserción de log del sistema
INSERT INTO audit_logs (
    table_name, 
    operation, 
    record_id, 
    user_id, 
    timestamp, 
    description
) VALUES (
    'system_test', 
    'INSERT', 
    'test-' || extract(epoch from now()), 
    NULL, 
    now(), 
    'Test de log del sistema después de fix RLS'
);

-- 7. Verificar que se insertó correctamente
SELECT * FROM audit_logs 
WHERE table_name = 'system_test' 
ORDER BY timestamp DESC 
LIMIT 1;

-- ====================================================
-- NOTAS IMPORTANTES:
-- ====================================================
-- 
-- 1. RLS (Row Level Security) controla qué filas puede ver/modificar cada usuario
-- 2. Si está habilitado sin políticas, nadie puede acceder a los datos
-- 3. Las políticas definen las reglas de acceso por operación (SELECT, INSERT, UPDATE, DELETE)
-- 4. USING clause: controla qué filas son visibles para SELECT/UPDATE/DELETE
-- 5. WITH CHECK clause: controla qué filas pueden ser insertadas/actualizadas
-- 
-- ALTERNATIVAS DE POLÍTICAS MÁS ESPECÍFICAS:
-- 
-- Solo administradores pueden ver todos los logs:
-- CREATE POLICY "audit_logs_admin_select" ON audit_logs
--     FOR SELECT 
--     USING (auth.jwt() ->> 'role' = 'admin');
--
-- Los usuarios solo pueden ver sus propios logs:
-- CREATE POLICY "audit_logs_user_select" ON audit_logs
--     FOR SELECT 
--     USING (auth.uid() = user_id);
--
-- Permitir inserción solo con user_id válido o NULL:
-- CREATE POLICY "audit_logs_system_insert" ON audit_logs
--     FOR INSERT 
--     WITH CHECK (user_id IS NULL OR user_id = auth.uid());
--
-- ====================================================
