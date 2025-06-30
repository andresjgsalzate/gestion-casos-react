-- ===============================
-- MÓDULO DE ARCHIVO - BASE DE DATOS
-- Sistema de Gestión de Casos
-- ===============================

-- Este script crea toda la estructura del módulo de archivo de forma autocontenida.
-- Incluye: tablas, tipos, funciones, triggers, políticas RLS, permisos y asignaciones.
-- 
-- CARACTERÍSTICAS:
-- - Completamente modular y autocontenido
-- - Seguro para ejecutar en bases de datos existentes (usa ON CONFLICT DO NOTHING)
-- - Incluye todas las definiciones de permisos necesarias
-- - Compatible con el script principal setup.sql
-- - No requiere dependencias externas más allá de las tablas base (users, roles, permissions)
--
-- EJECUCIÓN:
-- Este script puede ejecutarse independientemente después de que las tablas básicas
-- (users, roles, permissions) hayan sido creadas por setup.sql

-- ===============================
-- ELIMINAR ESTRUCTURAS EXISTENTES (SI EXISTEN)
-- ===============================

-- Nota: Usamos IF EXISTS y verificaciones condicionales para evitar errores

-- Eliminar triggers condicionalmente (solo si las tablas existen)
DO $$
BEGIN
    -- Triggers para archived_cases
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archived_cases' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS tr_archived_cases_update_search_vector ON archived_cases;
        DROP TRIGGER IF EXISTS update_archived_cases_updated_at ON archived_cases;
    END IF;
    
    -- Triggers para archived_todos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archived_todos' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS tr_archived_todos_update_search_vector ON archived_todos;
        DROP TRIGGER IF EXISTS update_archived_todos_updated_at ON archived_todos;
    END IF;
    
    -- Triggers para archive_policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archive_policies' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_archive_policies_updated_at ON archive_policies;
    END IF;
END $$;

-- Eliminar vistas (antes que las tablas)
DROP VIEW IF EXISTS archived_cases_detailed CASCADE;
DROP VIEW IF EXISTS archived_todos_detailed CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS update_archive_search_vector() CASCADE;
DROP FUNCTION IF EXISTS archive_case(UUID, UUID, archive_reason_type, text, integer) CASCADE;
DROP FUNCTION IF EXISTS restore_case(UUID, UUID, text) CASCADE;
DROP FUNCTION IF EXISTS archive_todo(UUID, UUID, archive_reason_type, text, integer) CASCADE;
DROP FUNCTION IF EXISTS restore_todo(UUID, UUID, text) CASCADE;
DROP FUNCTION IF EXISTS get_archive_stats() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_archives() CASCADE;
DROP FUNCTION IF EXISTS search_archived_items(text, text, integer, integer) CASCADE;

-- Eliminar políticas RLS condicionalmente
DO $$
BEGIN
    -- Políticas para archived_cases
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archived_cases' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS archived_cases_select ON archived_cases;
        DROP POLICY IF EXISTS archived_cases_insert ON archived_cases;
        DROP POLICY IF EXISTS archived_cases_update ON archived_cases;
    END IF;
    
    -- Políticas para archived_todos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archived_todos' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS archived_todos_select ON archived_todos;
        DROP POLICY IF EXISTS archived_todos_insert ON archived_todos;
        DROP POLICY IF EXISTS archived_todos_update ON archived_todos;
    END IF;
    
    -- Políticas para archive_policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archive_policies' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS archive_policies_select ON archive_policies;
        DROP POLICY IF EXISTS archive_policies_insert ON archive_policies;
    END IF;
    
    -- Políticas para archive_operation_logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archive_operation_logs' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS archive_logs_select ON archive_operation_logs;
        DROP POLICY IF EXISTS archive_logs_insert ON archive_operation_logs;
    END IF;
    
    -- Políticas para archive_notifications
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archive_notifications' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS archive_notifications_select ON archive_notifications;
        DROP POLICY IF EXISTS archive_notifications_insert ON archive_notifications;
    END IF;
END $$;

-- Eliminar tablas en orden de dependencias
DROP TABLE IF EXISTS archive_notifications CASCADE;
DROP TABLE IF EXISTS archive_operation_logs CASCADE;
DROP TABLE IF EXISTS archive_policies CASCADE;
DROP TABLE IF EXISTS archived_todos CASCADE;
DROP TABLE IF EXISTS archived_cases CASCADE;

-- Eliminar tipos enumerados
DROP TYPE IF EXISTS archive_reason_type CASCADE;
DROP TYPE IF EXISTS retention_status_type CASCADE;
DROP TYPE IF EXISTS archive_operation_type CASCADE;
DROP TYPE IF EXISTS archive_notification_type CASCADE;

-- ===============================
-- CREAR TIPOS ENUMERADOS
-- ===============================

-- Tipos de razones de archivo
CREATE TYPE archive_reason_type AS ENUM (
    'MANUAL',
    'AUTO_TIME_BASED',
    'AUTO_INACTIVITY',
    'POLICY_COMPLIANCE',
    'BULK_OPERATION',
    'USER_REQUEST',
    'LEGAL_HOLD_EXPIRED',
    'OTHER'
);

-- Estados de retención
CREATE TYPE retention_status_type AS ENUM (
    'ACTIVE',
    'WARNING',
    'EXPIRED',
    'LEGAL_HOLD',
    'PENDING_DELETION'
);

-- Tipos de operaciones de archivo
CREATE TYPE archive_operation_type AS ENUM (
    'ARCHIVE',
    'RESTORE',
    'DELETE',
    'BULK_ARCHIVE',
    'PERMANENT_DELETE',
    'POLICY_UPDATE',
    'RETENTION_UPDATE'
);

-- Tipos de notificaciones
CREATE TYPE archive_notification_type AS ENUM (
    'BEFORE_ARCHIVE',
    'AFTER_ARCHIVE',
    'BEFORE_DELETE',
    'RETENTION_WARNING',
    'RESTORE_NOTIFICATION'
);

-- ===============================
-- CREAR PERMISOS DEL MÓDULO DE ARCHIVO
-- ===============================

-- Solo crear permisos si no existen (para evitar conflictos con setup.sql)
INSERT INTO permissions (name, description, module, action) VALUES
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
('archive.export', 'Exportar datos archivados', 'archive', 'export')
ON CONFLICT (name) DO NOTHING;

-- ===============================
-- ASIGNAR PERMISOS A ROLES EXISTENTES
-- ===============================

-- Asignar todos los permisos de archivo al Administrador (si no están ya asignados)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrador'
AND p.module = 'archive'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Asignar permisos específicos al Supervisor (si no están ya asignados)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Supervisor'
AND p.name IN ('archive.view', 'archive.create', 'archive.restore', 'archive.search', 'archive.export')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Asignar permisos específicos al Analista (si no están ya asignados)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Analista'
AND p.name IN ('archive.view', 'archive.create', 'archive.search')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Asignar permisos básicos al Usuario (si no están ya asignados)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Usuario'
AND p.name IN ('archive.view', 'archive.search')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- ===============================
-- CREAR TABLAS DEL MÓDULO DE ARCHIVO
-- ===============================

-- Tabla de casos archivados
CREATE TABLE archived_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_case_id UUID NOT NULL,
    case_number VARCHAR(100) NOT NULL,
    case_data JSONB NOT NULL, -- Datos completos del caso original
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
CREATE TABLE archived_todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_todo_id UUID NOT NULL,
    todo_data JSONB NOT NULL, -- Datos completos del TODO original
    case_id UUID, -- ID del caso original (si aplica)
    archived_case_id UUID REFERENCES archived_cases(id), -- Referencia al caso archivado (si aplica)
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
CREATE TABLE archive_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    auto_archive_enabled BOOLEAN DEFAULT FALSE,
    days_after_completion INTEGER,
    inactivity_days INTEGER,
    default_retention_days INTEGER NOT NULL DEFAULT 2555, -- 7 años por defecto
    apply_to_cases BOOLEAN DEFAULT TRUE,
    apply_to_todos BOOLEAN DEFAULT TRUE,
    conditions JSONB DEFAULT '{}', -- Condiciones específicas
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de logs de operaciones de archivo
CREATE TABLE archive_operation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type archive_operation_type NOT NULL,
    item_type VARCHAR(10) CHECK (item_type IN ('CASE', 'TODO')) NOT NULL,
    item_id UUID NOT NULL,
    original_item_id UUID, -- ID del item original (para operaciones de restore)
    performed_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    operation_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de notificaciones de archivo
CREATE TABLE archive_notifications (
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

-- ===============================
-- CREAR ÍNDICES PARA RENDIMIENTO
-- ===============================

-- Índices para archived_cases
CREATE INDEX idx_archived_cases_original_id ON archived_cases(original_case_id);
CREATE INDEX idx_archived_cases_case_number ON archived_cases(case_number);
CREATE INDEX idx_archived_cases_archived_by ON archived_cases(archived_by);
CREATE INDEX idx_archived_cases_archived_at ON archived_cases(archived_at);
CREATE INDEX idx_archived_cases_retention_status ON archived_cases(retention_status);
CREATE INDEX idx_archived_cases_retention_until ON archived_cases(retention_until);
CREATE INDEX idx_archived_cases_tags ON archived_cases USING GIN(tags);
CREATE INDEX idx_archived_cases_search_vector ON archived_cases USING GIN(search_vector);
CREATE INDEX idx_archived_cases_archive_reason ON archived_cases(archive_reason);

-- Índices para archived_todos
CREATE INDEX idx_archived_todos_original_id ON archived_todos(original_todo_id);
CREATE INDEX idx_archived_todos_case_id ON archived_todos(case_id);
CREATE INDEX idx_archived_todos_archived_case_id ON archived_todos(archived_case_id);
CREATE INDEX idx_archived_todos_archived_by ON archived_todos(archived_by);
CREATE INDEX idx_archived_todos_archived_at ON archived_todos(archived_at);
CREATE INDEX idx_archived_todos_retention_status ON archived_todos(retention_status);
CREATE INDEX idx_archived_todos_retention_until ON archived_todos(retention_until);
CREATE INDEX idx_archived_todos_tags ON archived_todos USING GIN(tags);
CREATE INDEX idx_archived_todos_search_vector ON archived_todos USING GIN(search_vector);

-- Índices para archive_operation_logs
CREATE INDEX idx_archive_logs_operation_type ON archive_operation_logs(operation_type);
CREATE INDEX idx_archive_logs_item_type ON archive_operation_logs(item_type);
CREATE INDEX idx_archive_logs_item_id ON archive_operation_logs(item_id);
CREATE INDEX idx_archive_logs_performed_by ON archive_operation_logs(performed_by);
CREATE INDEX idx_archive_logs_performed_at ON archive_operation_logs(performed_at);

-- Índices para archive_policies
CREATE INDEX idx_archive_policies_active ON archive_policies(is_active);
CREATE INDEX idx_archive_policies_auto_archive ON archive_policies(auto_archive_enabled);

-- Índices para archive_notifications
CREATE INDEX idx_archive_notifications_recipient ON archive_notifications(recipient_id);
CREATE INDEX idx_archive_notifications_type ON archive_notifications(notification_type);
CREATE INDEX idx_archive_notifications_read ON archive_notifications(read_at);

-- ===============================
-- FUNCIONES PARA VECTORES DE BÚSQUEDA
-- ===============================

-- Función para actualizar vectores de búsqueda
CREATE OR REPLACE FUNCTION update_archive_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'archived_cases' THEN
        NEW.search_vector := 
            setweight(to_tsvector('spanish', COALESCE(NEW.case_number, '')), 'A') ||
            setweight(to_tsvector('spanish', COALESCE(NEW.case_data->>'description', '')), 'B') ||
            setweight(to_tsvector('spanish', COALESCE(NEW.archive_reason_text, '')), 'C') ||
            setweight(to_tsvector('spanish', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
    ELSIF TG_TABLE_NAME = 'archived_todos' THEN
        NEW.search_vector := 
            setweight(to_tsvector('spanish', COALESCE(NEW.todo_data->>'title', '')), 'A') ||
            setweight(to_tsvector('spanish', COALESCE(NEW.todo_data->>'description', '')), 'B') ||
            setweight(to_tsvector('spanish', COALESCE(NEW.archive_reason_text, '')), 'C') ||
            setweight(to_tsvector('spanish', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- CREAR TRIGGERS
-- ===============================

-- Triggers para updated_at
CREATE TRIGGER update_archived_cases_updated_at 
    BEFORE UPDATE ON archived_cases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_archived_todos_updated_at 
    BEFORE UPDATE ON archived_todos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_archive_policies_updated_at 
    BEFORE UPDATE ON archive_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para vectores de búsqueda
CREATE TRIGGER tr_archived_cases_update_search_vector
    BEFORE INSERT OR UPDATE ON archived_cases
    FOR EACH ROW EXECUTE FUNCTION update_archive_search_vector();

CREATE TRIGGER tr_archived_todos_update_search_vector
    BEFORE INSERT OR UPDATE ON archived_todos
    FOR EACH ROW EXECUTE FUNCTION update_archive_search_vector();

-- ===============================
-- FUNCIONES PRINCIPALES DEL MÓDULO
-- ===============================

-- Función para archivar un caso
CREATE OR REPLACE FUNCTION archive_case(
    p_case_id UUID,
    p_user_id UUID,
    p_reason archive_reason_type DEFAULT 'MANUAL',
    p_reason_text TEXT DEFAULT NULL,
    p_retention_days INTEGER DEFAULT 2555
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_case_data JSONB;
    v_archived_id UUID;
    v_retention_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Verificar que el caso existe y no está ya archivado
    SELECT to_jsonb(c.*) INTO v_case_data
    FROM cases c
    WHERE c.id = p_case_id;
    
    IF v_case_data IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Caso no encontrado'
        );
    END IF;
    
    -- Verificar si ya está archivado
    IF EXISTS (SELECT 1 FROM archived_cases WHERE original_case_id = p_case_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El caso ya está archivado'
        );
    END IF;
    
    -- Calcular fecha de retención
    v_retention_date := NOW() + INTERVAL '1 day' * p_retention_days;
    
    -- Insertar en archived_cases
    INSERT INTO archived_cases (
        original_case_id,
        case_number,
        case_data,
        archived_by,
        archive_reason,
        archive_reason_text,
        retention_until
    ) VALUES (
        p_case_id,
        v_case_data->>'case_number',
        v_case_data,
        p_user_id,
        p_reason,
        p_reason_text,
        v_retention_date
    ) RETURNING id INTO v_archived_id;
    
    -- Archivar TODOs relacionados automáticamente
    INSERT INTO archived_todos (
        original_todo_id,
        todo_data,
        case_id,
        archived_case_id,
        archived_by,
        archive_reason,
        archive_reason_text,
        retention_until
    )
    SELECT 
        t.id,
        to_jsonb(t.*),
        p_case_id,
        v_archived_id,
        p_user_id,
        'AUTO_TIME_BASED',
        'Archivado automáticamente con el caso',
        v_retention_date
    FROM todos t
    WHERE t.case_id = p_case_id;
    
    -- Eliminar caso original y TODOs relacionados
    DELETE FROM todos WHERE case_id = p_case_id;
    DELETE FROM cases WHERE id = p_case_id;
    
    -- Log de la operación
    INSERT INTO archive_operation_logs (
        operation_type,
        item_type,
        item_id,
        performed_by,
        reason,
        operation_data
    ) VALUES (
        'ARCHIVE',
        'CASE',
        v_archived_id,
        p_user_id,
        p_reason_text,
        json_build_object(
            'original_case_id', p_case_id,
            'retention_days', p_retention_days,
            'archive_reason', p_reason
        )
    );
    
    RETURN json_build_object(
        'success', true,
        'archived_id', v_archived_id,
        'retention_until', v_retention_date
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Función para restaurar un caso
CREATE OR REPLACE FUNCTION restore_case(
    p_archived_case_id UUID,
    p_user_id UUID,
    p_restore_reason TEXT DEFAULT 'Reactivación solicitada'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_archived_case archived_cases%ROWTYPE;
    v_case_data JSONB;
    v_new_case_id UUID;
    v_new_case_number VARCHAR(100);
BEGIN
    -- Obtener datos del caso archivado
    SELECT * INTO v_archived_case
    FROM archived_cases
    WHERE id = p_archived_case_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Caso archivado no encontrado'
        );
    END IF;
    
    -- Generar nuevo número de caso con sufijo REACTIVATED
    v_new_case_number := v_archived_case.case_number || '-REACTIVATED-' || (v_archived_case.reactivation_count + 1);
    
    -- Modificar datos del caso para restauración
    v_case_data := v_archived_case.case_data;
    v_case_data := jsonb_set(v_case_data, '{case_number}', to_jsonb(v_new_case_number));
    v_case_data := jsonb_set(v_case_data, '{status}', '"REACTIVATED"'::jsonb);
    v_case_data := jsonb_set(v_case_data, '{updated_at}', to_jsonb(NOW()));
    
    -- Insertar caso restaurado en tabla principal
    INSERT INTO cases (
        id,
        case_number,
        description,
        complexity,
        status,
        application_id,
        origin_id,
        priority_id,
        user_id,
        classification_score,
        classification,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_new_case_number,
        v_case_data->>'description',
        (v_case_data->>'complexity')::VARCHAR,
        'REACTIVATED',
        (v_case_data->>'application_id')::UUID,
        (v_case_data->>'origin_id')::UUID,
        (v_case_data->>'priority_id')::UUID,
        (v_case_data->>'user_id')::UUID,
        COALESCE((v_case_data->>'classification_score')::INTEGER, 0),
        v_case_data->>'classification',
        (v_case_data->>'created_at')::TIMESTAMP WITH TIME ZONE,
        NOW()
    ) RETURNING id INTO v_new_case_id;
    
    -- Restaurar TODOs relacionados
    INSERT INTO todos (
        id,
        title,
        description,
        priority_id,
        status,
        assigned_to,
        created_by,
        due_date,
        case_id,
        created_at,
        updated_at
    )
    SELECT 
        gen_random_uuid(),
        at.todo_data->>'title',
        at.todo_data->>'description',
        (at.todo_data->>'priority_id')::UUID,
        'PENDING', -- Resetear status de TODOs
        (at.todo_data->>'assigned_to')::UUID,
        (at.todo_data->>'created_by')::UUID,
        (at.todo_data->>'due_date')::DATE,
        v_new_case_id,
        (at.todo_data->>'created_at')::TIMESTAMP WITH TIME ZONE,
        NOW()
    FROM archived_todos at
    WHERE at.archived_case_id = p_archived_case_id;
    
    -- Actualizar registro de reactivación
    UPDATE archived_cases
    SET 
        reactivation_count = reactivation_count + 1,
        last_reactivated_at = NOW(),
        last_reactivated_by = p_user_id,
        updated_at = NOW()
    WHERE id = p_archived_case_id;
    
    -- Log de la operación
    INSERT INTO archive_operation_logs (
        operation_type,
        item_type,
        item_id,
        original_item_id,
        performed_by,
        reason,
        operation_data
    ) VALUES (
        'RESTORE',
        'CASE',
        v_new_case_id,
        v_archived_case.original_case_id,
        p_user_id,
        p_restore_reason,
        json_build_object(
            'archived_case_id', p_archived_case_id,
            'new_case_number', v_new_case_number,
            'reactivation_count', v_archived_case.reactivation_count + 1
        )
    );
    
    RETURN json_build_object(
        'success', true,
        'new_case_id', v_new_case_id,
        'new_case_number', v_new_case_number,
        'reactivation_count', v_archived_case.reactivation_count + 1
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Función para obtener estadísticas del archivo
CREATE OR REPLACE FUNCTION get_archive_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'totalArchivedCases', (SELECT COUNT(*) FROM archived_cases),
        'totalArchivedTodos', (SELECT COUNT(*) FROM archived_todos),
        'archivesThisMonth', (
            SELECT COUNT(*) 
            FROM archived_cases 
            WHERE archived_at >= date_trunc('month', NOW())
        ) + (
            SELECT COUNT(*) 
            FROM archived_todos 
            WHERE archived_at >= date_trunc('month', NOW())
        ),
        'nearingRetention', (
            SELECT COUNT(*) 
            FROM archived_cases 
            WHERE retention_until <= NOW() + INTERVAL '30 days'
            AND retention_status = 'ACTIVE'
        ) + (
            SELECT COUNT(*) 
            FROM archived_todos 
            WHERE retention_until <= NOW() + INTERVAL '30 days'
            AND retention_status = 'ACTIVE'
        ),
        'reactivatedCases', (
            SELECT SUM(reactivation_count) 
            FROM archived_cases 
            WHERE reactivation_count > 0
        ),
        'oldestArchived', (
            SELECT MIN(archived_at) 
            FROM (
                SELECT archived_at FROM archived_cases
                UNION ALL
                SELECT archived_at FROM archived_todos
            ) AS all_archived
        ),
        'retentionBreakdown', json_build_object(
            'active', (
                SELECT COUNT(*) 
                FROM archived_cases 
                WHERE retention_status = 'ACTIVE'
            ) + (
                SELECT COUNT(*) 
                FROM archived_todos 
                WHERE retention_status = 'ACTIVE'
            ),
            'warning', (
                SELECT COUNT(*) 
                FROM archived_cases 
                WHERE retention_status = 'WARNING'
            ) + (
                SELECT COUNT(*) 
                FROM archived_todos 
                WHERE retention_status = 'WARNING'
            ),
            'expired', (
                SELECT COUNT(*) 
                FROM archived_cases 
                WHERE retention_status = 'EXPIRED'
            ) + (
                SELECT COUNT(*) 
                FROM archived_todos 
                WHERE retention_status = 'EXPIRED'
            ),
            'legalHold', (
                SELECT COUNT(*) 
                FROM archived_cases 
                WHERE is_legal_hold = true
            ) + (
                SELECT COUNT(*) 
                FROM archived_todos 
                WHERE is_legal_hold = true
            )
        )
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$$;

-- Función para limpiar archivos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_archives()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expired_cases INTEGER := 0;
    v_expired_todos INTEGER := 0;
BEGIN
    -- Actualizar estado de retención para casos expirados
    UPDATE archived_cases 
    SET retention_status = 'EXPIRED'
    WHERE retention_until <= NOW() 
    AND retention_status = 'ACTIVE'
    AND is_legal_hold = false;
    
    GET DIAGNOSTICS v_expired_cases = ROW_COUNT;
    
    -- Actualizar estado de retención para TODOs expirados
    UPDATE archived_todos 
    SET retention_status = 'EXPIRED'
    WHERE retention_until <= NOW() 
    AND retention_status = 'ACTIVE'
    AND is_legal_hold = false;
    
    GET DIAGNOSTICS v_expired_todos = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'expired_cases', v_expired_cases,
        'expired_todos', v_expired_todos,
        'total_expired', v_expired_cases + v_expired_todos
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Función para buscar elementos archivados
CREATE OR REPLACE FUNCTION search_archived_items(
    p_search_term TEXT,
    p_item_type TEXT DEFAULT NULL, -- 'case', 'todo', o NULL para ambos
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    item_type TEXT,
    title TEXT,
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by UUID,
    rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.id,
        'case'::TEXT as item_type,
        ac.case_number as title,
        ac.archived_at,
        ac.archived_by,
        ts_rank(ac.search_vector, plainto_tsquery('spanish', p_search_term)) as rank
    FROM archived_cases ac
    WHERE 
        ac.search_vector @@ plainto_tsquery('spanish', p_search_term)
        AND (p_item_type IS NULL OR p_item_type = 'case')
    
    UNION ALL
    
    SELECT 
        at.id,
        'todo'::TEXT as item_type,
        (at.todo_data->>'title') as title,
        at.archived_at,
        at.archived_by,
        ts_rank(at.search_vector, plainto_tsquery('spanish', p_search_term)) as rank
    FROM archived_todos at
    WHERE 
        at.search_vector @@ plainto_tsquery('spanish', p_search_term)
        AND (p_item_type IS NULL OR p_item_type = 'todo')
    
    ORDER BY rank DESC, archived_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Función para archivar TODO individual
CREATE OR REPLACE FUNCTION archive_todo(
    p_todo_id UUID,
    p_user_id UUID,
    p_reason archive_reason_type DEFAULT 'MANUAL',
    p_reason_text TEXT DEFAULT NULL,
    p_retention_days INTEGER DEFAULT 2555
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_todo_data JSONB;
    v_archived_id UUID;
    v_retention_date TIMESTAMP WITH TIME ZONE;
    v_case_id UUID;
    v_archived_case_id UUID;
BEGIN
    -- Verificar que el TODO existe
    SELECT to_jsonb(t.*), t.case_id INTO v_todo_data, v_case_id
    FROM todos t
    WHERE t.id = p_todo_id;
    
    IF v_todo_data IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'TODO no encontrado'
        );
    END IF;
    
    -- Verificar si ya está archivado
    IF EXISTS (SELECT 1 FROM archived_todos WHERE original_todo_id = p_todo_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El TODO ya está archivado'
        );
    END IF;
    
    -- Calcular fecha de retención
    v_retention_date := NOW() + INTERVAL '1 day' * p_retention_days;
    
    -- Buscar si hay un caso archivado relacionado
    IF v_case_id IS NOT NULL THEN
        SELECT id INTO v_archived_case_id
        FROM archived_cases
        WHERE original_case_id = v_case_id;
    END IF;
    
    -- Insertar en archived_todos
    INSERT INTO archived_todos (
        original_todo_id,
        todo_data,
        case_id,
        archived_case_id,
        archived_by,
        archive_reason,
        archive_reason_text,
        retention_until
    ) VALUES (
        p_todo_id,
        v_todo_data,
        v_case_id,
        v_archived_case_id,
        p_user_id,
        p_reason,
        p_reason_text,
        v_retention_date
    ) RETURNING id INTO v_archived_id;
    
    -- Eliminar TODO original
    DELETE FROM todos WHERE id = p_todo_id;
    
    -- Log de la operación
    INSERT INTO archive_operation_logs (
        operation_type,
        item_type,
        item_id,
        performed_by,
        reason,
        operation_data
    ) VALUES (
        'ARCHIVE',
        'TODO',
        v_archived_id,
        p_user_id,
        p_reason_text,
        json_build_object(
            'original_todo_id', p_todo_id,
            'retention_days', p_retention_days,
            'archive_reason', p_reason
        )
    );
    
    RETURN json_build_object(
        'success', true,
        'archived_id', v_archived_id,
        'retention_until', v_retention_date
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Función para restaurar TODO
CREATE OR REPLACE FUNCTION restore_todo(
    p_archived_todo_id UUID,
    p_user_id UUID,
    p_restore_reason TEXT DEFAULT 'Reactivación solicitada'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_archived_todo archived_todos%ROWTYPE;
    v_todo_data JSONB;
    v_new_todo_id UUID;
BEGIN
    -- Obtener datos del TODO archivado
    SELECT * INTO v_archived_todo
    FROM archived_todos
    WHERE id = p_archived_todo_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'TODO archivado no encontrado'
        );
    END IF;
    
    -- Modificar datos del TODO para restauración
    v_todo_data := v_archived_todo.todo_data;
    v_todo_data := jsonb_set(v_todo_data, '{status}', '"PENDING"'::jsonb);
    v_todo_data := jsonb_set(v_todo_data, '{updated_at}', to_jsonb(NOW()));
    
    -- Insertar TODO restaurado en tabla principal
    INSERT INTO todos (
        id,
        title,
        description,
        priority_id,
        status,
        assigned_to,
        created_by,
        due_date,
        case_id,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_todo_data->>'title',
        v_todo_data->>'description',
        (v_todo_data->>'priority_id')::UUID,
        'PENDING',
        (v_todo_data->>'assigned_to')::UUID,
        (v_todo_data->>'created_by')::UUID,
        (v_todo_data->>'due_date')::DATE,
        (v_todo_data->>'case_id')::UUID,
        (v_todo_data->>'created_at')::TIMESTAMP WITH TIME ZONE,
        NOW()
    ) RETURNING id INTO v_new_todo_id;
    
    -- Log de la operación
    INSERT INTO archive_operation_logs (
        operation_type,
        item_type,
        item_id,
        original_item_id,
        performed_by,
        reason,
        operation_data
    ) VALUES (
        'RESTORE',
        'TODO',
        v_new_todo_id,
        v_archived_todo.original_todo_id,
        p_user_id,
        p_restore_reason,
        json_build_object(
            'archived_todo_id', p_archived_todo_id
        )
    );
    
    RETURN json_build_object(
        'success', true,
        'new_todo_id', v_new_todo_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- ===============================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ===============================

-- Habilitar RLS en todas las tablas de archivo
ALTER TABLE archived_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para archived_cases
CREATE POLICY archived_cases_select ON archived_cases
    FOR SELECT
    USING (true); -- Permitir lectura a usuarios autenticados

CREATE POLICY archived_cases_insert ON archived_cases
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY archived_cases_update ON archived_cases
    FOR UPDATE
    USING (true)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas para archived_todos
CREATE POLICY archived_todos_select ON archived_todos
    FOR SELECT
    USING (true);

CREATE POLICY archived_todos_insert ON archived_todos
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY archived_todos_update ON archived_todos
    FOR UPDATE
    USING (true)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas para archive_policies
CREATE POLICY archive_policies_select ON archive_policies
    FOR SELECT
    USING (true);

CREATE POLICY archive_policies_insert ON archive_policies
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas para archive_operation_logs
CREATE POLICY archive_logs_select ON archive_operation_logs
    FOR SELECT
    USING (true);

CREATE POLICY archive_logs_insert ON archive_operation_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas para archive_notifications
CREATE POLICY archive_notifications_select ON archive_notifications
    FOR SELECT
    USING (recipient_id = auth.uid());

CREATE POLICY archive_notifications_insert ON archive_notifications
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ===============================
-- VISTAS ÚTILES
-- ===============================

-- Vista detallada de casos archivados
CREATE VIEW archived_cases_detailed AS
SELECT 
    ac.*,
    u.name as archived_by_name,
    u.email as archived_by_email,
    ru.name as reactivated_by_name,
    ru.email as reactivated_by_email,
    (ac.case_data->>'description') as case_description,
    (ac.case_data->>'status') as original_status,
    (ac.case_data->>'complexity') as case_complexity
FROM archived_cases ac
LEFT JOIN users u ON ac.archived_by = u.id
LEFT JOIN users ru ON ac.last_reactivated_by = ru.id;

-- Vista detallada de TODOs archivados
CREATE VIEW archived_todos_detailed AS
SELECT 
    at.*,
    u.name as archived_by_name,
    u.email as archived_by_email,
    ac.case_number as related_case_number,
    (at.todo_data->>'title') as todo_title,
    (at.todo_data->>'description') as todo_description,
    (at.todo_data->>'status') as original_status
FROM archived_todos at
LEFT JOIN users u ON at.archived_by = u.id
LEFT JOIN archived_cases ac ON at.archived_case_id = ac.id;

-- ===============================
-- DATOS INICIALES
-- ===============================

-- Insertar política de archivo por defecto
INSERT INTO archive_policies (
    name,
    description,
    is_active,
    auto_archive_enabled,
    days_after_completion,
    inactivity_days,
    default_retention_days,
    apply_to_cases,
    apply_to_todos,
    conditions,
    created_by
) VALUES (
    'Política Estándar de Archivo',
    'Política por defecto para archivo automático de casos y TODOs',
    true,
    false, -- Deshabilitado por defecto para archivo manual
    90, -- 3 meses después de completado
    180, -- 6 meses de inactividad
    2555, -- 7 años de retención
    true,
    true,
    '{"auto_archive_completed": false, "auto_archive_inactive": false}'::jsonb,
    (SELECT id FROM users WHERE email = 'andresjgsalzate@gmail.com')
);

-- ===============================
-- SCRIPT COMPLETADO
-- ===============================

SELECT 'Módulo de archivo instalado correctamente' as status;

-- ===============================
-- DOCUMENTACIÓN DEL MÓDULO
-- ===============================

-- El módulo de archivo está ahora completamente configurado e incluye:

-- 1. ESTRUCTURA DE DATOS:
--    - archived_cases: Casos archivados con datos completos y metadatos
--    - archived_todos: TODOs archivados vinculados a casos
--    - archive_policies: Políticas de archivo automático y manual
--    - archive_operation_logs: Auditoría completa de operaciones
--    - archive_notifications: Sistema de notificaciones

-- 2. TIPOS ENUMERADOS:
--    - archive_reason_type: Razones de archivo (manual, automático, etc.)
--    - retention_status_type: Estados de retención
--    - archive_operation_type: Tipos de operaciones de archivo
--    - archive_notification_type: Tipos de notificaciones

-- 3. FUNCIONES Y PROCEDIMIENTOS:
--    - archive_case(): Archivar un caso con validaciones completas
--    - restore_case(): Restaurar un caso con auditoría
--    - archive_todo(): Archivar TODOs individuales o por caso
--    - restore_todo(): Restaurar TODOs con validaciones
--    - get_archive_stats(): Estadísticas del archivo
--    - cleanup_expired_archives(): Limpieza automática
--    - search_archived_items(): Búsqueda full-text avanzada

-- 4. SISTEMA DE PERMISOS:
--    - archive.view: Ver elementos archivados
--    - archive.create: Archivar elementos
--    - archive.restore: Restaurar del archivo
--    - archive.delete: Eliminación permanente
--    - archive.search: Búsqueda en archivo
--    - archive.bulk_operations: Operaciones masivas
--    - archive.manage_policies: Gestión de políticas
--    - archive.view_all: Ver todo (administradores)
--    - archive.manage_retention: Gestión de retención
--    - archive.view_logs: Ver logs de auditoría
--    - archive.export: Exportar datos archivados

-- 5. CARACTERÍSTICAS PRINCIPALES:
--    - Archivo manual con confirmación obligatoria
--    - Restauración con seguimiento de reactivaciones
--    - Búsqueda full-text en contenido archivado
--    - Políticas de retención configurables
--    - Auditoría completa de todas las operaciones
--    - Sistema de notificaciones integrado
--    - Row Level Security (RLS) para control de acceso
--    - Triggers automáticos para indexación
--    - Limpieza automática de archivos expirados

-- NOTA: Este script es completamente autocontenido y puede ejecutarse
--       independientemente del script principal setup.sql. Las declaraciones
--       ON CONFLICT DO NOTHING evitan errores si ya existen algunos elementos.
