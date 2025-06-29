-- Actualización de Permisos para el Rol Supervisor
-- El Supervisor debe poder hacer todo como el Admin EXCEPTO eliminar configuraciones

-- Primero, eliminar los permisos actuales del Supervisor
DELETE FROM role_permissions 
WHERE role_id = (SELECT id FROM roles WHERE name = 'Supervisor');

-- Asignar TODOS los permisos al Supervisor EXCEPTO los de eliminación en configuración
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Supervisor'),
    id
FROM permissions
WHERE name NOT IN (
    -- Excluir permisos de eliminación en configuración
    'users.delete',
    'roles.delete', 
    'permissions.delete',
    'applications.delete',
    'origins.delete',
    'priorities.delete'
);

-- Verificación: Mostrar los permisos que TIENE el Supervisor
SELECT 
    r.name as rol,
    p.name as permiso,
    p.description as descripcion,
    p.module as modulo,
    p.action as accion
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'Supervisor'
ORDER BY p.module, p.action;

-- Verificación: Mostrar los permisos que NO TIENE el Supervisor
SELECT 
    p.name as permiso,
    p.description as descripcion,
    p.module as modulo,
    p.action as accion
FROM permissions p
WHERE p.id NOT IN (
    SELECT permission_id 
    FROM role_permissions rp
    JOIN roles r ON rp.role_id = r.id
    WHERE r.name = 'Supervisor'
)
ORDER BY p.module, p.action;
