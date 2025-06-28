# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir al Sistema de Gestión de Casos! Este documento te guiará a través del proceso de contribución.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
- [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Guías de Estilo](#guías-de-estilo)
- [Proceso de Pull Request](#proceso-de-pull-request)
- [Reporte de Bugs](#reporte-de-bugs)
- [Solicitud de Funcionalidades](#solicitud-de-funcionalidades)

## 📜 Código de Conducta

Este proyecto adhiere al [Código de Conducta del Contribuyente](https://www.contributor-covenant.org/es/version/2/0/code_of_conduct/). Al participar, se espera que mantengas este código.

## 🚀 ¿Cómo puedo contribuir?

### 🐛 Reportar Bugs
- Usa el [template de issue](../../issues/new?template=bug_report.md)
- Incluye pasos detallados para reproducir el problema
- Proporciona información del entorno (OS, navegador, versión)

### ✨ Sugerir Funcionalidades
- Usa el [template de feature request](../../issues/new?template=feature_request.md)
- Explica claramente la funcionalidad y su utilidad
- Considera la compatibilidad con la arquitectura actual

### 🔧 Contribuir con Código
- Corrige bugs reportados
- Implementa nuevas funcionalidades
- Mejora la documentación
- Optimiza el rendimiento

## 🛠️ Configuración del Entorno de Desarrollo

### Prerrequisitos
```bash
# Versiones mínimas requeridas
Node.js >= 16.x
npm >= 8.x
Git >= 2.x
```

### Configuración Inicial
1. **Fork el repositorio**
```bash
# Haz fork en GitHub y luego clona tu fork
git clone https://github.com/tu-usuario/gestion-casos-react.git
cd gestion-casos-react
```

2. **Configura el repositorio upstream**
```bash
git remote add upstream https://github.com/original-owner/gestion-casos-react.git
git fetch upstream
```

3. **Instala dependencias**
```bash
npm install
```

4. **Configura variables de entorno**
```bash
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase de desarrollo
```

5. **Configura la base de datos de desarrollo**
- Crea un proyecto de Supabase para desarrollo
- Ejecuta `database/setup.sql` en tu instancia de desarrollo
- Actualiza `.env.local` con las credenciales correctas

6. **Inicia el servidor de desarrollo**
```bash
npm start
```

## 🔄 Proceso de Desarrollo

### 1. Mantente Actualizado
```bash
git checkout main
git fetch upstream
git rebase upstream/main
```

### 2. Crea una Rama para tu Feature
```bash
git checkout -b feature/nombre-descriptivo
# o
git checkout -b fix/descripcion-del-bug
```

### 3. Naming Convention para Ramas
- `feature/descripcion-funcionalidad` - Nuevas funcionalidades
- `fix/descripcion-bug` - Corrección de bugs
- `docs/descripcion-documentacion` - Cambios en documentación
- `refactor/descripcion-refactor` - Refactoring de código
- `style/descripcion-estilo` - Cambios de estilo/formato
- `test/descripcion-test` - Agregar o corregir tests

### 4. Desarrolla tu Funcionalidad
- Escribe código limpio y bien documentado
- Sigue las convenciones de estilo del proyecto
- Agrega tests cuando sea aplicable
- Actualiza la documentación si es necesario

### 5. Commits
Usa [Conventional Commits](https://www.conventionalcommits.org/):
```bash
git commit -m "feat: agregar componente de notificaciones push"
git commit -m "fix: corregir bug en filtro de casos por usuario"
git commit -m "docs: actualizar README con nueva funcionalidad"
```

Tipos de commit:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formateo, espacios en blanco, etc.
- `refactor`: Refactoring de código
- `test`: Agregar tests
- `chore`: Mantenimiento del código

## 📏 Estándares de Código

### TypeScript
- Usa TypeScript para todos los archivos nuevos
- Define interfaces para todos los objetos de datos
- Evita `any`, usa tipos específicos
- Usa enums para valores constantes

### React
- Usa componentes funcionales con hooks
- Implementa manejo de errores con Error Boundaries
- Usa React.memo para optimización cuando sea necesario
- Sigue el principio de componentes únicos de responsabilidad

### Material-UI
- Usa los componentes de MUI consistentemente
- Mantén el tema personalizado centralizado
- Usa el sistema de Grid de MUI para layout responsive

### Supabase
- Implementa Row Level Security para nuevas tablas
- Usa servicios centralizados para operaciones de base de datos
- Maneja errores de red y base de datos apropiadamente

## 🎨 Guías de Estilo

### Estructura de Archivos
```
src/
├── components/           # Componentes reutilizables
│   ├── ComponentName/   # Un folder por componente
│   │   ├── index.tsx    # Componente principal
│   │   ├── types.ts     # Tipos específicos del componente
│   │   └── styles.ts    # Estilos si es necesario
├── pages/               # Páginas principales
├── hooks/               # Custom hooks
├── services/            # Servicios de API
├── types/               # Tipos TypeScript globales
└── utils/               # Funciones utilitarias
```

### Naming Conventions
- **Componentes**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase con prefijo "use" (`useUserData.ts`)
- **Servicios**: camelCase con sufijo "Service" (`userService.ts`)
- **Tipos/Interfaces**: PascalCase (`UserData`, `CaseStatus`)
- **Variables/Funciones**: camelCase (`getUserData`, `isLoading`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### Código Limpio
- Funciones pequeñas y específicas (máximo 20 líneas)
- Nombres descriptivos para variables y funciones
- Comentarios solo cuando sea necesario explicar "por qué", no "qué"
- Evita anidación profunda (máximo 3 niveles)

## 🔍 Testing

### Ejecutar Tests
```bash
npm test                 # Ejecutar todos los tests
npm test -- --watch     # Modo watch
npm test -- --coverage  # Con coverage
```

### Escribir Tests
- Usa Jest y React Testing Library
- Escribe tests para funcionalidades críticas
- Mock servicios externos (Supabase)
- Tests de integración para flujos completos

### Ejemplo de Test
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('should display user information correctly', () => {
    const user = { id: '1', name: 'John Doe', email: 'john@example.com' };
    render(<UserProfile user={user} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

## 📥 Proceso de Pull Request

### Antes de Enviar
1. **Asegúrate de que el código compile**
```bash
npm run build
```

2. **Ejecuta los tests**
```bash
npm test
```

3. **Verifica el linting**
```bash
npm run lint
```

4. **Actualiza desde upstream**
```bash
git fetch upstream
git rebase upstream/main
```

### Template de Pull Request
```markdown
## 📋 Descripción
Breve descripción de los cambios realizados.

## 🔄 Tipo de Cambio
- [ ] 🐛 Bug fix
- [ ] ✨ Nueva funcionalidad
- [ ] 💥 Breaking change
- [ ] 📚 Documentación

## ✅ Checklist
- [ ] El código compila sin errores
- [ ] Los tests existentes pasan
- [ ] Se agregaron tests para nueva funcionalidad
- [ ] La documentación está actualizada
- [ ] Se siguieron las convenciones de código

## 🧪 Cómo Probar
Pasos para probar los cambios:
1. ...
2. ...

## 📷 Screenshots (si aplica)
Adjuntar screenshots de cambios visuales.

## 🔗 Issues Relacionados
Fixes #(issue number)
```

### Revisión de Código
- Las PR requieren al menos una aprobación
- Se ejecutan checks automáticos (build, tests, lint)
- Responde a comentarios de revisión constructivamente
- Mantén las PR pequeñas y enfocadas

## 🐞 Reporte de Bugs

### Información Requerida
- **Resumen**: Descripción clara y concisa del bug
- **Pasos para reproducir**: Lista numerada de pasos
- **Comportamiento esperado**: Qué debería pasar
- **Comportamiento actual**: Qué está pasando
- **Screenshots**: Si es un problema visual
- **Entorno**: OS, navegador, versión
- **Información adicional**: Logs, errores de consola

### Template de Bug Report
```markdown
## 🐛 Descripción del Bug
Descripción clara y concisa del bug.

## 📋 Pasos para Reproducir
1. Ve a '...'
2. Haz clic en '....'
3. Scroll down hasta '....'
4. Ve el error

## ✅ Comportamiento Esperado
Descripción clara de lo que esperabas que pasara.

## ❌ Comportamiento Actual
Descripción clara de lo que está pasando.

## 📷 Screenshots
Si aplica, agrega screenshots para explicar el problema.

## 🖥️ Información del Entorno
- OS: [e.g. Windows 10]
- Navegador: [e.g. Chrome 91.0]
- Versión: [e.g. 1.0.0]

## ➕ Contexto Adicional
Agrega cualquier otro contexto sobre el problema aquí.
```

## 💡 Solicitud de Funcionalidades

### Template de Feature Request
```markdown
## 🚀 Feature Request

## 📋 Descripción
Descripción clara y concisa de la funcionalidad que quieres.

## 💭 Motivación
¿Qué problema resuelve esta funcionalidad? ¿Por qué es importante?

## 📝 Solución Propuesta
Descripción clara de lo que quieres que pase.

## 🔄 Alternativas Consideradas
Describe alternativas que hayas considerado.

## ➕ Contexto Adicional
Agrega cualquier otro contexto o screenshots sobre la solicitud aquí.
```

## 📞 Contacto y Ayuda

### Canales de Comunicación
- **GitHub Issues**: Para bugs y feature requests
- **Email**: desarrollo@tu-dominio.com
- **Discord**: [Link al servidor de Discord]

### Obtener Ayuda
Si necesitas ayuda:
1. Revisa la documentación existente
2. Busca en issues existentes
3. Pregunta en el canal de desarrollo
4. Crea un issue con la etiqueta "help wanted"

---

## 🎉 ¡Gracias por Contribuir!

Tu contribución hace que este proyecto sea mejor para todos. ¡Apreciamos tu tiempo y esfuerzo!

### Reconocimientos
Los contribuyentes son reconocidos en:
- Lista de contribuyentes en el README
- Releases notes cuando aplique
- Hall of Fame (para contribuciones significativas)

---

**¿Primera vez contribuyendo a un proyecto open source?** 
Revisa [esta guía](https://opensource.guide/how-to-contribute/) para aprender los conceptos básicos.
