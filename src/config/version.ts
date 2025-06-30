export const VERSION_INFO = {
  version: '1.2.0',
  buildDate: '2025-06-30T00:52:38.994Z',
  releaseDate: '2024-12-29',
  codename: 'Dashboard Optimization',
  environment: process.env.NODE_ENV || 'development',
  commit: process.env.REACT_APP_GIT_SHA || 'local',
  branch: process.env.REACT_APP_GIT_BRANCH || 'main'
};

export const CHANGELOG = [
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
