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

### 📋 **Sistema de Versiones**
- **Control de versiones visible** - Información de versión accesible desde la interfaz
- Chip de versión en el sidebar con modal de información detallada
- Historial de cambios (changelog) integrado en la aplicación
- Categorización de releases: major, feature, improvement, bugfix
- Scripts automáticos para actualización de versiones
- Sincronización entre `package.json` y código fuente
- Información técnica: fecha de build, entorno, commit hash
- Footer con detalles de versión en el dashboard

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

## 🔄 Sistema de Versiones

### Control de Versiones Automático
El sistema incluye control de versiones integrado y visible:

#### Comandos Disponibles
```bash
# Actualizar información de versión
npm run version:update

# Incrementar versión patch (1.2.0 → 1.2.1)
npm run version:patch

# Incrementar versión minor (1.2.0 → 1.3.0)
npm run version:minor

# Incrementar versión major (1.2.0 → 2.0.0)
npm run version:major

# Build con actualización automática
npm run build
```

#### Visualización en la Interfaz
- **Sidebar**: Chip clickeable con número de versión
- **Dashboard**: Footer con información técnica
- **Modal**: Historial completo de cambios

#### Información Mostrada
- Versión actual y nombre código
- Fecha de release y build
- Entorno (production/development)
- Changelog categorizado por tipo de cambio
- Información técnica para debugging

### Documentación Adicional
- Ver `docs/VERSION_SYSTEM.md` para detalles técnicos
- Sistema preparado para CI/CD
- Sincronización automática entre `package.json` y código

---

## 📝 Changelog

### v1.2.0 - Dashboard Optimization (2024-12-29)
- ✅ **Corregido el gráfico de actividad semanal** para mostrar datos reales
- ✅ **Incluidos TODOs** en el cálculo de actividad semanal
- ✅ **Eliminados datos de prueba** confusos del dashboard
- ✅ **Sistema de versiones implementado** con visualización en interfaz
- ✅ **Mejorado el sistema de auditoría** centralizado
- ✅ **Limpieza de archivos** SQL y documentación temporal
- ✅ **Actualizado README** con documentación completa
- 🚀 **Desplegado en Netlify**: https://gestiondecasos.netlify.app

### v1.1.0 - Audit System Centralization (2024-12-28)
- ✅ **Centralizado el sistema de auditoría**
- ✅ **Eliminada duplicidad de logs**
- ✅ **Corregidos errores de compilación** en componentes
- ✅ **Desplegado en Netlify** con éxito
- ✅ **Mejorada la trazabilidad** del sistema

### v1.0.0 - Initial Release (2024-12-15)
- 🎉 **Sistema completo de gestión de casos**
- ✅ **Módulo de TODOs integrado**
- 📊 **Dashboard con métricas y gráficos**
- 🔐 **Sistema de autenticación con Supabase**
- 👥 **Gestión de usuarios y permisos**
- ⏱️ **Seguimiento de tiempo por casos y TODOs**
- 📈 **Reportes y exportación de datos**

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 📞 Contacto

**Andrés Salzate**
- 📧 Email: andresjgsalzate@gmail.com
- 💬 GitHub Issues: [Reportar problema](https://github.com/andresjgsalzate/gestion-casos-react/issues)
- 📖 Documentación: [Wiki del proyecto](https://github.com/andresjgsalzate/gestion-casos-react/wiki)

---

⭐ **¡Dale una estrella al proyecto si te resulta útil!**
