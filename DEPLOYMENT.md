# 🚀 Guía de Despliegue

Esta guía proporciona instrucciones detalladas para desplegar el Sistema de Gestión de Casos en diferentes entornos.

## 📋 Tabla de Contenidos

- [Prerrequisitos](#prerrequisitos)
- [Configuración de Entornos](#configuración-de-entornos)
- [Despliegue en Vercel](#despliegue-en-vercel)
- [Despliegue en Netlify](#despliegue-en-netlify)
- [Despliegue en AWS S3](#despliegue-en-aws-s3)
- [Despliegue en Servidor Propio](#despliegue-en-servidor-propio)
- [Variables de Entorno](#variables-de-entorno)
- [Configuración de Base de Datos](#configuración-de-base-de-datos)
- [Monitoreo y Logs](#monitoreo-y-logs)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerrequisitos

### Herramientas Requeridas
- Node.js 16.x o superior
- npm 8.x o superior
- Git
- Cuenta de Supabase (Production)

### Cuentas de Servicios
- **Supabase**: Para base de datos y autenticación
- **Vercel/Netlify/AWS**: Para hosting (elige una)
- **GitHub**: Para repositorio y CI/CD

## 🌍 Configuración de Entornos

### Entornos Recomendados
1. **Development** - Desarrollo local
2. **Staging** - Pruebas pre-producción
3. **Production** - Ambiente de producción

### Configuración por Entorno

#### Development
```bash
# .env.local
REACT_APP_SUPABASE_URL=https://your-dev-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_dev_anon_key
REACT_APP_ENVIRONMENT=development
```

#### Staging
```bash
# Variables de entorno en plataforma de hosting
REACT_APP_SUPABASE_URL=https://your-staging-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_staging_anon_key
REACT_APP_ENVIRONMENT=staging
```

#### Production
```bash
# Variables de entorno en plataforma de hosting
REACT_APP_SUPABASE_URL=https://your-prod-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_prod_anon_key
REACT_APP_ENVIRONMENT=production
```

## 🔥 Despliegue en Vercel

### Despliegue Manual

1. **Instala Vercel CLI**
```bash
npm install -g vercel
```

2. **Login a Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
# Primera vez
vercel

# Deployments posteriores
vercel --prod
```

### Despliegue Automático con GitHub

1. **Conecta tu repositorio a Vercel**
   - Ve a [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Selecciona tu repositorio de GitHub

2. **Configura las variables de entorno**
   - En el dashboard de Vercel, ve a Settings → Environment Variables
   - Agrega las variables necesarias para cada entorno

3. **Configura el build**
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## 🌐 Despliegue en Netlify

### Despliegue Manual

1. **Build del proyecto**
```bash
npm run build
```

2. **Deploy a Netlify**
```bash
# Instala Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=build
```

### Despliegue Automático

1. **Conecta GitHub a Netlify**
   - Ve a [Netlify Dashboard](https://app.netlify.com/)
   - Click "New site from Git"
   - Selecciona tu repositorio

2. **Configuración de Build**
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Variables de Entorno**
   - Ve a Site Settings → Environment Variables
   - Agrega todas las variables necesarias

4. **Configuración adicional**
```toml
# netlify.toml
[build]
  publish = "build"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
```

## ☁️ Despliegue en AWS S3

### Configuración de S3

1. **Crear bucket S3**
```bash
aws s3 mb s3://tu-app-gestion-casos --region us-east-1
```

2. **Configurar como website**
```bash
aws s3 website s3://tu-app-gestion-casos \
  --index-document index.html \
  --error-document index.html
```

3. **Configurar políticas**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tu-app-gestion-casos/*"
    }
  ]
}
```

### Deploy Script

```bash
#!/bin/bash
# deploy.sh

# Build del proyecto
npm run build

# Sync a S3
aws s3 sync build/ s3://tu-app-gestion-casos --delete

# Invalidar CloudFront cache (opcional)
aws cloudfront create-invalidation \
  --distribution-id TU_DISTRIBUTION_ID \
  --paths "/*"
```

### CloudFront (Recomendado)

1. **Crear distribución CloudFront**
2. **Configurar origin apuntando a S3**
3. **Configurar custom error pages**
   - 403 → /index.html
   - 404 → /index.html

## 🖥️ Despliegue en Servidor Propio

### Con Nginx

1. **Build del proyecto**
```bash
npm run build
```

2. **Configuración de Nginx**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/gestion-casos/build;
    index index.html;

    # Manejo de rutas de React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Headers de seguridad
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

3. **Configuración HTTPS con Let's Encrypt**
```bash
sudo certbot --nginx -d tu-dominio.com
```

### Con Apache

```apache
<VirtualHost *:80>
    ServerName tu-dominio.com
    DocumentRoot /var/www/gestion-casos/build
    
    <Directory "/var/www/gestion-casos/build">
        RewriteEngine On
        RewriteBase /
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
        
        AllowOverride All
        Require all granted
    </Directory>
    
    # Headers de seguridad
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

## 🔐 Variables de Entorno

### Variables Requeridas
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key

# Environment
REACT_APP_ENVIRONMENT=production
```

### Variables Opcionales
```bash
# Analytics (opcional)
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX

# Sentry (opcional)
REACT_APP_SENTRY_DSN=https://xxx@sentry.io/xxx

# Feature Flags (opcional)
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ERROR_TRACKING=true
```

## 🗄️ Configuración de Base de Datos

### Configuración de Producción en Supabase

1. **Crear proyecto de producción**
2. **Ejecutar script de setup**
```sql
-- Ejecutar database/setup.sql en el editor SQL de Supabase
```

3. **Configurar Row Level Security**
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
```

4. **Configurar backup automático**
   - Habilitar Point-in-Time Recovery
   - Configurar backups diarios

### Migraciones

```bash
# Script para ejecutar migraciones
#!/bin/bash
# migrate.sh

echo "Ejecutando migraciones..."

# Conectar a Supabase y ejecutar scripts
supabase db push

echo "Migraciones completadas"
```

## 📊 Monitoreo y Logs

### Configuración de Logs

1. **Sentry para Error Tracking**
```typescript
// src/utils/sentry.ts
import * as Sentry from '@sentry/react';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.REACT_APP_ENVIRONMENT,
  });
}
```

2. **Google Analytics**
```typescript
// src/utils/analytics.ts
import ReactGA from 'react-ga4';

if (process.env.REACT_APP_GA_TRACKING_ID) {
  ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_ID);
}
```

### Health Checks

```typescript
// src/utils/healthCheck.ts
export const healthCheck = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};
```

## 🚨 Troubleshooting

### Problemas Comunes

#### Build Failures
```bash
# Limpiar cache
npm run build -- --reset-cache

# Verificar dependencias
npm audit fix

# Verificar variables de entorno
echo $REACT_APP_SUPABASE_URL
```

#### Issues de Routing
- Verificar configuración de redirects en hosting
- Asegurar que todas las rutas redirigen a index.html

#### Problemas de CORS
```typescript
// Verificar configuración de Supabase
// Settings → API → CORS origins
// Agregar tu dominio de producción
```

#### Performance Issues
```bash
# Analizar bundle size
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js
```

### Logs y Debugging

```bash
# Ver logs de build
npm run build 2>&1 | tee build.log

# Analizar errores de runtime
# Verificar Console del navegador
# Revisar Sentry dashboard
```

## 🚀 Estado Actual - Listo para Despliegue

✅ **Proyecto preparado exitosamente:**
- Build completado sin errores ni advertencias
- Logs de auditoría funcionando correctamente
- Campos NULL corregidos (user_id, ip_address, user_agent)
- Modal con nombres legibles implementado
- Componente de testing integrado
- Variables de entorno documentadas

### 🔧 Mejoras de Auditoría Implementadas

#### Problema Resuelto: Campos NULL
- **user_id:** Auto-detección desde sesión de Supabase
- **ip_address:** Captura con múltiples servicios de fallback
- **user_agent:** Captura segura del navegador

#### Modal Mejorado
- Muestra nombres legibles en lugar de solo IDs
- Resuelve automáticamente: Creado por, Asignado a, Prioridad, Aplicación, Origen
- Formateo mejorado de fechas y estados

#### Testing Integrado
- Componente de prueba en el módulo de administración
- Tests automáticos de diferentes escenarios
- Verificación de captura de todos los campos

### 📦 Build Information
```bash
# Último build exitoso
File sizes after gzip:
  519.59 kB  build\static\js\main.fadb87a1.js
  3.55 kB    build\static\css\main.37ae1694.css

# Sin errores ni advertencias
Compiled successfully.
```

🎯 **Siguiente paso:** Subir a GitHub y conectar con Netlify para despliegue automático.

---

**Nota**: Siempre prueba en un entorno de staging antes de desplegar a producción.
