# 📋 Sistema de Gestión de Casos

Un sistema completo de gestión de casos desarrollado con React, TypeScript y Supabase, diseñado para equipos de soporte técnico y administración de incidentes.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)
![Material-UI](https://img.shields.io/badge/Material--UI-5.x-007fff.svg)

## 🌟 Características Principales

### 🔐 **Autenticación y Autorización**
- Sistema completo de usuarios con roles y permisos
- Autenticación segura con Supabase
- Gestión de sesiones automática
- Aislamiento de datos por usuario

### 📊 **Gestión de Casos**
- Creación y clasificación automática de casos
- Sistema de complejidad basado en criterios múltiples
- Estados de casos: Pendiente, En Curso, Terminada, Escalada
- Asignación automática y manual de casos

### ✅ **Gestión de TODOs**
- TODOs vinculados a casos específicos
- Sistema de prioridades
- Seguimiento de estado y progreso
- Asignación a usuarios específicos

### ⏱️ **Seguimiento de Tiempo**
- Timer integrado para casos y TODOs
- Registro automático de tiempo trabajado
- Historial completo de entradas de tiempo
- Reportes de productividad

### 📈 **Dashboard Avanzado**
- Métricas en tiempo real
- Gráficos interactivos con Chart.js
- Vista de administrador con estadísticas globales
- Vista de usuario con datos personales

### 📊 **Reportes y Análisis**
- Reportes por fecha, usuario y aplicación
- Exportación a Excel
- Gráficos de tendencias y distribución
- Análisis de productividad por usuario (solo administradores)

### 🎨 **Interfaz de Usuario**
- Diseño responsive con Material-UI
- Modo oscuro/claro con toggle
- Navegación intuitiva por módulos
- Tooltips y ayudas contextuales

### 🔍 **Auditoría y Trazabilidad**
- **Sistema centralizado de auditoría** - Trazabilidad completa desde componentes React
- Registro automático de todas las operaciones CRUD (Crear, Actualizar, Eliminar)
- Dashboard de auditoría con filtros avanzados y paginación
- Exportación de logs a CSV con datos completos
- Seguimiento detallado: usuarios, IP, user agent, timestamps
- **Resolución de nombres** - IDs convertidos a nombres legibles automáticamente
- Modal de detalles con información completa y traducción de valores
- **Sin duplicidad** - Auditoría manejada únicamente en frontend (eliminada del backend)
- Soporte completo para operaciones de reportes y exportaciones
- Tema personalizable
- Componentes reutilizables

### 🔒 **Seguridad y Aislamiento**
- Aislamiento completo de datos por usuario
- Los usuarios solo ven sus propios casos y TODOs
- Los administradores tienen acceso completo
- Validación de permisos en cliente y servidor

## 🚀 Tecnologías Utilizadas

### Frontend
- **React 18.x** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático para JavaScript
- **Material-UI (MUI) 5.x** - Framework de componentes UI
- **React Router** - Navegación entre páginas
- **Chart.js** - Gráficos interactivos
- **React Toastify** - Notificaciones
- **XLSX** - Exportación de Excel
- **Day.js** - Manipulación de fechas
- **Zustand** - Estado global (AuthStore)
- **Material Icons** - Iconografía del sistema

### Backend
- **Supabase** - Backend como servicio
- **PostgreSQL** - Base de datos relacional
- **Row Level Security (RLS)** - Seguridad a nivel de fila

### Herramientas de Desarrollo
- **Create React App** - Configuración inicial
- **ESLint** - Linting de código
- **Prettier** - Formateo de código

## 📦 Instalación

### Prerrequisitos
- Node.js 16.x o superior
- npm o yarn
- Cuenta de Supabase

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/gestion-casos-react.git
cd gestion-casos-react
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales de Supabase:
```env
REACT_APP_SUPABASE_URL=tu_supabase_url
REACT_APP_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. **Configurar la base de datos**
- Ejecutar el script `database/setup.sql` en el editor SQL de Supabase
- Configurar las políticas RLS según sea necesario

5. **Iniciar el servidor de desarrollo**
```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 🗄️ Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── Admin/           # Componentes de administración
│   │   ├── AuditLogManagement.tsx    # Dashboard de auditoría
│   │   ├── UserManagement.tsx        # Gestión de usuarios
│   │   ├── RoleManagement.tsx        # Gestión de roles
│   │   └── ...                       # Otros módulos admin
│   ├── Auth/            # Componentes de autenticación
│   ├── Common/          # Componentes comunes
│   └── Layout/          # Layout principal
├── hooks/              # Hooks personalizados
│   └── usePermissions.ts             # Hook de permisos
├── lib/                # Configuraciones de librerías
│   └── supabase.ts                   # Cliente de Supabase
├── pages/              # Páginas principales
│   ├── Administration.tsx            # Panel de administración
│   ├── CaseManagement.tsx           # Gestión de casos
│   ├── TodoManagement.tsx           # Gestión de TODOs
│   ├── Reports.tsx                  # Reportes y analytics
│   └── Dashboard.tsx                # Dashboard principal
├── services/           # Servicios de API
│   ├── api.ts                       # Servicios principales
│   └── auditService.ts              # Sistema de auditoría
├── store/              # Store de estado global
│   └── authStore.ts                 # Estado de autenticación
├── types/              # Definiciones de TypeScript
│   └── index.ts                     # Interfaces principales
└── utils/              # Utilidades
    ├── logger.ts                    # Sistema de logging
    └── passwordUtils.ts             # Utilidades de contraseñas
```

## 🎯 Funcionalidades por Módulo

### 📊 Dashboard
- **Vista Usuario**: Casos y TODOs propios, métricas personales
- **Vista Administrador**: Métricas globales, gráficos por usuario, tiempo total por usuario
- Gráficos interactivos de actividad semanal
- Indicadores de rendimiento en tiempo real

### 🏷️ Clasificación de Casos
- Sistema de puntuación basado en 5 criterios:
  - Historial del caso
  - Conocimiento del módulo
  - Manipulación de datos
  - Claridad de la descripción
  - Causa del fallo
- Clasificación automática: Alta, Media, Baja complejidad
- Creación y edición de casos con clasificación

### 📋 Control de Casos
- Lista completa de casos (filtrada por usuario)
- Estados: Pendiente, En Curso, Terminada, Escalada
- Filtros por estado, aplicación, usuario
- Edición y eliminación con validación de permisos

### ✅ TODOs
- TODOs vinculados a casos específicos
- Estados: Pendiente, En Progreso, Completado, Cancelado
- Asignación a usuarios
- Fechas límite y seguimiento

### 📈 Reportes
- **Pestañas**: Casos, TODOs, Tiempo, Análisis
- **Solo Administradores**: Pestaña "Por Usuario"
- Filtros por fecha, usuario, aplicación
- Exportación a Excel
- Gráficos de distribución y tendencias

### ⚙️ Administración
- Gestión de usuarios y roles
- Configuración de aplicaciones
- Gestión de orígenes y prioridades
- Configuración de permisos
- **Dashboard de Auditoría** - Visualización completa de logs del sistema
- Filtros avanzados por tabla, operación, usuario y fecha
- Modal de detalles con resolución automática de nombres
- Exportación de logs con datos completos

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm start                 # Iniciar servidor de desarrollo
npm run build            # Construir para producción
npm test                 # Ejecutar tests
npm run eject            # Exponer configuración (no recomendado)

# Linting y formateo
npm run lint             # Ejecutar ESLint
npm run format           # Formatear código con Prettier
```

## 🌐 Configuración de Producción

### Build de Producción
```bash
npm run build
```

### Despliegue
El proyecto puede desplegarse en:
- **Vercel** (recomendado para React)
- **Netlify**
- **GitHub Pages**
- **Servidor propio** con nginx

### Variables de Entorno para Producción
```env
REACT_APP_SUPABASE_URL=tu_supabase_url_prod
REACT_APP_SUPABASE_ANON_KEY=tu_supabase_anon_key_prod
```

## 🔒 Seguridad

### Aislamiento de Datos
- **Row Level Security (RLS)** en Supabase
- Validación de permisos en el frontend
- Filtrado automático de datos por usuario
- Los administradores tienen acceso completo

### Autenticación
- Tokens JWT manejados por Supabase
- Sesiones persistentes
- Cierre automático por inactividad
- Validación de permisos por rol

## 🎨 Personalización

### Temas
El sistema soporta modo claro y oscuro:
- Toggle en la barra superior
- Persistencia de preferencias
- Colores personalizables en `src/App.tsx`

### Componentes
- Componentes reutilizables en `src/components/`
- Hooks personalizados para lógica compartida
- Tipos TypeScript para consistencia

## 📝 API y Servicios

### Servicios Principales
- `userService` - Gestión de usuarios
- `caseService` - Gestión de casos
- `todoService` - Gestión de TODOs
- `timeService` - Seguimiento de tiempo
- `reportService` - Generación de reportes
- `auditService` - **Sistema centralizado de auditoría**
  - `createAuditLog()` - Crear entradas de auditoría
  - `getAuditLogs()` - Obtener logs con filtros y paginación
  - `resolveNames()` - Convertir IDs a nombres legibles
  - `exportAuditLogs()` - Exportar logs a CSV
  - `useAuditLogger()` - Hook para usar en componentes

### Estructura de Datos
Ver `src/types/index.ts` para todas las interfaces y tipos.

## 🐛 Resolución de Problemas

### Errores Comunes
1. **Error de conexión a Supabase**: Verificar variables de entorno
2. **Permisos insuficientes**: Verificar configuración RLS
3. **Datos no visibles**: Verificar aislamiento por usuario

### ✅ Sistema de Auditoría - Estado Actual

**Estado**: ✅ **COMPLETAMENTE FUNCIONAL**

**Mejoras Implementadas**:

1. **Auditoría Centralizada**: 
   - Sistema unificado manejado desde componentes React
   - Eliminada duplicidad de logs (frontend + triggers)
   - Consistencia en todas las operaciones CRUD

2. **Resolución de Problemas RLS**:
   - Políticas Row Level Security configuradas correctamente
   - Acceso completo a tabla `audit_logs` desde la aplicación
   - Sin errores de autorización

3. **Información Completa**:
   - ✅ `user_id` - Auto-detección del usuario actual
   - ✅ `ip_address` - Captura con múltiples servicios de fallback
   - ✅ `user_agent` - Información completa del navegador
   - ✅ `description` - Descripciones detalladas de cada operación
   - ✅ `old_data/new_data` - Datos anteriores y nuevos para comparación

4. **Dashboard Avanzado**:
   - Filtros por tabla, operación, usuario y rango de fechas
   - Paginación eficiente para grandes volúmenes de datos
   - Modal de detalles con nombres legibles (usuarios, prioridades, etc.)
   - Exportación completa a CSV

5. **Cobertura Completa**:
   - ✅ Gestión de Usuarios
   - ✅ Gestión de Roles  
   - ✅ Gestión de Aplicaciones
   - ✅ Gestión de Orígenes
   - ✅ Gestión de Prioridades
   - ✅ Gestión de Casos
   - ✅ Gestión de TODOs
   - ✅ Reportes y Exportaciones
   - ✅ Operaciones de Tiempo (Timers)

**Arquitectura Final**:
```
Componentes React → useAuditLogger() → auditService → Supabase audit_logs
```

**Acceso al Dashboard**:
- Ir a **Administración → Auditoría**
- Filtrar por cualquier criterio
- Ver detalles completos en modal
- Exportar logs cuando sea necesario

## 🔍 Sistema de Auditoría - Guía de Uso

### 📋 Cómo Usar el Sistema de Auditoría

#### 1. **En Componentes React**
```typescript
import { useAuditLogger } from '../services/auditService';

const MiComponente = () => {
  const { logAction } = useAuditLogger();
  
  const handleUpdate = async (id: string, data: any) => {
    const oldData = await getExistingData(id);
    await updateData(id, data);
    
    // Registrar auditoría
    await logAction(
      'mi_tabla',           // tabla
      'UPDATE',             // operación  
      id,                   // ID del registro
      user?.id,             // ID del usuario (opcional)
      'Descripción del cambio', // descripción
      oldData,              // datos anteriores
      data                  // datos nuevos
    );
  };
};
```

#### 2. **Visualizar Logs**
- Navegar a **Administración → Auditoría**
- Usar filtros para buscar logs específicos
- Hacer clic en cualquier fila para ver detalles completos
- Exportar logs filtrados a CSV

#### 3. **Tipos de Operaciones Auditadas**
- `INSERT` - Creación de nuevos registros
- `UPDATE` - Modificación de registros existentes  
- `DELETE` - Eliminación de registros
- `SELECT` - Operaciones de lectura/exportación (reportes)

### 🛠️ Implementación Técnica

#### Arquitectura del Sistema
```
Frontend (React) → useAuditLogger → auditService → Supabase
     ↓
- Captura automática de user_id
- Obtención de IP del cliente  
- Registro de user_agent
- Timestamp automático
```

#### Datos Capturados Automáticamente
- **Usuario**: ID y nombre del usuario que realiza la acción
- **Timestamp**: Fecha y hora exacta de la operación
- **IP Address**: Dirección IP del cliente
- **User Agent**: Información del navegador
- **Descripción**: Descripción legible de la operación
- **Datos**: Estados anterior y nuevo del registro

### Debug
```bash
# Ver logs detallados
npm start -- --verbose

# Limpiar cache
npm start -- --reset-cache
```

## 📈 Changelog Reciente

### v2.1.0 - Sistema de Auditoría Centralizado (Diciembre 2024)

#### ✨ **Nuevas Características**
- **Sistema de auditoría completamente renovado** y centralizado
- Dashboard de auditoría con filtros avanzados y paginación
- Modal de detalles con resolución automática de nombres (usuarios, prioridades, etc.)
- Exportación completa de logs a CSV
- Auto-detección de usuario actual en todas las operaciones

#### 🔧 **Mejoras Técnicas**
- Eliminada duplicidad de logs de auditoría (frontend + backend)
- Implementado hook `useAuditLogger` para uso consistente
- Captura automática de IP con servicios de fallback
- Políticas RLS configuradas correctamente en Supabase
- Cobertura completa de auditoría en todos los módulos CRUD

#### 🐛 **Correcciones**
- Corregidos campos NULL en tabla audit_logs
- Eliminados errores de compilación TypeScript
- Limpieza de archivos temporales y scripts de desarrollo
- Corregidas signaturas de funciones de auditoría

#### 🗂️ **Auditoría Implementada en:**
- ✅ Gestión de Usuarios, Roles, Aplicaciones, Orígenes, Prioridades
- ✅ Gestión de Casos y TODOs  
- ✅ Reportes y exportaciones
- ✅ Operaciones de tiempo (timers)

---

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit changes (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push to branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Autores

- **Desarrollador Principal** - [Andres Jurgensen Alzate](https://github.com/andresjgsalzate)

## 🙏 Agradecimientos

- Material-UI por los componentes de interfaz
- Supabase por el backend como servicio
- Chart.js por las visualizaciones
- La comunidad de React por el ecosistema

## 📞 Soporte

Para soporte y preguntas:
- 📧 Email: andresjgsalzate@gmail.com
- 💬 GitHub Issues: [Reportar problema](https://github.com/andresjgsalzate/gestion-casos-react/issues)
- 📖 Documentación: [Wiki del proyecto](https://github.com/andresjgsalzate/gestion-casos-react/wiki)

---

⭐ **¡Dale una estrella al proyecto si te resulta útil!**
