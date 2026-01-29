# ⚙️ Variables de Entorno para Vercel

## Variables REQUERIDAS en Vercel Dashboard

Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega:

### 1. NODE_ENV
```
NODE_ENV = production
```

### 2. SESSION_SECRET
Genera un valor seguro ejecutando en tu terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Luego agrega en Vercel:
```
SESSION_SECRET = [el valor generado]
```

### 3. DATABASE_URL (IMPORTANTE)
⚠️ **SQLite no funciona en Vercel serverless**

Tienes 2 opciones:

#### Opción A: Turso (SQLite en la nube - RECOMENDADO)
1. Crea cuenta en https://turso.tech
2. Crea una base de datos
3. Copia la URL de conexión
4. En Vercel agrega:
```
DATABASE_URL = libsql://tu-base-de-datos.turso.io
TURSO_AUTH_TOKEN = tu-token-de-turso
```

#### Opción B: Vercel Postgres
1. En Vercel Dashboard → Storage → Create Database → Postgres
2. Vercel agregará automáticamente las variables

## 🔍 Cómo agregar variables en Vercel

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto "barkley-instituto"
3. Ve a "Settings" → "Environment Variables"
4. Haz clic en "Add New"
5. Para cada variable:
   - Name: el nombre (ej: NODE_ENV)
   - Value: el valor
   - Environment: selecciona "Production", "Preview", y "Development"
6. Haz clic en "Save"

## 🚀 Después de configurar

1. Ve a "Deployments"
2. Encuentra el último deployment
3. Haz clic en los 3 puntos ⋮
4. Selecciona "Redeploy"
5. Marca "Use existing Build Cache" si está disponible
6. Haz clic en "Redeploy"

---

**¿Problemas?** Comparte los logs completos del deployment aquí.
