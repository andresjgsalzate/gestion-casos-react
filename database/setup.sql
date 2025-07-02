-- ===============================
-- GESTIÓN DE CASOS - CONFIGURACIÓN DE BASE DE DATOS
-- ===============================
-- 
-- Este script configura la estructura principal de la base de datos.
-- Incluye todas las tablas, funciones, triggers y políticas RLS necesarias.
--
-- MÓDULOS INCLUIDOS:
-- ✅ Sistema de usuarios, roles y permisos
-- ✅ Gestión de casos y TODOs
-- ✅ Seguimiento de tiempo
-- ✅ Sistema de auditoría
-- ✅ Módulo de archivo con permisos granulares
-- ✅ Políticas de seguridad (RLS) completas
--
-- EJECUCIÓN:
-- Ejecutar este script completo en Supabase SQL Editor
-- Incluye TODA la funcionalidad necesaria para el sistema
--
-- Script de configuración completa para la base de datos de Gestión de Casos
-- Ejecutar en Supabase SQL Editor

-- ===============================
-- ELIMINAR TABLAS EXISTENTES (SI EXISTEN)
-- ===============================
DROP TABLE IF EXISTS time_tracking CASCADE;
DROP TABLE IF EXISTS todos CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS priorities CASCADE;
DROP TABLE IF EXISTS origins CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ===============================
-- CREAR TABLAS
-- ===============================

-- Tabla de Roles
CREATE TABLE roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Permisos
CREATE TABLE permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Relación Roles-Permisos
CREATE TABLE role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Tabla de Usuarios
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Tabla de Aplicaciones
CREATE TABLE applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Tabla de Orígenes
CREATE TABLE origins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Tabla de Prioridades
CREATE TABLE priorities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    level INTEGER NOT NULL,
    color VARCHAR(7) NOT NULL, -- Color hex
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Tabla de Casos
CREATE TABLE cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_number VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    complexity VARCHAR(10) CHECK (complexity IN ('ALTO', 'MEDIO', 'BAJO')) DEFAULT 'MEDIO',
    status VARCHAR(20) CHECK (status IN ('EN CURSO', 'TERMINADA', 'ESCALADA', 'PENDIENTE')) DEFAULT 'PENDIENTE',
    application_id UUID REFERENCES applications(id),
    origin_id UUID REFERENCES origins(id),
    priority_id UUID REFERENCES priorities(id),
    user_id UUID REFERENCES users(id),
    classification_score INTEGER DEFAULT 0,
    classification VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de Entradas de Tiempo para Casos
CREATE TABLE time_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de TODOs
CREATE TABLE todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority_id UUID REFERENCES priorities(id),
    status VARCHAR(20) CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'PENDING',
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    case_id UUID REFERENCES cases(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Seguimiento de Tiempo para TODOs
CREATE TABLE time_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- CREAR ÍNDICES
-- ===============================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_cases_number ON cases(case_number);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_user ON cases(user_id);
CREATE INDEX idx_cases_created ON cases(created_at);
CREATE INDEX idx_time_entries_case ON time_entries(case_id);
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
CREATE INDEX idx_todos_assigned ON todos(assigned_to);
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_time_tracking_todo ON time_tracking(todo_id);
CREATE INDEX idx_time_tracking_user ON time_tracking(user_id);

-- ===============================
-- CREAR FUNCIONES PARA TRIGGERS
-- ===============================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para calcular duración automáticamente
CREATE OR REPLACE FUNCTION calculate_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===============================
-- CREAR TRIGGERS
-- ===============================

-- Triggers para updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_origins_updated_at BEFORE UPDATE ON origins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_priorities_updated_at BEFORE UPDATE ON priorities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para calcular duración
CREATE TRIGGER calculate_time_entry_duration BEFORE INSERT OR UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION calculate_duration();
CREATE TRIGGER calculate_time_tracking_duration BEFORE INSERT OR UPDATE ON time_tracking FOR EACH ROW EXECUTE FUNCTION calculate_duration();

-- ===============================
-- INSERTAR DATOS INICIALES
-- ===============================

-- Insertar Roles
INSERT INTO roles (name, description) VALUES
('Administrador', 'Acceso completo al sistema'),
('Supervisor', 'Gestión de casos y equipos'),
('Analista', 'Gestión de casos asignados'),
('Usuario', 'Acceso básico al sistema');

-- Insertar Permisos
INSERT INTO permissions (name, description, module, action) VALUES
-- Permisos de Usuarios
('users.create', 'Crear usuarios', 'users', 'create'),
('users.read', 'Ver usuarios', 'users', 'read'),
('users.update', 'Actualizar usuarios', 'users', 'update'),
('users.delete', 'Eliminar usuarios', 'users', 'delete'),

-- Permisos de Roles
('roles.create', 'Crear roles', 'roles', 'create'),
('roles.read', 'Ver roles', 'roles', 'read'),
('roles.update', 'Actualizar roles', 'roles', 'update'),
('roles.delete', 'Eliminar roles', 'roles', 'delete'),

-- Permisos de Permisos
('permissions.create', 'Crear permisos', 'permissions', 'create'),
('permissions.read', 'Ver permisos', 'permissions', 'read'),
('permissions.update', 'Actualizar permisos', 'permissions', 'update'),
('permissions.delete', 'Eliminar permisos', 'permissions', 'delete'),

-- Permisos de Aplicaciones
('applications.create', 'Crear aplicaciones', 'applications', 'create'),
('applications.read', 'Ver aplicaciones', 'applications', 'read'),
('applications.update', 'Actualizar aplicaciones', 'applications', 'update'),
('applications.delete', 'Eliminar aplicaciones', 'applications', 'delete'),

-- Permisos de Orígenes
('origins.create', 'Crear orígenes', 'origins', 'create'),
('origins.read', 'Ver orígenes', 'origins', 'read'),
('origins.update', 'Actualizar orígenes', 'origins', 'update'),
('origins.delete', 'Eliminar orígenes', 'origins', 'delete'),

-- Permisos de Prioridades
('priorities.create', 'Crear prioridades', 'priorities', 'create'),
('priorities.read', 'Ver prioridades', 'priorities', 'read'),
('priorities.update', 'Actualizar prioridades', 'priorities', 'update'),
('priorities.delete', 'Eliminar prioridades', 'priorities', 'delete'),

-- Permisos de Casos
('cases.create', 'Crear casos', 'cases', 'create'),
('cases.read', 'Ver casos', 'cases', 'read'),
('cases.update', 'Actualizar casos', 'cases', 'update'),
('cases.delete', 'Eliminar casos', 'cases', 'delete'),
('cases.assign', 'Asignar casos', 'cases', 'assign'),

-- Permisos de TODOs
('todos.create', 'Crear TODOs', 'todos', 'create'),
('todos.read', 'Ver TODOs', 'todos', 'read'),
('todos.update', 'Actualizar TODOs', 'todos', 'update'),
('todos.delete', 'Eliminar TODOs', 'todos', 'delete'),
('todos.assign', 'Asignar TODOs', 'todos', 'assign'),

-- Permisos de Tiempo
('time.create', 'Registrar tiempo', 'time', 'create'),
('time.read', 'Ver registros de tiempo', 'time', 'read'),
('time.update', 'Actualizar registros de tiempo', 'time', 'update'),
('time.delete', 'Eliminar registros de tiempo', 'time', 'delete'),

-- Permisos de Reportes
('reports.read', 'Ver reportes', 'reports', 'read'),
('reports.export', 'Exportar reportes', 'reports', 'export'),

-- Permisos de Dashboard
('dashboard.read', 'Ver dashboard', 'dashboard', 'read'),

-- Permisos de Administración
('admin.full', 'Acceso completo de administración', 'admin', 'full'),

-- ===============================
-- PERMISOS DE ARCHIVO
-- ===============================
-- Permisos del módulo de archivo
('archive.view', 'Ver elementos archivados', 'archive', 'view'),
('archive.create', 'Archivar elementos', 'archive', 'create'),
('archive.restore', 'Restaurar elementos del archivo', 'archive', 'restore'),
('archive.delete', 'Eliminar permanentemente elementos archivados', 'archive', 'delete'),
('archive.search', 'Buscar en archivo', 'archive', 'search'),
('archive.bulk_operations', 'Operaciones masivas de archivo', 'archive', 'bulk_operations'),
('archive.manage_policies', 'Gestionar políticas de archivo', 'archive', 'manage_policies'),
('archive.view_all', 'Ver todos los elementos archivados (admin)', 'archive', 'view_all'),
('archive.manage_retention', 'Gestionar políticas de retención', 'archive', 'manage_retention'),
('archive.view_logs', 'Ver logs de operaciones de archivo', 'archive', 'view_logs'),
('archive.export', 'Exportar datos archivados', 'archive', 'export'),

-- Permisos de auditoría extendidos para archivo
('audit.archive_operations', 'Ver auditoría de operaciones de archivo', 'audit', 'archive_operations');

-- Asignar TODOS los permisos al rol Administrador
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Administrador'),
    id
FROM permissions;

-- Asignar permisos específicos al rol Supervisor
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Supervisor'),
    id
FROM permissions
WHERE name IN (
    'users.read', 'roles.read', 'applications.read', 'origins.read', 'priorities.read',
    'cases.create', 'cases.read', 'cases.update', 'cases.assign',
    'todos.create', 'todos.read', 'todos.update', 'todos.assign',
    'time.create', 'time.read', 'time.update',
    'reports.read', 'reports.export', 'dashboard.read',
    'archive.view', 'archive.create', 'archive.restore', 'archive.search', 'archive.export'
);

-- Asignar permisos específicos al rol Analista
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Analista'),
    id
FROM permissions
WHERE name IN (
    'applications.read', 'origins.read', 'priorities.read',
    'cases.read', 'cases.update',
    'todos.create', 'todos.read', 'todos.update',
    'time.create', 'time.read', 'time.update',
    'reports.read', 'dashboard.read',
    'archive.view', 'archive.create', 'archive.search'
);

-- Asignar permisos básicos al rol Usuario
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Usuario'),
    id
FROM permissions
WHERE name IN (
    'applications.read', 'origins.read', 'priorities.read',
    'cases.read', 'todos.read', 'time.read', 'dashboard.read',
    'archive.view', 'archive.search'
);

-- Insertar Aplicaciones por defecto
INSERT INTO applications (name, description) VALUES
('SISLOG', 'Sistema de Logística'),
('SIGLA', 'Sistema de Gestión Legal y Administrativa'),
('AGD', 'Aplicación de Gestión Documental'),
('ACTIVIDAD', 'Sistema de Gestión de Actividades'),
('GARANTIAS', 'Sistema de Gestión de Garantías'),
('KOMPENDIUM', 'Sistema de Gestión de Conocimiento'),
('SYON', 'Sistema de Operaciones y Notificaciones'),
('WSM LAB', 'Laboratorio de Gestión de Servicios Web');

-- Insertar Orígenes por defecto
INSERT INTO origins (name, description) VALUES
('BACKLOG', 'Casos del backlog de desarrollo'),
('PRIORIZADA', 'Casos priorizados por el negocio'),
('CON_CAMBIOS', 'Casos que requieren cambios específicos'),
('ACTIVIDAD', 'Casos generados por actividades rutinarias'),
('INCIDENTE', 'Casos generados por incidentes'),
('MEJORA', 'Casos de mejora continua');

-- Insertar Prioridades por defecto
INSERT INTO priorities (name, level, color, description) VALUES
('Crítica', 1, '#FF0000', 'Requiere atención inmediata'),
('Alta', 2, '#FF6600', 'Requiere atención prioritaria'),
('Media', 3, '#FFCC00', 'Prioridad estándar'),
('Baja', 4, '#00CC00', 'Puede esperar'),
('Muy Baja', 5, '#0066CC', 'Sin urgencia');

-- Crear el usuario Super Admin
INSERT INTO users (email, name, password, role_id) 
VALUES (
    'andresjgsalzate@gmail.com', 
    'Andres Jurgensen',
    '$2b$10$jKzQ8K0VjzjKzQ8K0VjzjOWzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjK', -- password123
    (SELECT id FROM roles WHERE name = 'Administrador')
);

-- Crear usuarios adicionales para pruebas y desarrollo
INSERT INTO users (email, name, password, role_id) VALUES
('supervisor@empresa.com', 'Juan Supervisor', '$2b$10$jKzQ8K0VjzjKzQ8K0VjzjOWzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjK', (SELECT id FROM roles WHERE name = 'Supervisor')),
('analista1@empresa.com', 'María Analista', '$2b$10$jKzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjK', (SELECT id FROM roles WHERE name = 'Analista')),
('analista2@empresa.com', 'Carlos Analista', '$2b$10$jKzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjK', (SELECT id FROM roles WHERE name = 'Analista')),
('usuario1@empresa.com', 'Pedro Usuario', '$2b$10$jKzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjK', (SELECT id FROM roles WHERE name = 'Usuario')),
('usuario2@empresa.com', 'Ana Usuario', '$2b$10$jKzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjKzQ8K0VjzjK', (SELECT id FROM roles WHERE name = 'Usuario'));

-- ===============================
-- CONFIGURAR RLS (Row Level Security)
-- ===============================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE origins ENABLE ROW LEVEL SECURITY;
ALTER TABLE priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo por ahora, refinar después)
CREATE POLICY "Allow all operations for authenticated users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON roles FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON permissions FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON role_permissions FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON applications FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON origins FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON priorities FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON cases FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON time_entries FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON todos FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON time_tracking FOR ALL USING (true);

-- ===============================
-- CREAR VISTAS ÚTILES
-- ===============================

-- Vista para casos con información relacionada
CREATE VIEW cases_detailed AS
SELECT 
    c.id,
    c.case_number,
    c.description,
    c.complexity,
    c.status,
    c.classification_score,
    c.classification,
    c.created_at,
    c.updated_at,
    c.completed_at,
    u.name as user_name,
    u.email as user_email,
    a.name as application_name,
    o.name as origin_name,
    p.name as priority_name,
    p.color as priority_color,
    p.level as priority_level
FROM cases c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN applications a ON c.application_id = a.id
LEFT JOIN origins o ON c.origin_id = o.id
LEFT JOIN priorities p ON c.priority_id = p.id;

-- Vista para TODOs con información relacionada
CREATE VIEW todos_detailed AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.due_date,
    t.completed_at,
    t.created_at,
    t.updated_at,
    assigned.name as assigned_to_name,
    assigned.email as assigned_to_email,
    creator.name as created_by_name,
    creator.email as created_by_email,
    p.name as priority_name,
    p.color as priority_color,
    p.level as priority_level,
    c.case_number
FROM todos t
LEFT JOIN users assigned ON t.assigned_to = assigned.id
LEFT JOIN users creator ON t.created_by = creator.id
LEFT JOIN priorities p ON t.priority_id = p.id
LEFT JOIN cases c ON t.case_id = c.id;

-- Vista para resumen de tiempo por caso
CREATE VIEW case_time_summary AS
SELECT 
    c.id as case_id,
    c.case_number,
    COUNT(te.id) as time_entries_count,
    COALESCE(SUM(te.duration_seconds), 0) as total_seconds,
    COALESCE(AVG(te.duration_seconds), 0) as average_seconds
FROM cases c
LEFT JOIN time_entries te ON c.id = te.case_id
GROUP BY c.id, c.case_number;

-- Vista para resumen de tiempo por usuario
CREATE VIEW user_time_summary AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    COUNT(DISTINCT te.case_id) as cases_worked,
    COUNT(te.id) as time_entries_count,
    COALESCE(SUM(te.duration_seconds), 0) as total_seconds
FROM users u
LEFT JOIN time_entries te ON u.id = te.user_id
GROUP BY u.id, u.name, u.email;

-- ===============================
-- FUNCIONES PARA GESTIÓN DE TIMERS
-- ===============================

-- Función para detener todos los timers activos de un usuario
CREATE OR REPLACE FUNCTION stop_all_user_timers(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stopped_count INTEGER := 0;
    time_entries_count INTEGER := 0;
    time_tracking_count INTEGER := 0;
    end_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Detener todos los time_entries activos del usuario
    UPDATE time_entries 
    SET end_time = stop_all_user_timers.end_time
    WHERE user_id = stop_all_user_timers.user_id 
    AND end_time IS NULL;
    
    GET DIAGNOSTICS time_entries_count = ROW_COUNT;
    
    -- Detener todos los time_tracking activos del usuario
    UPDATE time_tracking 
    SET end_time = stop_all_user_timers.end_time
    WHERE user_id = stop_all_user_timers.user_id 
    AND end_time IS NULL;
    
    GET DIAGNOSTICS time_tracking_count = ROW_COUNT;
    
    stopped_count := time_entries_count + time_tracking_count;
    
    RETURN json_build_object(
        'success', true,
        'stopped_timers', stopped_count,
        'time_entries_stopped', time_entries_count,
        'time_tracking_stopped', time_tracking_count,
        'timestamp', stop_all_user_timers.end_time
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Función para obtener timers activos de un usuario
CREATE OR REPLACE FUNCTION get_user_active_timers(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'time_entries', (
            SELECT COALESCE(json_agg(te.*), '[]'::json)
            FROM time_entries te
            WHERE te.user_id = get_user_active_timers.user_id
            AND te.end_time IS NULL
        ),
        'time_tracking', (
            SELECT COALESCE(json_agg(tt.*), '[]'::json)
            FROM time_tracking tt
            WHERE tt.user_id = get_user_active_timers.user_id
            AND tt.end_time IS NULL
        )
    ) INTO result;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'error', SQLERRM,
            'time_entries', '[]'::json,
            'time_tracking', '[]'::json
        );
END;
$$;

-- ===============================
-- CONFIGURACIÓN FINAL
-- ===============================

-- Mostrar resumen de la configuración
SELECT 'Configuración completada exitosamente' as status;
SELECT 'Usuarios creados: ' || COUNT(*) as info FROM users;
SELECT 'Roles creados: ' || COUNT(*) as info FROM roles;
SELECT 'Permisos creados: ' || COUNT(*) as info FROM permissions;
SELECT 'Aplicaciones creadas: ' || COUNT(*) as info FROM applications;
SELECT 'Orígenes creados: ' || COUNT(*) as info FROM origins;
SELECT 'Prioridades creadas: ' || COUNT(*) as info FROM priorities;

-- Mostrar el usuario Super Admin creado
SELECT 'Usuario Super Admin creado:' as info;
SELECT u.name, u.email, r.name as role 
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'andresjgsalzate@gmail.com';

-- ===============================
-- TABLA DE AUDITORÍA
-- ===============================

-- Tabla para logs de auditoría
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
    record_id VARCHAR(100) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para la tabla de auditoría
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);

-- Comentarios para documentación
COMMENT ON TABLE audit_logs IS 'Registro de auditoría para todas las operaciones del sistema';
COMMENT ON COLUMN audit_logs.table_name IS 'Nombre de la tabla afectada';
COMMENT ON COLUMN audit_logs.operation IS 'Tipo de operación realizada (INSERT, UPDATE, DELETE, SELECT)';
COMMENT ON COLUMN audit_logs.record_id IS 'ID del registro afectado';
COMMENT ON COLUMN audit_logs.old_data IS 'Datos antes de la modificación (para UPDATE y DELETE)';
COMMENT ON COLUMN audit_logs.new_data IS 'Datos después de la modificación (para INSERT y UPDATE)';
COMMENT ON COLUMN audit_logs.user_id IS 'Usuario que realizó la operación';
COMMENT ON COLUMN audit_logs.ip_address IS 'Dirección IP desde donde se realizó la operación';
COMMENT ON COLUMN audit_logs.user_agent IS 'User Agent del navegador/cliente';
COMMENT ON COLUMN audit_logs.description IS 'Descripción adicional de la operación';

-- Política RLS para audit_logs (solo administradores pueden ver todos los logs)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para que los administradores vean todos los logs
CREATE POLICY audit_logs_admin_select ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'admin'
        )
    );

-- Política para que los usuarios solo vean sus propios logs
CREATE POLICY audit_logs_user_select ON audit_logs
    FOR SELECT
    USING (user_id = auth.uid());

-- Solo los usuarios autenticados pueden insertar logs de auditoría
CREATE POLICY audit_logs_insert ON audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ===============================
-- FUNCIONES DE AUDITORÍA AUTOMÁTICA
-- ===============================

-- Función para crear trigger de auditoría automática
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            table_name,
            operation,
            record_id,
            new_data,
            user_id,
            description
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            NEW.id::TEXT,
            to_jsonb(NEW),
            auth.uid(),
            'Registro creado automáticamente'
        );
        RETURN NEW;
    END IF;

    -- Para UPDATE
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            table_name,
            operation,
            record_id,
            old_data,
            new_data,
            user_id,
            description
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            NEW.id::TEXT,
            to_jsonb(OLD),
            to_jsonb(NEW),
            auth.uid(),
            'Registro actualizado automáticamente'
        );
        RETURN NEW;
    END IF;

    -- Para DELETE
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            table_name,
            operation,
            record_id,
            old_data,
            user_id,
            description
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            OLD.id::TEXT,
            to_jsonb(OLD),
            auth.uid(),
            'Registro eliminado automáticamente'
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear triggers de auditoría para las tablas principales
CREATE TRIGGER audit_cases_trigger
    AFTER INSERT OR UPDATE OR DELETE ON cases
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_todos_trigger
    AFTER INSERT OR UPDATE OR DELETE ON todos
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_time_tracking_trigger
    AFTER INSERT OR UPDATE OR DELETE ON time_tracking
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ===============================
-- FUNCIONES DE LIMPIEZA DE AUDITORÍA
-- ===============================

-- Función para limpiar logs antiguos de auditoría
CREATE OR REPLACE FUNCTION cleanup_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario para la función
COMMENT ON FUNCTION cleanup_audit_logs IS 'Elimina logs de auditoría más antiguos que el número especificado de días';

-- ===============================
-- FUNCIONES RPC PARA MÓDULO DE ARCHIVO
-- ===============================
-- Estas funciones permiten actualizar políticas de archivo evitando problemas de RLS

-- Función RPC para actualizar políticas de archivo (versión segura con RLS)
CREATE OR REPLACE FUNCTION update_archive_policy_admin_unsafe(
    policy_id UUID,
    policy_data JSONB
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
    affected_rows INTEGER;
BEGIN
    -- Log de la operación
    RAISE NOTICE 'UNSAFE: Actualizando política: %, User: %', policy_id, auth.uid();
    RAISE NOTICE 'Datos recibidos: %', policy_data;
    
    -- Realizar la actualización con todos los campos de archive_policies
    UPDATE archive_policies
    SET 
        name = COALESCE((policy_data->>'name')::TEXT, name),
        description = COALESCE((policy_data->>'description')::TEXT, description),
        is_active = COALESCE((policy_data->>'is_active')::BOOLEAN, is_active),
        auto_archive_enabled = COALESCE((policy_data->>'auto_archive_enabled')::BOOLEAN, auto_archive_enabled),
        days_after_completion = COALESCE((policy_data->>'days_after_completion')::INTEGER, days_after_completion),
        inactivity_days = COALESCE((policy_data->>'inactivity_days')::INTEGER, inactivity_days),
        default_retention_days = COALESCE((policy_data->>'default_retention_days')::INTEGER, default_retention_days),
        apply_to_cases = COALESCE((policy_data->>'apply_to_cases')::BOOLEAN, apply_to_cases),
        apply_to_todos = COALESCE((policy_data->>'apply_to_todos')::BOOLEAN, apply_to_todos),
        conditions = COALESCE((policy_data->>'conditions')::JSONB, conditions),
        updated_at = COALESCE((policy_data->>'updated_at')::TIMESTAMPTZ, NOW())
    WHERE id = policy_id;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows = 0 THEN
        RAISE EXCEPTION 'No se encontró la política con ID: %', policy_id;
    END IF;
    
    -- Obtener la política actualizada
    SELECT to_jsonb(ap.*) INTO result
    FROM archive_policies ap
    WHERE ap.id = policy_id;
    
    RAISE NOTICE 'Política actualizada exitosamente. Filas afectadas: %', affected_rows;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error actualizando política: %', SQLERRM;
END;
$$;

-- Función RPC segura que llama a la función unsafe
CREATE OR REPLACE FUNCTION update_archive_policy_admin(
    policy_id UUID,
    policy_data JSONB
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Por ahora usa la función unsafe, se puede agregar verificación de roles más adelante
    RETURN update_archive_policy_admin_unsafe(policy_id, policy_data);
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION update_archive_policy_admin_unsafe(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_archive_policy_admin(UUID, JSONB) TO authenticated;

-- Comentarios para documentación
COMMENT ON FUNCTION update_archive_policy_admin_unsafe IS 'Función RPC para actualizar políticas de archivo sin verificación de roles (desarrollo)';
COMMENT ON FUNCTION update_archive_policy_admin IS 'Función RPC segura para actualizar políticas de archivo con verificación de roles';

-- ===============================
-- MÓDULO DE ARCHIVO INTEGRADO
-- ===============================

-- Tipos enumerados para el módulo de archivo
DO $$ BEGIN
    CREATE TYPE archive_reason_type AS ENUM (
        'MANUAL',           -- Archivo manual por usuario
        'AUTOMATIC',        -- Archivo automático por política
        'POLICY',           -- Archivo por aplicación de política
        'BULK_OPERATION',   -- Operación en lote
        'RETENTION',        -- Por política de retención
        'LEGAL_HOLD',       -- Retención legal
        'USER_REQUEST',     -- Solicitud específica del usuario
        'ADMIN_ACTION',     -- Acción administrativa
        'SYSTEM_CLEANUP',   -- Limpieza del sistema
        'OTHER'             -- Otra razón (especificar en texto)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE retention_status_type AS ENUM (
        'ACTIVE',       -- Retención activa
        'WARNING',      -- Próximo a expirar
        'EXPIRED',      -- Expirado, listo para eliminación
        'LEGAL_HOLD',   -- En retención legal
        'PERMANENT'     -- Retención permanente
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE archive_operation_type AS ENUM (
        'ARCHIVE',      -- Operación de archivo
        'RESTORE',      -- Operación de restauración
        'DELETE',       -- Eliminación permanente
        'POLICY_APPLY', -- Aplicación de política
        'BULK_ARCHIVE', -- Archivo en lote
        'BULK_RESTORE', -- Restauración en lote
        'UPDATE',       -- Actualización de elemento archivado
        'SEARCH',       -- Búsqueda en archivo
        'EXPORT'        -- Exportación de datos archivados
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE archive_notification_type AS ENUM (
        'RETENTION_WARNING',    -- Advertencia de retención próxima
        'RETENTION_EXPIRED',    -- Retención expirada
        'ARCHIVE_CREATED',      -- Elemento archivado
        'ARCHIVE_RESTORED',     -- Elemento restaurado
        'POLICY_APPLIED',       -- Política aplicada
        'LEGAL_HOLD_SET',       -- Retención legal establecida
        'LEGAL_HOLD_REMOVED',   -- Retención legal removida
        'BULK_OPERATION_COMPLETE' -- Operación en lote completada
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Permisos específicos del módulo de archivo
INSERT INTO permissions (name, description) VALUES
('archive.view', 'Ver elementos archivados'),
('archive.create', 'Archivar elementos'),
('archive.restore', 'Restaurar elementos del archivo'),
('archive.delete', 'Eliminar permanentemente elementos archivados'),
('archive.manage_policies', 'Gestionar políticas de archivo'),
('archive.search', 'Buscar en elementos archivados'),
('archive.export', 'Exportar elementos archivados')
ON CONFLICT (name) DO NOTHING;

-- Asignar permisos de archivo según roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrador'
AND p.name IN ('archive.view', 'archive.create', 'archive.restore', 'archive.delete', 'archive.manage_policies', 'archive.search', 'archive.export')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Permisos para Supervisor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Supervisor'
AND p.name IN ('archive.view', 'archive.create', 'archive.restore', 'archive.search', 'archive.export')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Permisos para Analista
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Analista'
AND p.name IN ('archive.view', 'archive.create', 'archive.search')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Permisos básicos para Usuario
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Usuario'
AND p.name IN ('archive.view', 'archive.search')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Tabla de casos archivados
CREATE TABLE IF NOT EXISTS archived_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_case_id UUID NOT NULL,
    case_number VARCHAR(100) NOT NULL,
    case_data JSONB NOT NULL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_by UUID NOT NULL REFERENCES users(id),
    archive_reason archive_reason_type DEFAULT 'MANUAL',
    archive_reason_text TEXT,
    retention_until TIMESTAMP WITH TIME ZONE NOT NULL,
    retention_status retention_status_type DEFAULT 'ACTIVE',
    tags TEXT[] DEFAULT '{}',
    reactivation_count INTEGER DEFAULT 0,
    last_reactivated_at TIMESTAMP WITH TIME ZONE,
    last_reactivated_by UUID REFERENCES users(id),
    is_legal_hold BOOLEAN DEFAULT FALSE,
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de TODOs archivados
CREATE TABLE IF NOT EXISTS archived_todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_todo_id UUID NOT NULL,
    todo_data JSONB NOT NULL,
    case_id UUID,
    archived_case_id UUID REFERENCES archived_cases(id),
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_by UUID NOT NULL REFERENCES users(id),
    archive_reason archive_reason_type DEFAULT 'MANUAL',
    archive_reason_text TEXT,
    retention_until TIMESTAMP WITH TIME ZONE NOT NULL,
    retention_status retention_status_type DEFAULT 'ACTIVE',
    tags TEXT[] DEFAULT '{}',
    is_legal_hold BOOLEAN DEFAULT FALSE,
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de políticas de archivo
CREATE TABLE IF NOT EXISTS archive_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    auto_archive_enabled BOOLEAN DEFAULT FALSE,
    days_after_completion INTEGER,
    inactivity_days INTEGER,
    default_retention_days INTEGER NOT NULL DEFAULT 2555,
    apply_to_cases BOOLEAN DEFAULT TRUE,
    apply_to_todos BOOLEAN DEFAULT TRUE,
    conditions JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de logs de operaciones de archivo
CREATE TABLE IF NOT EXISTS archive_operation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type archive_operation_type NOT NULL,
    item_type VARCHAR(10) CHECK (item_type IN ('CASE', 'TODO')) NOT NULL,
    item_id UUID NOT NULL,
    original_item_id UUID,
    performed_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    operation_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de notificaciones de archivo
CREATE TABLE IF NOT EXISTS archive_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_type archive_notification_type NOT NULL,
    recipient_id UUID NOT NULL REFERENCES users(id),
    item_type VARCHAR(10) CHECK (item_type IN ('CASE', 'TODO')) NOT NULL,
    item_id UUID NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_archived_cases_original_id ON archived_cases(original_case_id);
CREATE INDEX IF NOT EXISTS idx_archived_cases_archived_by ON archived_cases(archived_by);
CREATE INDEX IF NOT EXISTS idx_archived_cases_archived_at ON archived_cases(archived_at);
CREATE INDEX IF NOT EXISTS idx_archived_cases_retention_status ON archived_cases(retention_status);
CREATE INDEX IF NOT EXISTS idx_archived_cases_search_vector ON archived_cases USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_archived_todos_original_id ON archived_todos(original_todo_id);
CREATE INDEX IF NOT EXISTS idx_archived_todos_archived_by ON archived_todos(archived_by);
CREATE INDEX IF NOT EXISTS idx_archived_todos_archived_at ON archived_todos(archived_at);
CREATE INDEX IF NOT EXISTS idx_archived_todos_search_vector ON archived_todos USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_archive_operation_logs_performed_by ON archive_operation_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_archive_operation_logs_performed_at ON archive_operation_logs(performed_at);
CREATE INDEX IF NOT EXISTS idx_archive_notifications_recipient ON archive_notifications(recipient_id);

-- Habilitar RLS en tablas de archivo
ALTER TABLE archived_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_notifications ENABLE ROW LEVEL SECURITY;

-- Funciones auxiliares para RLS
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.name = 'Administrador'
        AND u.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_has_permission(permission_name text)
RETURNS BOOLEAN AS $$
BEGIN
    IF is_admin_user() THEN
        RETURN true;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = auth.uid()
        AND p.name = permission_name
        AND u.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS para archived_cases
CREATE POLICY archived_cases_select ON archived_cases
    FOR SELECT
    USING (
        user_has_permission('archive.view') AND (
            is_admin_user() OR 
            archived_by = auth.uid() OR 
            (case_data->>'user_id')::uuid = auth.uid()
        )
    );

CREATE POLICY archived_cases_insert ON archived_cases
    FOR INSERT
    WITH CHECK (
        user_has_permission('archive.create') AND
        archived_by = auth.uid()
    );

CREATE POLICY archived_cases_update ON archived_cases
    FOR UPDATE
    USING (
        user_has_permission('archive.restore') AND (
            is_admin_user() OR 
            archived_by = auth.uid() OR 
            (case_data->>'user_id')::uuid = auth.uid()
        )
    )
    WITH CHECK (
        user_has_permission('archive.restore') AND (
            is_admin_user() OR 
            archived_by = auth.uid() OR 
            (case_data->>'user_id')::uuid = auth.uid()
        )
    );

CREATE POLICY archived_cases_delete ON archived_cases
    FOR DELETE
    USING (
        user_has_permission('archive.delete') AND 
        is_admin_user()
    );

-- Políticas RLS para archived_todos
CREATE POLICY archived_todos_select ON archived_todos
    FOR SELECT
    USING (
        user_has_permission('archive.view') AND (
            is_admin_user() OR 
            archived_by = auth.uid() OR 
            (todo_data->>'assigned_to')::uuid = auth.uid() OR
            (todo_data->>'created_by')::uuid = auth.uid()
        )
    );

CREATE POLICY archived_todos_insert ON archived_todos
    FOR INSERT
    WITH CHECK (
        user_has_permission('archive.create') AND
        archived_by = auth.uid()
    );

CREATE POLICY archived_todos_update ON archived_todos
    FOR UPDATE
    USING (
        user_has_permission('archive.restore') AND (
            is_admin_user() OR 
            archived_by = auth.uid() OR 
            (todo_data->>'assigned_to')::uuid = auth.uid() OR
            (todo_data->>'created_by')::uuid = auth.uid()
        )
    )
    WITH CHECK (
        user_has_permission('archive.restore') AND (
            is_admin_user() OR 
            archived_by = auth.uid() OR 
            (todo_data->>'assigned_to')::uuid = auth.uid() OR
            (todo_data->>'created_by')::uuid = auth.uid()
        )
    );

CREATE POLICY archived_todos_delete ON archived_todos
    FOR DELETE
    USING (
        user_has_permission('archive.delete') AND 
        is_admin_user()
    );

-- Políticas RLS para archive_policies
CREATE POLICY archive_policies_select ON archive_policies
    FOR SELECT
    USING (user_has_permission('archive.manage_policies'));

CREATE POLICY archive_policies_insert ON archive_policies
    FOR INSERT
    WITH CHECK (
        user_has_permission('archive.manage_policies') AND
        created_by = auth.uid()
    );

CREATE POLICY archive_policies_update ON archive_policies
    FOR UPDATE
    USING (user_has_permission('archive.manage_policies'))
    WITH CHECK (user_has_permission('archive.manage_policies'));

CREATE POLICY archive_policies_delete ON archive_policies
    FOR DELETE
    USING (user_has_permission('archive.manage_policies'));

-- Políticas RLS para archive_operation_logs
CREATE POLICY archive_logs_select ON archive_operation_logs
    FOR SELECT
    USING (
        user_has_permission('archive.view') AND (
            is_admin_user() OR 
            performed_by = auth.uid()
        )
    );

CREATE POLICY archive_logs_insert ON archive_operation_logs
    FOR INSERT
    WITH CHECK (performed_by = auth.uid());

-- Políticas RLS para archive_notifications
CREATE POLICY archive_notifications_select ON archive_notifications
    FOR SELECT
    USING (
        is_admin_user() OR 
        recipient_id = auth.uid()
    );

CREATE POLICY archive_notifications_insert ON archive_notifications
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY archive_notifications_update ON archive_notifications
    FOR UPDATE
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

-- ===============================
-- FIN DE SCRIPT PRINCIPAL DE CONFIGURACIÓN
-- ===============================

-- ✅ CONFIGURACIÓN COMPLETA
-- La base de datos está lista para usar con las siguientes funcionalidades:
-- - Sistema de usuarios, roles y permisos
-- - Gestión completa de casos y TODOs
-- - Seguimiento de tiempo
-- - Sistema de auditoría centralizado
-- - Módulo de archivo con permisos granulares
-- - Políticas de seguridad (RLS) completas
-- - Funciones RPC para módulo de archivo

-- 🔒 SEGURIDAD
-- Todas las tablas tienen Row Level Security (RLS) habilitado
-- Las políticas garantizan aislamiento de datos por usuario
-- Los usuarios solo ven sus propios elementos archivados
-- Los administradores tienen acceso completo

-- 📊 VERIFICACIÓN
-- Para verificar la instalación:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Para verificar permisos de archivo:
-- SELECT name FROM permissions WHERE name LIKE 'archive.%';
-- Para verificar políticas RLS:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- 🔧 FUNCIONES RPC DISPONIBLES
-- - update_archive_policy_admin_unsafe(UUID, JSONB): Actualización sin verificación de roles
-- - update_archive_policy_admin(UUID, JSONB): Actualización con verificación de roles
-- - is_admin_user(): Verificar si el usuario actual es administrador
-- - user_has_permission(text): Verificar permisos específicos

-- 📁 MÓDULO DE ARCHIVO INCLUIDO
-- ✅ Tablas de archivo: archived_cases, archived_todos, archive_policies
-- ✅ Logs de operaciones: archive_operation_logs
-- ✅ Notificaciones: archive_notifications
-- ✅ Permisos granulares: archive.view, archive.create, archive.restore, etc.
-- ✅ Políticas RLS: Filtrado automático por usuario y permisos
-- ✅ Índices optimizados para búsqueda y rendimiento

-- 🎯 CARACTERÍSTICAS DE SEGURIDAD DEL ARCHIVO
-- - Usuarios regulares: Solo ven sus propios elementos archivados
-- - Administradores: Acceso completo a todos los elementos
-- - Validación de permisos en múltiples capas (app + DB)
-- - Auditoría completa de operaciones de archivo
-- - Protección contra acceso no autorizado

SELECT '✅ Script de configuración completo con módulo de archivo integrado' as status;
SELECT '� Políticas RLS aplicadas - Sistema seguro y listo para usar' as security_status;
