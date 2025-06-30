# Módulo de Archivo - Sistema de Gestión de Casos

## Descripción General

El módulo de archivo proporciona un sistema completo para archivar, restaurar y gestionar casos y TODOs que ya no están activos, pero que deben conservarse por razones de auditoría, cumplimiento o historial.

## Características Principales

### 1. Archivo Manual con Confirmación
- Los elementos solo se archivan por acción explícita del usuario
- Requiere confirmación y razón obligatoria
- Soporte para archivo individual y masivo

### 2. Sistema de Restauración
- Restauración completa de casos y TODOs
- Seguimiento de reactivaciones con auditoría
- Estado "REACTIVATED" al restaurar

### 3. Búsqueda Avanzada
- Búsqueda full-text en contenido archivado
- Filtros por fecha, tipo, usuario, razón
- Indexación automática para rendimiento

### 4. Gestión de Retención
- Políticas de retención configurables
- Estados de retención con warnings
- Limpieza automática de archivos expirados

### 5. Auditoría Completa
- Log de todas las operaciones
- Seguimiento de usuarios y razones
- Historial de reactivaciones

## Estructura de Base de Datos

### Tablas Principales

#### `archived_cases`
- **Propósito**: Almacena casos archivados con datos completos
- **Campos principales**:
  - `original_case_id`: ID del caso original
  - `case_data`: Datos completos en JSON
  - `archived_by`: Usuario que archivó
  - `archive_reason`: Razón del archivo
  - `retention_until`: Fecha límite de retención
  - `search_vector`: Vector para búsqueda full-text

#### `archived_todos`
- **Propósito**: Almacena TODOs archivados
- **Relación**: Puede vincularse a casos archivados
- **Campos**: Similares a archived_cases

#### `archive_policies`
- **Propósito**: Define políticas de archivo automático
- **Configuración**: Reglas, periodicidad, retención

#### `archive_operation_logs`
- **Propósito**: Auditoría de todas las operaciones
- **Registro**: Usuario, fecha, tipo, detalles

#### `archive_notifications`
- **Propósito**: Sistema de notificaciones
- **Tipos**: Pre-archivo, post-archivo, warnings

### Tipos Enumerados

```sql
-- Razones de archivo
archive_reason_type: MANUAL, AUTO_TIME_BASED, AUTO_INACTIVITY, etc.

-- Estados de retención  
retention_status_type: ACTIVE, WARNING, EXPIRED, LEGAL_HOLD

-- Tipos de operación
archive_operation_type: ARCHIVE, RESTORE, DELETE, BULK_ARCHIVE

-- Tipos de notificación
archive_notification_type: BEFORE_ARCHIVE, AFTER_ARCHIVE, etc.
```

## Funciones Principales

### Archivo de Casos
```sql
-- Archivar un caso individual
SELECT archive_case(
    case_id := 'uuid-del-caso',
    user_id := 'uuid-del-usuario', 
    reason := 'Caso completado y cerrado',
    reason_type := 'MANUAL'
);
```

### Restauración de Casos
```sql
-- Restaurar un caso archivado
SELECT restore_case(
    archived_case_id := 'uuid-caso-archivado',
    user_id := 'uuid-del-usuario',
    reason := 'Requiere reactivación por nueva información'
);
```

### Estadísticas
```sql
-- Obtener estadísticas del archivo
SELECT * FROM get_archive_stats();
```

### Búsqueda
```sql
-- Buscar en elementos archivados
SELECT * FROM search_archived_items(
    search_term := 'término de búsqueda',
    item_type := 'case', -- o 'todo' o 'all'
    limit_count := 50,
    offset_count := 0
);
```

## Sistema de Permisos

### Permisos del Módulo

| Permiso | Descripción | Roles Asignados |
|---------|-------------|-----------------|
| `archive.view` | Ver elementos archivados | Todos los roles |
| `archive.create` | Archivar elementos | Analista, Supervisor, Admin |
| `archive.restore` | Restaurar del archivo | Supervisor, Admin |
| `archive.delete` | Eliminación permanente | Solo Admin |
| `archive.search` | Búsqueda en archivo | Todos los roles |
| `archive.bulk_operations` | Operaciones masivas | Solo Admin |
| `archive.manage_policies` | Gestionar políticas | Solo Admin |
| `archive.view_all` | Ver todo (admin) | Solo Admin |
| `archive.manage_retention` | Gestión de retención | Solo Admin |
| `archive.view_logs` | Ver logs de auditoría | Admin y Supervisor |
| `archive.export` | Exportar datos | Supervisor, Admin |

### Row Level Security (RLS)

- **Usuarios normales**: Solo ven sus propios archivos
- **Supervisores**: Ven archivos de su equipo
- **Administradores**: Acceso completo

## API y Servicios

### ArchiveService (TypeScript)

```typescript
// Archivar un caso
await ArchiveService.archiveCase(caseId, reason, reasonType);

// Restaurar un caso
await ArchiveService.restoreCase(archivedCaseId, reason);

// Buscar en archivo
const results = await ArchiveService.searchArchive(searchTerm, filters);

// Obtener estadísticas
const stats = await ArchiveService.getArchiveStats();
```

## Interfaz de Usuario

### Página Principal (`/archive`)
- **Estadísticas**: Resumen visual de elementos archivados
- **Lista**: DataGrid con casos y TODOs archivados
- **Filtros**: Búsqueda avanzada con múltiples criterios
- **Acciones**: Restaurar, ver detalles, eliminar permanente

### Componentes Principales

#### `ArchivedItemViewer`
- Visualización detallada de elementos archivados
- Historial de reactivaciones
- Información de retención

#### `ArchiveSettings`
- Configuración de políticas de archivo
- Gestión de retención
- Configuración de notificaciones

#### `ArchiveSearch`
- Búsqueda avanzada con filtros
- Exportación de resultados
- Guardado de búsquedas frecuentes

## Instalación y Configuración

### 1. Ejecutar Script de Base de Datos

```sql
-- Ejecutar el módulo completo
\i database/archive_module.sql
```

### 2. Verificar Instalación

```sql
-- Verificar que todo está correcto
\i database/verify_archive_module.sql
```

### 3. Configurar Políticas (Opcional)

```sql
-- Crear política de archivo automático
INSERT INTO archive_policies (name, description, retention_days) 
VALUES ('30DaysAfterClosed', 'Archivar casos cerrados después de 30 días', 30);
```

## Flujo de Trabajo Típico

### Archivo Manual
1. Usuario selecciona caso/TODO a archivar
2. Sistema muestra diálogo de confirmación
3. Usuario ingresa razón obligatoria
4. Sistema valida permisos y ejecuta archivo
5. Se crea log de auditoría y notificación

### Restauración
1. Usuario busca en archivo
2. Selecciona elemento a restaurar
3. Ingresa razón de reactivación
4. Sistema valida y restaura con estado "REACTIVATED"
5. Se actualiza contador de reactivaciones

### Búsqueda
1. Usuario accede a la página de archivo
2. Utiliza filtros de búsqueda avanzada
3. Sistema ejecuta búsqueda full-text
4. Resultados paginados con opciones de acción

## Mantenimiento

### Limpieza Automática
```sql
-- Ejecutar periódicamente para limpiar archivos expirados
SELECT cleanup_expired_archives();
```

### Monitoreo
- Revisar logs de `archive_operation_logs`
- Monitorear estadísticas de archivo
- Verificar políticas de retención

## Consideraciones de Seguridad

1. **Validación de Permisos**: Todas las operaciones validan permisos RLS
2. **Auditoría Completa**: Todas las acciones quedan registradas
3. **Razones Obligatorias**: No se permite archivo sin razón
4. **Confirmación Doble**: UI requiere confirmación explícita
5. **Acceso Controlado**: Solo usuarios autorizados pueden ver archivos

## Troubleshooting

### Problemas Comunes

**Error: "Permission denied"**
- Verificar que el usuario tiene los permisos necesarios
- Comprobar políticas RLS

**Error: "Case not found"**
- Verificar que el caso existe y no está ya archivado
- Comprobar estado del caso

**Búsqueda lenta**
- Verificar que los triggers de indexación están activos
- Considerar VACUUM ANALYZE en tablas de archivo

### Logs y Debugging

```sql
-- Ver logs recientes
SELECT * FROM archive_operation_logs 
ORDER BY created_at DESC LIMIT 50;

-- Verificar índices
SELECT * FROM pg_indexes 
WHERE tablename LIKE 'archived_%';
```
