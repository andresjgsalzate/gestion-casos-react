-- Sistema de Auditoría para Eliminaciones
-- Este script crea las tablas y triggers necesarios para registrar todas las eliminaciones

-- Tabla principal de auditoría
CREATE TABLE audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    operation_type VARCHAR(20) NOT NULL, -- 'DELETE', 'UPDATE', 'INSERT'
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_operation_type ON audit_log(operation_type);

-- Función genérica para auditoría
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_email VARCHAR(255);
BEGIN
    -- Obtener información del usuario actual (esto se puede mejorar con variables de sesión)
    SELECT id, email INTO current_user_id, current_user_email 
    FROM users 
    WHERE id = (SELECT user_id FROM current_user_session LIMIT 1);

    -- Registrar la operación
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            table_name, 
            record_id, 
            operation_type, 
            old_data, 
            user_id, 
            user_email
        ) VALUES (
            TG_TABLE_NAME,
            OLD.id::TEXT,
            'DELETE',
            row_to_json(OLD),
            current_user_id,
            current_user_email
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Solo registrar si hay cambios significativos
        IF row_to_json(OLD) IS DISTINCT FROM row_to_json(NEW) THEN
            INSERT INTO audit_log (
                table_name, 
                record_id, 
                operation_type, 
                old_data, 
                new_data,
                user_id, 
                user_email
            ) VALUES (
                TG_TABLE_NAME,
                NEW.id::TEXT,
                'UPDATE',
                row_to_json(OLD),
                row_to_json(NEW),
                current_user_id,
                current_user_email
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            table_name, 
            record_id, 
            operation_type, 
            new_data,
            user_id, 
            user_email
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id::TEXT,
            'INSERT',
            row_to_json(NEW),
            current_user_id,
            current_user_email
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Tabla temporal para mantener el usuario actual en la sesión
CREATE TABLE IF NOT EXISTS current_user_session (
    user_id UUID,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers para cada tabla importante
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_roles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON roles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_permissions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON permissions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_applications_trigger
    AFTER INSERT OR UPDATE OR DELETE ON applications
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_origins_trigger
    AFTER INSERT OR UPDATE OR DELETE ON origins
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_priorities_trigger
    AFTER INSERT OR UPDATE OR DELETE ON priorities
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_cases_trigger
    AFTER INSERT OR UPDATE OR DELETE ON cases
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_todos_trigger
    AFTER INSERT OR UPDATE OR DELETE ON todos
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_time_entries_trigger
    AFTER INSERT OR UPDATE OR DELETE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_time_tracking_trigger
    AFTER INSERT OR UPDATE OR DELETE ON time_tracking
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Vista para consultas de auditoría más fáciles
CREATE VIEW audit_deletions AS
SELECT 
    a.id,
    a.table_name,
    a.record_id,
    a.old_data,
    a.user_email,
    a.timestamp,
    u.name as user_name
FROM audit_log a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.operation_type = 'DELETE'
ORDER BY a.timestamp DESC;

-- Función para limpiar logs antiguos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_log 
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentarios en las tablas
COMMENT ON TABLE audit_log IS 'Registro de auditoría para todas las operaciones CRUD importantes';
COMMENT ON COLUMN audit_log.table_name IS 'Nombre de la tabla afectada';
COMMENT ON COLUMN audit_log.record_id IS 'ID del registro afectado';
COMMENT ON COLUMN audit_log.operation_type IS 'Tipo de operación: INSERT, UPDATE, DELETE';
COMMENT ON COLUMN audit_log.old_data IS 'Datos antes del cambio (para UPDATE y DELETE)';
COMMENT ON COLUMN audit_log.new_data IS 'Datos después del cambio (para INSERT y UPDATE)';
