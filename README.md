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
- Registro automático de todas las operaciones
- Logs detallados de CRUD (Crear, Leer, Actualizar, Eliminar)
- Dashboard de auditoría con filtros avanzados
- Exportación de logs a CSV
- Seguimiento de usuarios y actividades del sistema
- **Nota**: Requiere configuración de políticas RLS en Supabase
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
│   ├── Auth/            # Componentes de autenticación
│   ├── Common/          # Componentes comunes
│   └── Layout/          # Layout principal
├── contexts/            # Contextos de React
├── hooks/              # Hooks personalizados
├── lib/                # Configuraciones de librerías
├── pages/              # Páginas principales
├── services/           # Servicios de API
├── store/              # Store de estado global
├── styles/             # Archivos CSS
├── types/              # Definiciones de TypeScript
└── utils/              # Utilidades
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

### Estructura de Datos
Ver `src/types/index.ts` para todas las interfaces y tipos.

## 🐛 Resolución de Problemas

### Errores Comunes
1. **Error de conexión a Supabase**: Verificar variables de entorno
2. **Permisos insuficientes**: Verificar configuración RLS
3. **Datos no visibles**: Verificar aislamiento por usuario

### ⚠️ Problema Conocido: Módulo de Auditoría

**Síntoma**: El módulo de auditoría en Administración muestra datos de ejemplo en lugar de los registros reales de la base de datos.

**Causa**: Row Level Security (RLS) en Supabase está bloqueando el acceso a la tabla `audit_logs`.

**Diagnóstico**:
- Los datos existen en la tabla (50+ registros verificados)
- La aplicación recibe error 401 Unauthorized
- No se pueden insertar ni leer registros desde la aplicación

**Solución**:
1. Acceder al editor SQL de Supabase
2. Ejecutar el script `database/fix_rls_audit_logs.sql`
3. O ejecutar manualmente estas políticas RLS:

```sql
-- Permitir lectura de logs de auditoría
CREATE POLICY "audit_logs_select_policy" ON audit_logs
    FOR SELECT 
    USING (true);

-- Permitir escritura de logs de auditoría  
CREATE POLICY "audit_logs_insert_policy" ON audit_logs
    FOR INSERT 
    WITH CHECK (true);
```

**Estado Actual**: 
- ✅ Módulo funcional con datos reales de Supabase
- ✅ Políticas RLS configuradas correctamente
- ✅ Todos los campos se guardan apropiadamente
- ✅ Modal de detalles con nombres legibles

## 🔧 Logs de Auditoría - Mejoras Implementadas

### ✅ Problema Resuelto: Campos NULL en audit_logs

**Problemas identificados y resueltos:**

1. **user_id NULL:** No se obtenía el usuario actual cuando no se proporcionaba explícitamente
2. **ip_address NULL:** Servicio de IP pública fallaba sin fallback
3. **user_agent NULL:** No se manejaba correctamente cuando no estaba disponible
4. **Nombres de IDs:** Solo se mostraban IDs en lugar de nombres legibles

### 🛠️ Soluciones Implementadas

#### 1. Auto-detección de Usuario
```typescript
// Obtiene automáticamente el usuario de la sesión
const { data: { user } } = await supabase.auth.getUser();
userId = user?.id || null;
```

#### 2. Captura de IP con Fallback
```typescript
// Múltiples servicios para obtener IP
try {
  return await fetch('https://api.ipify.org?format=json');
} catch {
  return await fetch('https://httpbin.org/ip'); // Fallback
}
```

#### 3. Modal con Nombres Legibles
- **Creado por:** Muestra nombre + email del usuario
- **Asignado a:** Información completa del usuario asignado  
- **Prioridad:** Nombre y nivel de prioridad
- **Aplicación/Origen:** Nombres descriptivos

#### 4. Logging Detallado
Se agregó logging completo para debugging y monitoreo de la creación de logs.

### 📋 Testing y Verificación

```typescript
// Método de testing incluido
await auditService.testAuditLog();

// Verificar en Supabase o ejecutar:
// database/verify_audit_logs_setup.sql
```

### Debug
```bash
# Ver logs detallados
npm start -- --verbose

# Limpiar cache
npm start -- --reset-cache
```

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
- 💬 GitHub Issues: [Reportar problema](https://github.com/tu-usuario/gestion-casos-react/issues)
- 📖 Documentación: [Wiki del proyecto](https://github.com/tu-usuario/gestion-casos-react/wiki)

---

⭐ **¡Dale una estrella al proyecto si te resulta útil!**
