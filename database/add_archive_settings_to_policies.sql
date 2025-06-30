-- Agregar campos de configuración general a archive_policies
-- Esto permite que toda la configuración del módulo se maneje desde las políticas

-- Agregar columnas una por una para compatibilidad
ALTER TABLE archive_policies ADD COLUMN IF NOT EXISTS warning_days_before_expiry INTEGER DEFAULT 30;
ALTER TABLE archive_policies ADD COLUMN IF NOT EXISTS allow_user_archive BOOLEAN DEFAULT true;
ALTER TABLE archive_policies ADD COLUMN IF NOT EXISTS allow_user_restore BOOLEAN DEFAULT true;
ALTER TABLE archive_policies ADD COLUMN IF NOT EXISTS require_reason_for_archive BOOLEAN DEFAULT false;
ALTER TABLE archive_policies ADD COLUMN IF NOT EXISTS require_reason_for_restore BOOLEAN DEFAULT false;
ALTER TABLE archive_policies ADD COLUMN IF NOT EXISTS enable_notifications BOOLEAN DEFAULT true;
ALTER TABLE archive_policies ADD COLUMN IF NOT EXISTS enable_legal_hold BOOLEAN DEFAULT false;
ALTER TABLE archive_policies ADD COLUMN IF NOT EXISTS max_retention_days INTEGER DEFAULT 7300;
ALTER TABLE archive_policies ADD COLUMN IF NOT EXISTS bulk_operation_limit INTEGER DEFAULT 1000;

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN archive_policies.warning_days_before_expiry IS 'Días de advertencia antes del vencimiento';
COMMENT ON COLUMN archive_policies.allow_user_archive IS 'Permitir a usuarios archivar elementos';
COMMENT ON COLUMN archive_policies.allow_user_restore IS 'Permitir a usuarios restaurar elementos';
COMMENT ON COLUMN archive_policies.require_reason_for_archive IS 'Requerir razón para archivar';
COMMENT ON COLUMN archive_policies.require_reason_for_restore IS 'Requerir razón para restaurar';
COMMENT ON COLUMN archive_policies.enable_notifications IS 'Habilitar notificaciones del módulo';
COMMENT ON COLUMN archive_policies.enable_legal_hold IS 'Habilitar retención legal';
COMMENT ON COLUMN archive_policies.max_retention_days IS 'Máximo de días de retención permitidos';
COMMENT ON COLUMN archive_policies.bulk_operation_limit IS 'Límite de elementos en operaciones masivas';
