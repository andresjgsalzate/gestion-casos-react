-- Script para actualizar las contraseñas en la base de datos
-- Convierte de bcrypt a SHA-256 para que coincidan con el frontend

-- Actualizar la contraseña del Super Admin (password123)
UPDATE users 
SET password = 'abc63629ee7f33fa07373e7736c0558b47c5ab9910d7223aef4948ea3dfe9e9c'
WHERE email = 'andresjgsalzate@gmail.com';

-- Actualizar contraseñas de usuarios de prueba (password123)
UPDATE users 
SET password = 'abc63629ee7f33fa07373e7736c0558b47c5ab9910d7223aef4948ea3dfe9e9c'
WHERE email IN (
    'supervisor@empresa.com',
    'analista1@empresa.com', 
    'analista2@empresa.com',
    'usuario1@empresa.com',
    'usuario2@empresa.com'
);

-- Verificar que las contraseñas se actualizaron correctamente
SELECT email, name, 
       CASE 
           WHEN password = 'abc63629ee7f33fa07373e7736c0558b47c5ab9910d7223aef4948ea3dfe9e9c' 
           THEN 'CORRECTO (SHA-256)' 
           ELSE 'INCORRECTO' 
       END as password_status
FROM users 
WHERE is_active = true
ORDER BY email;
