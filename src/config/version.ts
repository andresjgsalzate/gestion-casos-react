export const VERSION_INFO = {
  version: '1.3.0',
  buildDate: '2025-06-30T03:44:53.666Z',
  releaseDate: '2025-06-29',
  codename: 'Módulo de Archivo Completo',
  environment: process.env.NODE_ENV || 'development',
  commit: process.env.REACT_APP_GIT_SHA || 'local',
  branch: process.env.REACT_APP_GIT_BRANCH || 'main'
};

export const CHANGELOG = [
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
