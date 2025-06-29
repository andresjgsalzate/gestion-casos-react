-- Consultas útiles para el Sistema de Auditoría
-- Ejecutar en Supabase SQL Editor

-- ========================================
-- CONSULTAS DE AUDITORÍA PRINCIPALES
-- ========================================

-- 1. Ver todas las eliminaciones recientes (últimos 30 días)
SELECT 
    a.timestamp,
    a.table_name as tabla,
    a.record_id,
    a.user_email as usuario,
    u.name as nombre_usuario,
    a.description as descripcion,
    a.old_data->'name' as nombre_eliminado,
    a.old_data->'case_number' as numero_caso,
    a.old_data->'title' as titulo_todo
FROM audit_log a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.operation_type = 'DELETE'
  AND a.timestamp >= NOW() - INTERVAL '30 days'
ORDER BY a.timestamp DESC;

-- 2. Eliminaciones por usuario específico
SELECT 
    a.timestamp,
    a.table_name as tabla,
    a.description as descripcion,
    a.old_data
FROM audit_log a
WHERE a.operation_type = 'DELETE'
  AND a.user_email = 'admin@empresa.com'  -- Cambiar por el email deseado
ORDER BY a.timestamp DESC;

-- 3. Eliminaciones por tabla específica
SELECT 
    a.timestamp,
    a.user_email as usuario,
    u.name as nombre_usuario,
    a.description as descripcion,
    a.old_data
FROM audit_log a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.operation_type = 'DELETE'
  AND a.table_name = 'cases'  -- Cambiar por: users, roles, applications, etc.
ORDER BY a.timestamp DESC;

-- 4. Resumen de eliminaciones por tabla (últimos 30 días)
SELECT 
    table_name as tabla,
    COUNT(*) as total_eliminaciones,
    MIN(timestamp) as primera_eliminacion,
    MAX(timestamp) as ultima_eliminacion
FROM audit_log
WHERE operation_type = 'DELETE'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY table_name
ORDER BY total_eliminaciones DESC;

-- 5. Resumen de eliminaciones por usuario (últimos 30 días)
SELECT 
    a.user_email as usuario,
    u.name as nombre_usuario,
    COUNT(*) as total_eliminaciones,
    array_agg(DISTINCT a.table_name) as tablas_afectadas
FROM audit_log a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.operation_type = 'DELETE'
  AND a.timestamp >= NOW() - INTERVAL '30 days'
GROUP BY a.user_email, u.name
ORDER BY total_eliminaciones DESC;

-- 6. Ver detalles completos de una eliminación específica
SELECT 
    a.timestamp,
    a.table_name as tabla,
    a.record_id,
    a.user_email as usuario,
    u.name as nombre_usuario,
    a.description as descripcion,
    jsonb_pretty(a.old_data) as datos_eliminados
FROM audit_log a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.operation_type = 'DELETE'
  AND a.record_id = 'ID_DEL_REGISTRO';  -- Cambiar por el ID específico

-- 7. Eliminaciones sospechosas (muchas eliminaciones en poco tiempo)
SELECT 
    a.user_email as usuario,
    u.name as nombre_usuario,
    DATE(a.timestamp) as fecha,
    COUNT(*) as eliminaciones_del_dia
FROM audit_log a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.operation_type = 'DELETE'
  AND a.timestamp >= NOW() - INTERVAL '7 days'
GROUP BY a.user_email, u.name, DATE(a.timestamp)
HAVING COUNT(*) > 5  -- Más de 5 eliminaciones en un día
ORDER BY eliminaciones_del_dia DESC, a.timestamp DESC;

-- ========================================
-- CONSULTAS DE CONFIGURACIÓN Y PERMISOS
-- ========================================

-- 8. Ver permisos actuales del Supervisor
SELECT 
    p.module as modulo,
    p.action as accion,
    p.name as permiso,
    p.description as descripcion
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'Supervisor'
ORDER BY p.module, p.action;

-- 9. Comparar permisos entre Admin y Supervisor
SELECT 
    p.module as modulo,
    p.action as accion,
    p.name as permiso,
    CASE WHEN admin_perms.permission_id IS NOT NULL THEN '✅' ELSE '❌' END as admin,
    CASE WHEN super_perms.permission_id IS NOT NULL THEN '✅' ELSE '❌' END as supervisor
FROM permissions p
LEFT JOIN (
    SELECT rp.permission_id 
    FROM role_permissions rp 
    JOIN roles r ON rp.role_id = r.id 
    WHERE r.name = 'Administrador'
) admin_perms ON p.id = admin_perms.permission_id
LEFT JOIN (
    SELECT rp.permission_id 
    FROM role_permissions rp 
    JOIN roles r ON rp.role_id = r.id 
    WHERE r.name = 'Supervisor'
) super_perms ON p.id = super_perms.permission_id
ORDER BY p.module, p.action;

-- 10. Verificar qué permisos NO tiene el Supervisor que SÍ tiene el Admin
SELECT 
    p.module as modulo,
    p.action as accion,
    p.name as permiso,
    p.description as descripcion
FROM permissions p
WHERE p.id IN (
    SELECT rp.permission_id 
    FROM role_permissions rp 
    JOIN roles r ON rp.role_id = r.id 
    WHERE r.name = 'Administrador'
)
AND p.id NOT IN (
    SELECT rp.permission_id 
    FROM role_permissions rp 
    JOIN roles r ON rp.role_id = r.id 
    WHERE r.name = 'Supervisor'
)
ORDER BY p.module, p.action;

-- ========================================
-- CONSULTAS DE MANTENIMIENTO
-- ========================================

-- 11. Limpiar logs antiguos (más de 1 año)
-- ¡CUIDADO! Esta consulta ELIMINA datos permanentemente
-- SELECT cleanup_old_audit_logs(365);

-- 12. Ver estadísticas de la tabla de auditoría
SELECT 
    COUNT(*) as total_logs,
    COUNT(CASE WHEN operation_type = 'DELETE' THEN 1 END) as eliminaciones,
    COUNT(CASE WHEN operation_type = 'UPDATE' THEN 1 END) as actualizaciones,
    COUNT(CASE WHEN operation_type = 'INSERT' THEN 1 END) as inserciones,
    MIN(timestamp) as log_mas_antiguo,
    MAX(timestamp) as log_mas_reciente,
    COUNT(DISTINCT user_id) as usuarios_unicos,
    COUNT(DISTINCT table_name) as tablas_auditadas
FROM audit_log;

-- 13. Ver uso de espacio de la tabla de auditoría
SELECT 
    schemaname,
    tablename,
    attname as columna,
    n_distinct as valores_distintos,
    correlation as correlacion
FROM pg_stats 
WHERE tablename = 'audit_log'
ORDER BY attname;

-- ========================================
-- EJEMPLOS DE BÚSQUEDA ESPECÍFICA
-- ========================================

-- 14. Buscar eliminaciones que contengan cierta palabra en la descripción
SELECT 
    a.timestamp,
    a.table_name,
    a.user_email,
    a.description,
    jsonb_pretty(a.old_data)
FROM audit_log a
WHERE a.operation_type = 'DELETE'
  AND a.description ILIKE '%usuario%'  -- Cambiar por la palabra a buscar
ORDER BY a.timestamp DESC;

-- 15. Buscar por datos específicos en old_data (ejemplo: casos con cierto número)
SELECT 
    a.timestamp,
    a.user_email,
    a.description,
    a.old_data->>'case_number' as numero_caso,
    a.old_data->>'description' as descripcion_caso
FROM audit_log a
WHERE a.operation_type = 'DELETE'
  AND a.table_name = 'cases'
  AND a.old_data->>'case_number' ILIKE '%2024%'  -- Casos del 2024
ORDER BY a.timestamp DESC;
