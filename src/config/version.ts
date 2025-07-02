export const VERSION_INFO = {
  version: '1.4.1',
  buildDate: '2025-07-02T18:55:00.000Z',
  releaseDate: '2025-07-02',
  codename: 'Distintivos de Timer Activo',
  environment: process.env.NODE_ENV || 'development',
  commit: process.env.REACT_APP_GIT_SHA || 'local',
  branch: process.env.REACT_APP_GIT_BRANCH || 'main'
};

export const CHANGELOG = [
  {
    version: '1.4.1',
    date: '2025-07-02',
    title: 'Distintivos de Timer Activo',
    changes: [
      '🎯 Distintivo "ACTIVO" en Control de Casos para identificar casos con timer corriendo',
      '🔄 Animaciones visuales: icono pulsante y resplandor verde en badges activos',
      '👁️ Identificación instantánea del elemento con timer en ejecución',
      '🚫 Prevención de confusión al trabajar con múltiples casos o TODOs',
      '📏 Diseño compacto que no interfiere con la interfaz existente',
      '🎨 Integración perfecta con el sistema de timer actual',
      '✨ Badges responsivos compatibles con tema claro y oscuro'
    ],
    type: 'feature'
  },
  {
    version: '1.4.0',
    date: '2025-07-02',
    title: 'Menú Lateral Mejorado',
    changes: [
      '🎨 Implementación completa de menú lateral colapsable con estado persistente',
      '🔄 Icono de la aplicación funciona como botón para expandir cuando está colapsado',
      '📐 Reducción significativa del espacio ocupado por los controles del menú',
      '🎯 Flecha de colapso más pequeña y discreta sin borde circular',
      '📏 Espaciado optimizado con padding reducido para diseño más compacto',
      '💬 Tooltips inteligentes que aparecen solo en modo colapsado',
      '✨ Transiciones suaves entre estados expandido/colapsado',
      '🏷️ Cambio global de "Sistema de Gestión de Casos" a "Gestión de Casos"',
      '🧹 Eliminación de 35+ carpetas vacías (atoms, molecules, organisms, etc.)',
      '📝 Limpieza de archivos markdown de documentación temporal',
      '⚡ Estructura de componentes optimizada y simplificada',
      '🚀 Importaciones optimizadas y eliminación de dependencias innecesarias'
    ],
    type: 'feature'
  },
  {
    version: '1.3.1',
    date: '2025-06-30',
    title: 'Configuración Unificada del Archivo',
    changes: [
      '⚠️ CAMBIO IMPORTANTE: Eliminada la configuración separada ArchiveSettings',
      'Toda la configuración del módulo ahora se maneja a través de las políticas de archivo',
      'Agregados 9 nuevos campos a la tabla archive_policies para configuración completa',
      'Formulario de políticas expandido con configuración general, permisos y notificaciones',
      'Eliminados duplicación de configuraciones y componente ArchiveSettings obsoleto',
      'Interfaz simplificada: un solo formulario para toda la configuración del módulo',
      'Persistencia mejorada: toda configuración almacenada en PostgreSQL',
      'Script SQL incluido para migración: add_archive_settings_to_policies.sql',
      'Documentación actualizada con nueva estructura de configuración'
    ],
    type: 'breaking-change'
  },
  {
    version: '1.3.0',
    date: '2025-06-29',
    title: 'Módulo de Archivo Completo',
    changes: [
      'Módulo de archivo completamente implementado y funcional',
      'Archivo manual con confirmación y razón obligatoria para elementos completados',
      'Sistema de restauración con auditoría completa integrada',
      'Página de archivo dedicada (/archive) con interfaz especializada',
      'Modal de detalle completo para elementos archivados (casos y TODOs)',
      'Gestión de tipos mixtos con corrección de tipado para prioridades',
      'Botones de archivo integrados en gestión de casos y TODOs',
      'Validación de estados (solo TERMINADA/COMPLETED pueden archivarse)',
      'Integración completa con sistema de auditoría centralizado',
      'Trazabilidad total de operaciones de archivo y restauración',
      'Scripts SQL preparados para corrección de funciones de restauración',
      'Limpieza de archivos temporales y corrección de warnings',
      'Documentación completa actualizada con nuevas funcionalidades'
    ],
    type: 'feature'
  },
  {
    version: '1.2.0',
    date: '2024-12-29',
    title: 'Dashboard Optimization',
    changes: [
      'Corregido el gráfico de actividad semanal para mostrar datos reales',
      'Incluidos TODOs en el cálculo de actividad semanal',
      'Eliminados datos de prueba confusos del dashboard',
      'Mejorado el sistema de auditoría centralizado',
      'Limpieza de archivos SQL y documentación temporal',
      'Actualizado el README con documentación completa'
    ],
    type: 'feature'
  },
  {
    version: '1.1.0',
    date: '2024-12-28',
    title: 'Audit System Centralization',
    changes: [
      'Centralizado el sistema de auditoría',
      'Eliminada duplicidad de logs',
      'Corregidos errores de compilación en componentes',
      'Desplegado en Netlify con éxito',
      'Mejorada la trazabilidad del sistema'
    ],
    type: 'improvement'
  },
  {
    version: '1.0.0',
    date: '2024-12-15',
    title: 'Initial Release',
    changes: [
      'Sistema completo de gestión de casos',
      'Módulo de TODOs integrado',
      'Dashboard con métricas y gráficos',
      'Sistema de autenticación con Supabase',
      'Gestión de usuarios y permisos',
      'Seguimiento de tiempo por casos y TODOs',
      'Reportes y exportación de datos'
    ],
    type: 'major'
  }
];

export const getVersionInfo = () => {
  return {
    ...VERSION_INFO,
    fullVersion: `v${VERSION_INFO.version}`,
    displayVersion: `${VERSION_INFO.version} - ${VERSION_INFO.codename}`,
    buildInfo: `Built on ${new Date(VERSION_INFO.buildDate).toLocaleDateString()} (${VERSION_INFO.environment})`,
    changelog: CHANGELOG
  };
};
