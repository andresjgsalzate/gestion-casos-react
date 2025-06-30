# Sistema de Versiones

## Descripción

El sistema de versiones implementado proporciona control automático de versiones visible en la interfaz del usuario, con historial de cambios y información de build.

## Componentes

### 1. Archivo de Configuración (`src/config/version.ts`)
- Contiene la información de versión actual
- Incluye changelog detallado
- Metadata de build y entorno

### 2. Componente de Visualización (`src/components/Common/VersionDisplay.tsx`)
- Chip clickeable en el sidebar
- Modal con información detallada
- Historial de cambios con categorización

### 3. Scripts de Automatización (`scripts/update-version.js`)
- Sincroniza versión entre `package.json` y código
- Actualiza fecha de build automáticamente

## Ubicaciones de Visualización

### Sidebar (Drawer)
- Chip con número de versión en la parte inferior
- Click para abrir modal de información completa

### Dashboard
- Footer con versión e información de build
- Modo texto expandido con detalles técnicos

## Comandos Disponibles

```bash
# Actualizar solo la información de versión
npm run version:update

# Incrementar versión patch (1.2.0 → 1.2.1)
npm run version:patch

# Incrementar versión minor (1.2.0 → 1.3.0)
npm run version:minor

# Incrementar versión major (1.2.0 → 2.0.0)
npm run version:major

# Build automático (incluye actualización de versión)
npm run build
```

## Workflow de Versiones

### Para Nuevas Funcionalidades
1. Desarrollar la funcionalidad
2. Actualizar el changelog en `src/config/version.ts`
3. Ejecutar `npm run version:minor` o `npm run version:major`
4. Hacer commit y push
5. Desplegar con `npm run build`

### Para Correcciones de Bugs
1. Corregir el bug
2. Actualizar el changelog
3. Ejecutar `npm run version:patch`
4. Hacer commit y push
5. Desplegar

## Estructura del Changelog

```typescript
{
  version: '1.2.0',
  date: '2024-12-29',
  title: 'Nombre del Release',
  changes: [
    'Lista de cambios realizados',
    'Nuevas funcionalidades',
    'Correcciones de bugs'
  ],
  type: 'feature' | 'improvement' | 'bugfix' | 'major'
}
```

## Tipos de Release

- **major**: Cambios importantes, breaking changes
- **feature**: Nuevas funcionalidades
- **improvement**: Mejoras en funcionalidades existentes
- **bugfix**: Corrección de errores

## Información Mostrada

- **Versión**: Número semántico (x.y.z)
- **Nombre Código**: Título descriptivo del release
- **Fecha de Release**: Cuándo se lanzó la versión
- **Entorno**: production/development
- **Fecha de Build**: Cuándo se compiló
- **Historial Completo**: Todos los cambios por versión

## Beneficios

1. **Trazabilidad**: Fácil identificación de versiones en producción
2. **Transparencia**: Usuarios pueden ver qué cambios incluye cada versión
3. **Automatización**: Versionado automático en builds
4. **Documentación**: Historial de cambios integrado
5. **Debugging**: Información técnica para soporte

## Integración con CI/CD

El sistema está preparado para integrarse con pipelines de CI/CD:

```bash
# En el pipeline de build
npm run version:update
npm run build
```

Variables de entorno opcionales:
- `REACT_APP_GIT_SHA`: Hash del commit
- `REACT_APP_GIT_BRANCH`: Rama actual
