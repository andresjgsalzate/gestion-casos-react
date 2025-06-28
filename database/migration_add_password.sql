-- Script de migración para agregar columna password a tabla users
-- Ejecutar este script si ya tienes datos en la base de datos

-- ===============================
-- AGREGAR COLUMNA PASSWORD
-- ===============================

-- Agregar la columna password como nullable primero
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Establecer una contraseña por defecto para usuarios existentes
-- (usa bcrypt hash para 'password123')
UPDATE users 
SET password = '$2b$10$jKzQ8K0VjzjKzQ8K0VjzjOWzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjK'
WHERE password IS NULL;

-- Hacer la columna NOT NULL después de establecer valores por defecto
ALTER TABLE users ALTER COLUMN password SET NOT NULL;

-- ===============================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ===============================

COMMENT ON COLUMN users.password IS 'Hash de la contraseña del usuario (bcrypt)';

-- ===============================
-- VERIFICAR MIGRACIÓN
-- ===============================

SELECT 'Migración completada exitosamente' as status;
SELECT 'Usuarios con contraseña: ' || COUNT(*) as info 
FROM users 
WHERE password IS NOT NULL;

-- Mostrar estructura actualizada de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
