-- Script de verificación de integridad referencial
-- Ejecutar este script para diagnosticar problemas de integridad en la base de datos

-- ===============================
-- VERIFICAR INTEGRIDAD BÁSICA
-- ===============================

-- Verificar que existen usuarios activos
SELECT 'USERS CHECK' as verification, 
       COUNT(*) as total_users, 
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
FROM users;

-- Verificar que todos los usuarios tienen roles válidos
SELECT 'USER ROLES CHECK' as verification,
       COUNT(*) as users_without_valid_role
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE r.id IS NULL;

-- Verificar casos con referencias inválidas
SELECT 'CASES INTEGRITY CHECK' as verification,
       COUNT(CASE WHEN u.id IS NULL THEN 1 END) as cases_with_invalid_user,
       COUNT(CASE WHEN a.id IS NULL THEN 1 END) as cases_with_invalid_application,
       COUNT(CASE WHEN o.id IS NULL THEN 1 END) as cases_with_invalid_origin,
       COUNT(CASE WHEN p.id IS NULL THEN 1 END) as cases_with_invalid_priority
FROM cases c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN applications a ON c.application_id = a.id
LEFT JOIN origins o ON c.origin_id = o.id
LEFT JOIN priorities p ON c.priority_id = p.id;

-- Verificar TODOs con referencias inválidas
SELECT 'TODOS INTEGRITY CHECK' as verification,
       COUNT(CASE WHEN assigned.id IS NULL AND t.assigned_to IS NOT NULL THEN 1 END) as todos_with_invalid_assigned_user,
       COUNT(CASE WHEN creator.id IS NULL THEN 1 END) as todos_with_invalid_creator,
       COUNT(CASE WHEN p.id IS NULL AND t.priority_id IS NOT NULL THEN 1 END) as todos_with_invalid_priority,
       COUNT(CASE WHEN c.id IS NULL AND t.case_id IS NOT NULL THEN 1 END) as todos_with_invalid_case
FROM todos t
LEFT JOIN users assigned ON t.assigned_to = assigned.id
LEFT JOIN users creator ON t.created_by = creator.id
LEFT JOIN priorities p ON t.priority_id = p.id
LEFT JOIN cases c ON t.case_id = c.id;

-- Verificar time_entries con referencias inválidas
SELECT 'TIME_ENTRIES INTEGRITY CHECK' as verification,
       COUNT(CASE WHEN u.id IS NULL THEN 1 END) as entries_with_invalid_user,
       COUNT(CASE WHEN c.id IS NULL THEN 1 END) as entries_with_invalid_case
FROM time_entries te
LEFT JOIN users u ON te.user_id = u.id
LEFT JOIN cases c ON te.case_id = c.id;

-- Verificar time_tracking con referencias inválidas
SELECT 'TIME_TRACKING INTEGRITY CHECK' as verification,
       COUNT(CASE WHEN u.id IS NULL THEN 1 END) as tracking_with_invalid_user,
       COUNT(CASE WHEN t.id IS NULL THEN 1 END) as tracking_with_invalid_todo,
       COUNT(CASE WHEN c.id IS NULL AND tt.case_id IS NOT NULL THEN 1 END) as tracking_with_invalid_case
FROM time_tracking tt
LEFT JOIN users u ON tt.user_id = u.id
LEFT JOIN todos t ON tt.todo_id = t.id
LEFT JOIN cases c ON tt.case_id = c.id;

-- ===============================
-- VERIFICAR CONFIGURACIÓN DE TABLAS
-- ===============================

-- Verificar que todas las tablas tienen datos básicos
SELECT 'TABLE COUNTS' as verification,
       'users' as table_name,
       COUNT(*) as record_count
FROM users
UNION ALL
SELECT 'TABLE COUNTS' as verification,
       'roles' as table_name,
       COUNT(*) as record_count
FROM roles
UNION ALL
SELECT 'TABLE COUNTS' as verification,
       'applications' as table_name,
       COUNT(*) as record_count
FROM applications
UNION ALL
SELECT 'TABLE COUNTS' as verification,
       'origins' as table_name,
       COUNT(*) as record_count
FROM origins
UNION ALL
SELECT 'TABLE COUNTS' as verification,
       'priorities' as table_name,
       COUNT(*) as record_count
FROM priorities;

-- ===============================
-- LIMPIAR DATOS HUÉRFANOS (OPCIONAL)
-- ===============================

-- Comentar/descomentar según sea necesario

-- Eliminar casos con usuarios inválidos
-- DELETE FROM cases WHERE user_id NOT IN (SELECT id FROM users WHERE is_active = true);

-- Eliminar casos con aplicaciones inválidas  
-- DELETE FROM cases WHERE application_id IS NOT NULL AND application_id NOT IN (SELECT id FROM applications WHERE is_active = true);

-- Eliminar casos con orígenes inválidos
-- DELETE FROM cases WHERE origin_id IS NOT NULL AND origin_id NOT IN (SELECT id FROM origins WHERE is_active = true);

-- Eliminar casos con prioridades inválidas
-- DELETE FROM cases WHERE priority_id IS NOT NULL AND priority_id NOT IN (SELECT id FROM priorities WHERE is_active = true);

-- Eliminar TODOs con usuarios asignados inválidos
-- UPDATE todos SET assigned_to = NULL WHERE assigned_to IS NOT NULL AND assigned_to NOT IN (SELECT id FROM users WHERE is_active = true);

-- Eliminar TODOs con creadores inválidos (esto es más problemático, mejor no hacerlo automáticamente)
-- DELETE FROM todos WHERE created_by NOT IN (SELECT id FROM users WHERE is_active = true);

-- ===============================
-- MOSTRAR RESUMEN FINAL
-- ===============================

SELECT 'VERIFICATION COMPLETE' as status,
       NOW() as timestamp,
       'Check results above for any integrity issues' as message;
