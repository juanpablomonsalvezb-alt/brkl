# 🎓 Instituto UCE Online - Plataforma Educativa

Plataforma educativa online integral basada en el modelo Russell Barkley, adaptada para educación chilena. Sistema completo de gestión académica con configuración dinámica de planes de estudio, evaluaciones inteligentes, recursos didácticos y seguimiento de progreso estudiantil.

## 🌐 Sitio en Producción

**URL:** https://brkl.onrender.com  
**Repositorio:** https://github.com/juanpablomonsalvezb-alt/brkl

---

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Inicio Rápido](#-inicio-rápido)
- [Configuración](#-configuración)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Base de Datos](#-base-de-datos)
- [Deployment](#-deployment)
- [Solución de Problemas](#-solución-de-problemas)
- [Contribuir](#-contribuir)

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** con TypeScript
- **Vite 7.3** como build tool
- **TailwindCSS** para estilos
- **shadcn/ui** para componentes
- **React Router v6** para navegación
- **TanStack Query** para state management
- **Framer Motion** para animaciones

### Backend
- **Node.js 20.x** (LTS)
- **Express.js 4.x** REST API
- **TypeScript 5.6** para type safety
- **express-session** para sesiones
- **Replit Auth** autenticación integrada
- **Google APIs** para Drive y OAuth

### Base de Datos
- **Turso** (SQLite en la nube - libSQL)
- **Drizzle ORM** para queries type-safe
- **@libsql/client** cliente de conexión
- **26 tablas** con relaciones
- **9GB storage** gratuito

### Hosting
- **Render.com** para backend y frontend
- **GitHub** para control de versiones
- **Deploy automático** desde rama main

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    USUARIOS                          │
│              (Estudiantes/Profesores)                │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              RENDER.COM (Hosting)                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Frontend (React SPA)                        │  │
│  │  - Build: Vite                               │  │
│  │  - Static: /dist/public                      │  │
│  │  - Port: 3001                                │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Backend (Express Server)                    │  │
│  │  - API: /api/*                               │  │
│  │  - TypeScript → JavaScript                   │  │
│  │  - Sessions: express-session                 │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│         TURSO (Base de Datos SQLite Cloud)          │
│  - 26 tablas relacionales                            │
│  - Región: AWS US West (Oregon)                     │
│  - ORM: Drizzle                                      │
│  - Límites: 9GB, 500M reads/mes                     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 20.x o superior
- npm 9.x o superior
- Git
- Cuenta de Turso (gratuita) - https://turso.tech
- Cuenta de Render (gratuita) - https://render.com

### Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/juanpablomonsalvezb-alt/brkl.git
cd brkl

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (ver sección Configuración)
cp .env.example .env.local
# Edita .env.local con tus credenciales

# 4. Ejecutar migraciones a Turso
npx drizzle-kit push

# 5. Iniciar servidor de desarrollo
npm run dev
```

El sitio estará disponible en: **http://localhost:3001**

---

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# ===================================
# BASE DE DATOS TURSO (REQUERIDO)
# ===================================
TURSO_DATABASE_URL=libsql://tu-base-de-datos.turso.io
TURSO_AUTH_TOKEN=tu_token_generado_por_turso

# ===================================
# SESIONES (REQUERIDO)
# ===================================
SESSION_SECRET=tu_secret_aleatorio_32_caracteres

# ===================================
# GOOGLE DRIVE (OPCIONAL)
# ===================================
GOOGLE_CLIENT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"

# ===================================
# GOOGLE GEMINI AI (OPCIONAL)
# ===================================
GEMINI_API_KEY=tu_api_key_de_gemini
```

### Generar SESSION_SECRET

```bash
# Linux/macOS
openssl rand -hex 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Configurar Turso

1. **Crear cuenta:**
   ```bash
   turso auth signup
   ```

2. **Crear base de datos:**
   ```bash
   turso db create brkl-db
   ```

3. **Obtener credenciales:**
   ```bash
   # URL de conexión
   turso db show brkl-db --url
   
   # Token de autenticación
   turso db tokens create brkl-db
   ```

4. **Agregar a `.env.local`** las credenciales obtenidas

---

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo en puerto 3001

# Producción
npm run build            # Construye cliente y servidor
npm run start            # Inicia servidor de producción

# Base de datos
npx drizzle-kit studio   # Abre interfaz web de BD (localhost:4983)
npx drizzle-kit push     # Pushea cambios de schema a Turso
npx drizzle-kit generate # Genera archivos de migración

# Utilidades
npm run type-check       # Verifica tipos TypeScript (si está configurado)
npm run lint             # Ejecuta linter (si está configurado)
```

---

## 📁 Estructura del Proyecto

```
brkl/
├── client/                      # Frontend React
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   │   ├── ui/            # Componentes shadcn/ui
│   │   │   ├── EvaluationQuiz.tsx
│   │   │   ├── ModuleCalendar.tsx
│   │   │   ├── PlanConfigurator.tsx
│   │   │   ├── TextbookViewer.tsx
│   │   │   └── ...
│   │   ├── pages/             # Páginas/rutas
│   │   │   ├── Home.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CoursePlayer.tsx
│   │   │   ├── PlanSelector2026.tsx
│   │   │   ├── BarkleyAdmin.tsx
│   │   │   └── ...
│   │   ├── hooks/             # React hooks personalizados
│   │   ├── lib/               # Utilidades
│   │   ├── App.tsx            # Componente raíz
│   │   └── main.tsx           # Entry point
│   ├── public/                # Assets estáticos
│   └── index.html             # HTML base
│
├── server/                      # Backend Express
│   ├── routes.ts              # Rutas API principales
│   ├── index.ts               # Entry point del servidor
│   ├── db.ts                  # Configuración de base de datos
│   ├── storage.ts             # Capa de acceso a datos
│   ├── aiEvaluationGenerator.ts  # Generación de evaluaciones con IA
│   ├── calendarUtils.ts       # Utilidades de calendario
│   ├── googleDrive.ts         # Integración con Google Drive
│   └── replit_integrations/   # Integraciones de Replit Auth
│
├── shared/                      # Código compartido
│   ├── schema.ts              # Schema de Drizzle ORM
│   └── models/                # Tipos TypeScript compartidos
│
├── api/                         # Serverless functions (legacy)
│   └── index.ts
│
├── migrations/                  # Migraciones de base de datos
│
├── script/                      # Scripts de build
│   └── build.ts
│
├── package.json                 # Dependencias del proyecto
├── tsconfig.json               # Configuración TypeScript
├── vite.config.ts              # Configuración Vite
├── drizzle.config.ts           # Configuración Drizzle Kit
├── render.yaml                 # Configuración Render.com
├── Dockerfile                  # Docker config (legacy)
├── netlify.toml                # Netlify config (legacy)
└── .env.local                  # Variables de entorno (no commitear)
```

---

## 🌐 API Endpoints

### Autenticación
- `GET /api/user` - Obtener usuario actual
- `GET /api/profile` - Obtener perfil completo

### Planes de Estudio
- `GET /api/plan-configurations` - Lista de planes básica/media
- `POST /api/plan-configurations` - Crear plan
- `PUT /api/plan-configurations/:id` - Actualizar plan
- `DELETE /api/plan-configurations/:id` - Eliminar plan

### Configuración por Nivel
- `GET /api/level-plans` - Planes configurados por nivel
- `POST /api/level-plans` - Crear configuración de nivel
- `PUT /api/level-plans/:id` - Actualizar configuración
- `DELETE /api/level-plans/:id` - Eliminar configuración

### Ciclo Adultos
- `GET /api/adult-cycles` - Configuraciones ciclo adultos
- `POST /api/adult-cycles` - Crear configuración
- `PUT /api/adult-cycles/:id` - Actualizar
- `DELETE /api/adult-cycles/:id` - Eliminar

### Asignaturas por Nivel
- `GET /api/level-subjects` - Lista de asignaturas por nivel
- `GET /api/level-subjects/:id` - Detalle de asignatura
- `GET /api/level-subjects/:id/textbook` - Configuración de PDF
- `GET /api/level-subjects/:id/calendar` - Calendario de módulos

### Recursos Semanales
- `GET /api/level-subjects/:id/weekly-resources` - Recursos por semana
- `POST /api/level-subjects/:id/weekly-resources` - Crear recurso
- `PUT /api/weekly-resources/:id` - Actualizar recurso
- `DELETE /api/weekly-resources/:id` - Eliminar recurso

### Configuración de Textbooks
- `GET /api/textbook-configs` - Lista de configuraciones de PDFs
- `POST /api/textbook-configs` - Configurar PDF para asignatura
- `PUT /api/textbook-configs/:id` - Actualizar configuración
- `DELETE /api/textbook-configs/:id` - Eliminar configuración

### Evaluaciones
- `GET /api/evaluations` - Lista de evaluaciones
- `POST /api/evaluations/generate` - Generar evaluación con IA
- `POST /api/evaluations/submit` - Enviar respuestas
- `GET /api/evaluations/:id/results` - Resultados de evaluación

### Copilots Gemini
- `GET /api/gemini-copilots` - Lista de copilots configurados
- `POST /api/gemini-copilots` - Crear copilot
- `PUT /api/gemini-copilots/:id` - Actualizar copilot
- `DELETE /api/gemini-copilots/:id` - Eliminar copilot
- `POST /api/gemini-copilots/:id/toggle` - Activar/desactivar

### Reservas
- `GET /api/reservations` - Lista de reservas
- `POST /api/reservations` - Crear reserva
- `GET /api/reservations/:id` - Detalle de reserva
- `PUT /api/reservations/:id/status` - Actualizar estado
- `DELETE /api/reservations/:id` - Eliminar reserva

### Google Drive (Admin)
- `GET /api/admin/drive/folders` - Listar carpetas de Drive
- `POST /api/admin/drive/sync` - Sincronizar recursos desde Drive

---

## 🗄️ Base de Datos

### Tecnología
- **Turso** - SQLite en la nube (libSQL)
- **Drizzle ORM** - Type-safe queries
- **26 tablas** relacionales

### Tablas Principales

#### Configuración Académica
- `levels` - Niveles educativos (1° Básico - 4° Medio)
- `subjects` - Asignaturas (Matemática, Lenguaje, etc.)
- `level_subjects` - Asignaturas por nivel
- `plan_configurations` - Planes de estudio (básica/media)
- `level_plan_configurations` - Configuración por nivel
- `adult_cycle_configurations` - Configuración ciclo adultos

#### Contenido y Recursos
- `weekly_resources` - Recursos didácticos semanales
- `textbook_configs` - Configuración de PDFs por asignatura
- `learning_objectives` - Objetivos de aprendizaje
- `module_evaluations` - Evaluaciones por módulo

#### Evaluaciones
- `evaluations` - Evaluaciones creadas
- `evaluation_questions` - Preguntas de evaluación
- `evaluation_attempts` - Intentos de estudiantes
- `evaluation_responses` - Respuestas de estudiantes
- `evaluation_links` - Enlaces a evaluaciones externas

#### Sistema
- `user` - Usuarios del sistema
- `reservations` - Reservas de clases
- `gemini_copilots` - Configuración de asistentes IA
- `site_configuration` - Configuración general del sitio

### Esquema Completo

El esquema completo está definido en `shared/schema.ts` usando Drizzle ORM.

Para ver el esquema visualmente:
```bash
npx drizzle-kit studio
```

Esto abrirá una interfaz web en `http://localhost:4983`

---

## 🚀 Desarrollo Local

### Iniciar Servidor de Desarrollo

```bash
npm run dev
```

- Frontend: http://localhost:3001
- API: http://localhost:3001/api/*
- Hot reload activado para cliente y servidor

### Variables de Entorno para Desarrollo

Asegúrate de tener `.env.local` configurado (ver sección [Configuración](#-configuración))

### Probar la API

```bash
# Obtener planes
curl http://localhost:3001/api/plan-configurations

# Obtener asignaturas por nivel
curl http://localhost:3001/api/level-subjects

# Ver usuario actual
curl http://localhost:3001/api/user
```

---

## 📦 Build y Producción

### Construir para Producción

```bash
npm run build
```

Esto genera:
- `dist/public/` - Frontend (HTML, CSS, JS, assets)
- `dist/index.cjs` - Backend (Express compilado)

### Iniciar en Modo Producción

```bash
npm run start
```

---

## 🌍 Deployment

### Render.com (Actual)

El proyecto está configurado para deployment automático en Render.com.

#### Configuración Automática

El archivo `render.yaml` configura:
- Build command: `npm install && npm run build`
- Start command: `node dist/index.cjs`
- Puerto: 3001
- Región: Oregon (us-west)
- Plan: Free tier

#### Variables de Entorno en Render

Configura en Dashboard → Environment:

```
TURSO_DATABASE_URL=libsql://tu-db.turso.io
TURSO_AUTH_TOKEN=tu_token_aqui
SESSION_SECRET=tu_secret_aleatorio
NODE_ENV=production
```

#### Deploy Manual

1. Ve a https://dashboard.render.com
2. Selecciona tu servicio
3. Click en "Manual Deploy" → "Deploy latest commit"

#### Deploy Automático

Cada `git push origin main` dispara un deploy automático.

### Otras Plataformas

El proyecto incluye configuración legacy para:
- **Vercel** - `vercel.json` (deprecado por problemas de Node.js)
- **Netlify** - `netlify.toml` (deprecado por problemas con libsql)
- **Fly.io** - `Dockerfile` y `fly.toml` (alternativa viable)

---

## 🔧 Configuración Avanzada

### Turso Database Management

```bash
# Ver información de la base de datos
turso db show brkl-db

# Ver uso actual
turso db show brkl-db --usage

# Abrir shell SQL
turso db shell brkl-db

# Crear backup
turso db shell brkl-db .dump > backup.sql

# Importar backup
turso db shell brkl-db < backup.sql

# Ver logs
turso db logs brkl-db

# Cambiar región
turso db replicate brkl-db --location sao
```

### Migraciones de Base de Datos

```bash
# Generar archivo de migración
npx drizzle-kit generate

# Aplicar migración a Turso
npx drizzle-kit push

# Ver diferencias
npx drizzle-kit check

# Ver estado
npx drizzle-kit up
```

### Google Drive Integration

Para configurar sincronización con Google Drive:

1. Crear Service Account en Google Cloud Console
2. Habilitar Google Drive API
3. Descargar JSON de credenciales
4. Extraer `client_email` y `private_key`
5. Agregar a variables de entorno

---

## 🎨 Características Principales

### 1. Sistema de Planes de Estudio

Configurador dinámico que permite:
- Crear planes para básica (1° a 8°)
- Crear planes para media (1° a 4°)
- Configurar ciclos para adultos
- Definir asignaturas por nivel
- Establecer horas semanales por asignatura

**Ruta:** `/plan-selector` o `/admin/plan-settings`

### 2. Módulos de Aprendizaje

Sistema de módulos semanales con:
- Calendario visual
- Recursos didácticos por semana
- Objetivos de aprendizaje
- Material complementario
- Evaluaciones integradas

**Ruta:** `/course/:levelSubjectId`

### 3. Sistema de Evaluaciones

Generación inteligente de evaluaciones con:
- Preguntas generadas por IA (Gemini)
- Múltiple opción, verdadero/falso, desarrollo
- Corrección automática
- Historial de intentos
- Retroalimentación detallada

**Ruta:** `/evaluations`

### 4. Visor de PDFs Educativos

Visor de textbooks con:
- Configuración de páginas por módulo
- Navegación por capítulos
- Vinculación módulo-páginas
- Zoom y navegación avanzada

**Ruta:** Dentro de módulos de asignatura

### 5. Copilots Gemini

Asistentes IA personalizables:
- Configuración por asignatura o módulo
- Prompts personalizados
- Activación/desactivación individual
- Historial de conversaciones

**Ruta:** `/admin/gemini-copilots`

### 6. Sistema de Reservas

Gestión de reservas para:
- Clases particulares
- Tutorías
- Asesorías
- Control de disponibilidad

**Ruta:** `/reservations`

---

## 🔐 Autenticación y Seguridad

### Sistema de Autenticación

- **Método:** Google OAuth (Gmail requerido)
- **Ubicación:** Botón "Ingresar" en menú superior
- **Sesiones:** express-session con cookies HTTP-only
- **Duración:** 7 días por defecto

### Flujo de Autenticación

```
Usuario → Click "Ingresar" 
       → Redirect a Google OAuth
       → Autenticación con Gmail
       → Redirect de vuelta con token
       → Sesión creada
       → Acceso a plataforma
```

### Protección de Rutas

Las rutas protegidas requieren autenticación:
- `/dashboard`
- `/course/*`
- `/admin/*`
- `/reservations`

### Variables de Entorno Sensibles

**NUNCA commitear:**
- `.env.local`
- `.env`
- Cualquier archivo con credenciales

**Incluido en `.gitignore`:**
```
.env*
!.env.example
*.db
*.db-*
```

---

## 🐛 Solución de Problemas

### Problema: "No se conecta a Turso"

**Error:** `URL_INVALID` o `AUTH_ERROR`

**Solución:**
1. Verifica que `.env.local` existe
2. Verifica que `TURSO_DATABASE_URL` esté correctamente configurada
3. Verifica que `TURSO_AUTH_TOKEN` NO tenga saltos de línea
4. Regenera el token: `turso db tokens create brkl-db`

### Problema: "No cargan los planes/módulos"

**Síntomas:** Arrays vacíos en la UI

**Solución:**
1. Verifica que las variables de entorno estén en Render
2. Verifica que el token de Turso no haya expirado
3. Revisa los logs de Render para errores de DB
4. Regenera token y actualiza en Render

### Problema: "Error de Node.js version"

**En Vercel/Netlify:** Mensajes contradictorios de versión

**Solución:**
- Usar Render.com en su lugar (configurado en `render.yaml`)
- Render no tiene estos problemas

### Problema: "Build falla con TypeScript errors"

**Errores comunes:**
- `req.params.id` es `string | string[]`
- Valores posiblemente `null`

**Solución:**
Ya implementado helper `getStringParam()` en `server/routes.ts`

### Problema: "Sitio se duerme en Render"

**Síntomas:** Primera carga toma 30-60 segundos

**Solución:**
Usar servicio de "ping" gratuito:
- **UptimeRobot:** https://uptimerobot.com
- **Cron-job.org:** https://cron-job.org

Configurar ping cada 10 minutos a `https://brkl.onrender.com`

### Problema: "Failed to connect - spawn npm ENOENT"

**En Vercel:** Bug conocido de Vercel

**Solución:**
- Usar Render.com (recomendado)
- O eliminar completamente `engines` de package.json

### Problema: "Migrations failed with 401"

**Token expirado o inválido**

**Solución:**
```bash
# Regenerar token
turso db tokens create brkl-db

# Actualizar en .env.local
# Actualizar en Render Environment Variables
# Redeploy
```

---

## 📚 Documentación Adicional

- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - Resumen completo del deployment
- **[TURSO_VERCEL_SETUP.md](./TURSO_VERCEL_SETUP.md)** - Setup de Turso (válido para cualquier plataforma)
- **[FLY_DEPLOY.md](./FLY_DEPLOY.md)** - Deployment en Fly.io (alternativa)
- **[ARQUITECTURA_ESTANDAR.md](./ARQUITECTURA_ESTANDAR.md)** - Detalles de arquitectura
- **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** - Guía de inicio rápido

---

## 🔄 Flujo de Desarrollo

### Hacer Cambios

```bash
# 1. Crear rama (opcional)
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios en el código

# 3. Probar localmente
npm run dev

# 4. Build local para verificar
npm run build

# 5. Commit
git add .
git commit -m "feat: descripción del cambio"

# 6. Push
git push origin main

# 7. Render detecta y deploya automáticamente (2-3 min)
```

### Cambios en Schema de Base de Datos

```bash
# 1. Modificar shared/schema.ts

# 2. Generar migración
npx drizzle-kit generate

# 3. Pushear a Turso
npx drizzle-kit push

# 4. Commit y push
git add .
git commit -m "feat: update database schema"
git push origin main
```

---

## 🧪 Testing

### Desarrollo Local

```bash
# Verificar que el servidor inicia
npm run dev

# Probar endpoints
curl http://localhost:3001/api/plan-configurations
curl http://localhost:3001/api/level-subjects
```

### Pre-Deploy Checklist

- [ ] Build local exitoso: `npm run build`
- [ ] No hay errores de TypeScript
- [ ] Variables de entorno configuradas
- [ ] Migraciones aplicadas a Turso
- [ ] Tests manuales de funcionalidad crítica

---

## 📈 Monitoreo y Logs

### Ver Logs en Producción

**Render:**
1. Dashboard → Tu servicio → **"Logs"**
2. Logs en tiempo real
3. Búsqueda y filtrado

### Ver Estado de Base de Datos

```bash
# Ver uso actual
turso db show brkl-db --usage

# Ver información general
turso db show brkl-db

# Query directo
turso db shell brkl-db "SELECT COUNT(*) FROM user"
```

---

## 💰 Límites del Tier Gratuito

### Render.com (Hosting)
- ✅ Servidor web gratis
- ⚠️ Se duerme tras 15 min inactividad
- ⚠️ Primera carga: 30-60 segundos
- ✅ 750 horas/mes (suficiente)

### Turso (Base de Datos)
- ✅ 9 GB storage
- ✅ 500M reads/mes
- ✅ 10M writes/mes  
- ✅ 3 bases de datos
- ✅ 3 regiones

**Capacidad estimada:**
- ~100,000 usuarios
- ~1,000,000 evaluaciones
- ~10,000,000 respuestas

---

## 🤝 Contribuir

### Reportar Issues

- Usa GitHub Issues: https://github.com/juanpablomonsalvezb-alt/brkl/issues
- Incluye:
  - Descripción clara del problema
  - Pasos para reproducir
  - Screenshots si es relevante
  - Logs de error

### Pull Requests

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nombre`
3. Commit cambios: `git commit -m 'Add: descripción'`
4. Push: `git push origin feature/nombre`
5. Crea Pull Request en GitHub

### Convenciones de Código

- **TypeScript** para todo el código
- **ESLint** y **Prettier** para formateo (si está configurado)
- **Commits semánticos:** `feat:`, `fix:`, `docs:`, `chore:`
- **Nombres descriptivos** para variables y funciones

---

## 📄 Licencia

[Especificar licencia del proyecto]

---

## 👥 Autores y Contacto

- **Repositorio:** https://github.com/juanpablomonsalvezb-alt/brkl
- **Email:** juanpablo.monsalvezb@gmail.com

---

## 🙏 Agradecimientos

- Basado en el modelo Russell Barkley
- Inspirado en plataformas educativas modernas
- Construido con tecnologías open source

---

**Última actualización:** 30 de Enero, 2026

---

## 📖 Guías Rápidas

### ¿Primera vez?
Lee **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)**

### ¿Vas a deployar?
Lee **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)**

### ¿Problemas con Turso?
Lee **[TURSO_VERCEL_SETUP.md](./TURSO_VERCEL_SETUP.md)** (aplica para cualquier plataforma)

### ¿Quieres contribuir?
Lee la sección [Contribuir](#-contribuir) arriba
