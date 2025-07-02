# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-07-02

### 🎨 Mejoras del Menú Lateral

#### ✨ Nuevo
- **Menú colapsable mejorado**: Implementación completa de menú lateral colapsable con estado persistente
- **Icono interactivo**: El icono de la aplicación funciona como botón para expandir el menú cuando está colapsado
- **Interfaz optimizada**: Reducción significativa del espacio ocupado por los controles del menú
- **Título actualizado**: Cambio global de "Sistema de Gestión de Casos" a "Gestión de Casos"

#### 🔧 Mejorado
- **Controles de navegación**: Flecha de colapso más pequeña y discreta sin borde circular
- **Espaciado optimizado**: Reducción del padding para un diseño más compacto
- **Tooltips inteligentes**: Aparecen solo cuando el menú está colapsado
- **Transiciones suaves**: Animaciones fluidas entre estados expandido/colapsado

#### 🧹 Limpieza
- **Archivos eliminados**: Removed archivos markdown de documentación temporal
- **Carpetas vacías**: Eliminadas carpetas `migration` y `container` no utilizadas
- **Importaciones optimizadas**: Removidas importaciones innecesarias de iconos

## [1.3.1] - 2025-06-30

### 🔧 Refactorización del Módulo de Archivo

#### ⚠️ CAMBIO IMPORTANTE (BREAKING CHANGE)
- **Configuración unificada**: Eliminada la configuración separada `ArchiveSettings`
- **Gestión centralizada**: Toda la configuración del módulo ahora se maneja a través de las políticas de archivo
- **Nuevos campos en políticas**: Las políticas incluyen ahora configuración general, permisos y notificaciones

#### ✅ Corregido
- **Duplicación de configuraciones**: Eliminada la separación confusa entre configuraciones generales y políticas
- **Interfaz simplificada**: Un solo formulario para toda la configuración del módulo de archivo

#### ⚡ Mejorado
- **Formulario expandido**: Las políticas de archivo incluyen ahora todos los campos de configuración:
  - Días de advertencia antes del vencimiento
  - Permisos de usuario (archivo/restauración)
  - Requerimientos de razones para operaciones
  - Configuración de notificaciones
  - Retención legal
  - Límites de operaciones masivas
- **Base de datos**: Agregados 9 nuevos campos a la tabla `archive_policies`
- **Experiencia de usuario**: Interfaz más intuitiva y consolidada

#### �️ Eliminado
- **Tipo `ArchiveSettings`**: Removido completamente de la aplicación
- **Funciones obsoletas**: `getArchiveSettings` y `updateArchiveSettings`
- **Componente deprecado**: `ArchiveSettings` reemplazado por mensaje informativo

#### 🛠️ Técnico
- **Nuevos campos en `archive_policies`**:
  - `warning_days_before_expiry` (INTEGER)
  - `allow_user_archive` (BOOLEAN)
  - `allow_user_restore` (BOOLEAN)
  - `require_reason_for_archive` (BOOLEAN)
  - `require_reason_for_restore` (BOOLEAN)
  - `enable_notifications` (BOOLEAN)
  - `enable_legal_hold` (BOOLEAN)
  - `max_retention_days` (INTEGER)
  - `bulk_operation_limit` (INTEGER)

#### 💾 Base de Datos
- **Script requerido**: Ejecutar `database/add_archive_settings_to_policies.sql` para agregar los nuevos campos

---

## [1.3.0] - 2025-06-30 (Anterior)

---

## [1.0.0] - 2025-06-28

### 🎉 Lanzamiento Inicial

#### ✨ Agregado
- **Sistema completo de autenticación** con Supabase
- **Gestión de usuarios y roles** con permisos granulares
- **Aislamiento de datos por usuario** - cada usuario solo ve sus propios casos y TODOs
- **Dashboard avanzado** con métricas en tiempo real y gráficos interactivos
- **Sistema de clasificación de casos** con algoritmo de complejidad automática
- **Gestión completa de casos** con estados y asignaciones
- **Sistema de TODOs** vinculados a casos específicos
- **Seguimiento de tiempo** con timer integrado para casos y TODOs
- **Reportes y análisis** con exportación a Excel
- **Modo oscuro/claro** con toggle en la interfaz
- **Interfaz responsive** con Material-UI

#### 🏗️ Características Técnicas
- **React 18.x** con TypeScript
- **Material-UI 5.x** para componentes UI
- **Chart.js** para visualizaciones de datos
- **Supabase** como backend y base de datos
- **Row Level Security (RLS)** para seguridad de datos
- **React Router** para navegación
- **Context API** para gestión de estado

#### 📊 Módulos Implementados
1. **Dashboard**
   - Vista personal para usuarios regulares
   - Vista administrativa con estadísticas globales
   - Gráficos de casos por usuario (solo admin)
   - Gráficos de tiempo total por usuario (solo admin)
   - Métricas de eficiencia y productividad

2. **Clasificación de Casos**
   - Sistema de puntuación basado en 5 criterios
   - Clasificación automática: Alta, Media, Baja complejidad
   - Creación y edición de casos con validación

3. **Control de Casos**
   - Lista filtrada por usuario (aislamiento de datos)
   - Estados: Pendiente, En Curso, Terminada, Escalada
   - Edición y eliminación con validación de permisos

4. **Gestión de TODOs**
   - TODOs vinculados a casos específicos
   - Asignación a usuarios
   - Estados y fechas límite

5. **Reportes**
   - Pestañas para diferentes tipos de reportes
   - Pestaña especial "Por Usuario" solo para administradores
   - Exportación a Excel
   - Filtros por fecha, usuario y aplicación

6. **Administración**
   - Gestión de usuarios y roles
   - Configuración de aplicaciones y orígenes
   - Gestión de prioridades

#### 🔒 Seguridad Implementada
- **Aislamiento completo de datos** por usuario
- **Validación de permisos** en frontend y backend
- **Row Level Security** en base de datos
- **Autenticación JWT** con Supabase
- **Gestión de sesiones** automática

#### 🎨 Interfaz de Usuario
- **Tema personalizable** con modo claro/oscuro
- **Componentes reutilizables** y consistentes
- **Diseño responsive** para desktop y móvil
- **Notificaciones toast** para feedback del usuario
- **Loading states** y manejo de errores

#### ⚡ Funcionalidades Avanzadas
- **Timer integrado** para seguimiento de tiempo
- **Gráficos interactivos** con Chart.js
- **Exportación de datos** a Excel
- **Persistencia de preferencias** (tema, filtros)
- **Componente de información de visibilidad** de datos

### 🔧 Configuración y Desarrollo
- Configuración completa con Create React App
- Variables de entorno para Supabase
- Scripts de base de datos incluidos
- Documentación completa en README

### 📦 Dependencias Principales
```json
{
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "@mui/material": "^5.14.0",
  "@supabase/supabase-js": "^2.38.0",
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0",
  "react-router-dom": "^6.15.0",
  "react-toastify": "^9.1.0",
  "xlsx": "^0.18.0"
}
```

---

## [Próximas Versiones - Roadmap]

### 🚀 v1.1.0 - Planificado
- [ ] Notificaciones en tiempo real
- [ ] Comentarios en casos
- [ ] Adjuntos de archivos
- [ ] API REST documentada

### 🚀 v1.2.0 - Planificado
- [ ] Aplicación móvil
- [ ] Integración con Slack/Teams
- [ ] Workflow automático
- [ ] Dashboard personalizable

### 🚀 v2.0.0 - Futuro
- [ ] Machine Learning para clasificación automática
- [ ] Integración con herramientas externas
- [ ] Multi-tenancy
- [ ] API GraphQL
