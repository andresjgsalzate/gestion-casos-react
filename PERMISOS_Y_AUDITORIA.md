# 🔐 Sistema de Permisos y Auditoría

## **📊 Resumen Ejecutivo**

El sistema implementa un control de acceso granular basado en roles con auditoría completa de eliminaciones. Los **Supervisores** pueden hacer casi todo como los **Administradores**, excepto eliminar configuraciones del sistema.

---

## **👥 Roles y Permisos**

### **🎯 Administrador**
- **Acceso**: **COMPLETO** - Sin restricciones
- **Puede**: Crear, leer, actualizar y **eliminar TODO**
- **Módulos**: Usuarios, Roles, Permisos, Aplicaciones, Orígenes, Prioridades, Casos, TODOs, Tiempo, Reportes, Dashboard

### **👤 Supervisor**
- **Acceso**: **CASI COMPLETO** - Solo restricciones en eliminación de configuraciones
- **Puede hacer**:
  - ✅ **Gestión de usuarios**: Crear, ver, editar ❌ **NO eliminar**
  - ✅ **Configuraciones**: Ver roles, permisos, aplicaciones, orígenes, prioridades ❌ **NO eliminar**
  - ✅ **Datos operativos**: Crear, ver, editar y **SÍ eliminar** casos, TODOs y registros de tiempo
  - ✅ **Reportes y Dashboard**: Acceso completo

### **📝 Analista**
- **Acceso**: **LIMITADO** - Solo gestión de sus casos asignados
- **Puede**: Ver configuraciones, gestionar casos asignados, crear/gestionar TODOs, registrar tiempo

### **👤 Usuario**
- **Acceso**: **BÁSICO** - Solo lectura de sus datos
- **Puede**: Ver configuraciones, ver sus casos, ver sus TODOs, ver sus tiempos, dashboard básico

---

## **🎯 Diferencias Clave: Admin vs Supervisor**

| **Módulo** | **Admin** | **Supervisor** | **Diferencia** |
|------------|-----------|----------------|----------------|
| **Usuarios** | ✅ CRUD completo | ✅ CRU ❌ NO Delete | Supervisor NO puede eliminar usuarios |
| **Roles** | ✅ CRUD completo | ✅ R ❌ NO CUD | Supervisor solo ve roles |
| **Permisos** | ✅ CRUD completo | ✅ R ❌ NO CUD | Supervisor solo ve permisos |
| **Aplicaciones** | ✅ CRUD completo | ✅ CRU ❌ NO Delete | Supervisor NO puede eliminar apps |
| **Orígenes** | ✅ CRUD completo | ✅ CRU ❌ NO Delete | Supervisor NO puede eliminar orígenes |
| **Prioridades** | ✅ CRUD completo | ✅ CRU ❌ NO Delete | Supervisor NO puede eliminar prioridades |
| **Casos** | ✅ CRUD completo | ✅ **CRUD completo** | **Sin diferencia** |
| **TODOs** | ✅ CRUD completo | ✅ **CRUD completo** | **Sin diferencia** |
| **Tiempo** | ✅ CRUD completo | ✅ **CRUD completo** | **Sin diferencia** |
| **Reportes** | ✅ Acceso completo | ✅ **Acceso completo** | **Sin diferencia** |
| **Dashboard** | ✅ Acceso completo | ✅ **Acceso completo** | **Sin diferencia** |

### **🚫 Permisos que NO tiene el Supervisor**
```sql
'users.delete'         -- NO puede eliminar usuarios
'roles.delete'         -- NO puede eliminar roles  
'permissions.delete'   -- NO puede eliminar permisos
'applications.delete'  -- NO puede eliminar aplicaciones
'origins.delete'       -- NO puede eliminar orígenes
'priorities.delete'    -- NO puede eliminar prioridades
```

---

## **📋 Sistema de Auditoría**

### **✅ ¿Qué se está registrando?**

**TODAS las eliminaciones** del sistema se registran automáticamente en la tabla `audit_log`:

1. **✅ Usuarios** - Eliminación completa con datos del usuario
2. **✅ Roles** - Eliminación con nombre y descripción
3. **✅ Permisos** - Eliminación con módulo y acción
4. **✅ Aplicaciones** - Eliminación con nombre y descripción
5. **✅ Orígenes** - Eliminación con nombre y descripción
6. **✅ Prioridades** - Eliminación con nivel y descripción
7. **✅ Casos** - Eliminación con número de caso y descripción
8. **✅ TODOs** - Eliminación con título y descripción
9. **✅ Registros de tiempo** - Eliminación con datos del tiempo registrado

### **📊 Información registrada en cada log**
```typescript
{
  id: UUID,                    // ID único del log
  table_name: string,         // Tabla afectada (users, cases, etc.)
  record_id: string,          // ID del registro eliminado
  operation: 'DELETE',        // Tipo de operación
  old_data: object,          // TODOS los datos antes de eliminar
  user_id: string,           // Quién realizó la eliminación
  timestamp: datetime,       // Cuándo se eliminó
  description: string        // Descripción legible del evento
}
```

### **🔍 Ejemplo de log de auditoría**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "table_name": "cases",
  "record_id": "456e7890-e89b-12d3-a456-426614174001", 
  "operation": "DELETE",
  "old_data": {
    "case_number": "CASO-2024-001",
    "description": "Problema con el sistema de facturación",
    "status": "EN_PROGRESO",
    "user_id": "789e0123-e89b-12d3-a456-426614174002"
  },
  "user_id": "admin-user-id",
  "timestamp": "2024-12-29T10:30:00Z",
  "description": "Caso eliminado: CASO-2024-001 - Problema con el sistema de facturación..."
}
```

### **🎯 Consulta de logs**
Los administradores pueden consultar los logs a través de:

1. **Componente AuditLog.tsx** - Interfaz visual en frontend
2. **Vista SQL**: `SELECT * FROM audit_deletions ORDER BY timestamp DESC`
3. **API**: `auditService.getAuditLogs()`

---

## **🛡️ Seguridad Implementada**

### **1. Filtrado por Usuario**
- **Usuarios normales**: Solo ven sus propios datos
- **Supervisores**: Ven todos los datos pero no pueden eliminar configuraciones
- **Admins**: Ven y controlan todo

### **2. Validación de Permisos**
- Verificación a nivel de base de datos (RLS)
- Verificación a nivel de API (servicios)
- Verificación a nivel de UI (componentes)

### **3. Auditoría Completa**
- **Automática**: Todos los deletes se registran automáticamente
- **Inmutable**: Los logs no se pueden modificar
- **Detallada**: Se guardan todos los datos eliminados

### **4. Trazabilidad**
- **Quién**: Usuario que realizó la acción
- **Qué**: Datos exactos que se eliminaron
- **Cuándo**: Timestamp preciso
- **Dónde**: Tabla y registro afectado

---

## **🚀 Scripts de Configuración**

### **Aplicar permisos del Supervisor**
```sql
-- Ejecutar en Supabase
\i database/update_supervisor_permissions.sql
```

### **Configurar sistema de auditoría**
```sql
-- Ejecutar en Supabase  
\i database/audit_system.sql
```

### **Verificar permisos**
```sql
-- Ver permisos del Supervisor
SELECT r.name as rol, p.name as permiso, p.module, p.action
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id  
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'Supervisor'
ORDER BY p.module, p.action;
```

---

## **📈 Próximos Pasos**

1. **✅ Completado**: Integración de auditoría en todos los servicios
2. **🔄 Pendiente**: Probar componente AuditLog en frontend
3. **🔄 Pendiente**: Deploy y validación en producción
4. **🔄 Pendiente**: Documentación para consulta de logs

---

**✨ Resultado**: El sistema ahora tiene control de permisos granular y auditoría completa de todas las eliminaciones, proporcionando seguridad y trazabilidad total.
