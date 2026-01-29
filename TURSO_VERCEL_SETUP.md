# 🚀 Deploy con Vercel + Turso (SQLite en la nube)

## ✅ Por qué esta combinación:

- ✅ **100% GRATIS** permanente
- ✅ **SQLite real** (misma sintaxis que usabas)
- ✅ **9GB storage** (6000x tu tamaño actual de 1.5MB)
- ✅ **500M reads/mes** (más que suficiente)
- ✅ **Deploy automático** desde GitHub
- ✅ **Cambios mínimos** en el código (ya hechos ✅)

---

## 📋 Paso 1: Crear cuenta en Turso (5 minutos)

### 1.1 Instalar Turso CLI

**En tu computadora local:**

#### macOS/Linux:
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

#### Windows (PowerShell):
```bash
powershell -c "irm get.tur.so/install.ps1 | iex"
```

### 1.2 Crear cuenta
```bash
turso auth signup
```

Esto abrirá tu navegador para crear cuenta (gratis, sin tarjeta).

### 1.3 Iniciar sesión
```bash
turso auth login
```

---

## 📋 Paso 2: Crear base de datos en Turso (2 minutos)

### 2.1 Crear la base de datos
```bash
turso db create brkl-db
```

### 2.2 Obtener URL de conexión
```bash
turso db show brkl-db --url
```

**Copia esta URL**, se verá así:
```
libsql://brkl-db-tu-usuario.turso.io
```

### 2.3 Crear token de autenticación
```bash
turso db tokens create brkl-db
```

**Copia este token**, se verá así:
```
eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Paso 3: Migrar datos a Turso (5 minutos)

### 3.1 Configurar variables locales temporalmente

Crea un archivo `.env.local`:
```bash
TURSO_DATABASE_URL=libsql://brkl-db-tu-usuario.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
SESSION_SECRET=cualquier-string-secreto-aqui
```

### 3.2 Ejecutar migraciones

```bash
# Pushear el esquema a Turso
npx drizzle-kit push
```

Esto creará todas las tablas en tu base de datos Turso.

### 3.3 (Opcional) Importar datos existentes

Si tienes datos en tu SQLite local que quieres migrar:

```bash
# Exportar datos de SQLite local
sqlite3 taskManagement.db .dump > backup.sql

# Importar a Turso
turso db shell brkl-db < backup.sql
```

---

## 📋 Paso 4: Configurar Vercel (5 minutos)

### 4.1 Ve a tu proyecto en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto **brkl**
3. Ve a **Settings** → **Environment Variables**

### 4.2 Agregar variables de entorno

Agrega estas 3 variables (una por una):

#### Variable 1: TURSO_DATABASE_URL
```
Name: TURSO_DATABASE_URL
Value: libsql://brkl-db-tu-usuario.turso.io
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 2: TURSO_AUTH_TOKEN
```
Name: TURSO_AUTH_TOKEN
Value: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 3: SESSION_SECRET
```
Name: SESSION_SECRET
Value: (genera uno con: openssl rand -hex 32)
Environments: ✅ Production ✅ Preview ✅ Development
```

### 4.3 Guardar
Haz clic en **"Save"** para cada variable.

---

## 📋 Paso 5: Deploy! (2 minutos)

### 5.1 Subir cambios a GitHub

Los cambios ya están listos en tu código. Solo haz push:

```bash
git add .
git commit -m "feat: Migrate to Turso for Vercel deployment"
git push origin main
```

### 5.2 Vercel detectará automáticamente

Vercel iniciará un nuevo deployment automáticamente.

### 5.3 Verificar deployment

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a "Deployments"
4. Espera a que termine (2-3 minutos)
5. ¡Haz clic en el link de tu app! 🎉

Tu app estará en: `https://tu-proyecto.vercel.app`

---

## 🔍 Verificar que funciona

### Probar conexión a Turso localmente

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

Debería conectarse a Turso sin problemas.

---

## 🛠️ Comandos útiles de Turso

```bash
# Ver tus bases de datos
turso db list

# Abrir shell SQL
turso db shell brkl-db

# Ver información de la DB
turso db show brkl-db

# Ver uso actual
turso db show brkl-db --usage

# Crear backup
turso db shell brkl-db .dump > backup.sql

# Ver regiones disponibles
turso db locations
```

---

## 💰 Límites del tier gratuito

| Recurso | Límite Gratis | Tu uso actual |
|---|---|---|
| **Storage** | 9 GB | 1.5 MB (0.02%) |
| **Rows read** | 500M/mes | Bajo |
| **Rows written** | 10M/mes | Bajo |
| **Databases** | 3 | 1 |
| **Locations** | 3 regiones | 1 |

**Estás MUY por debajo de los límites.** No te preocupes por quedarte sin espacio.

---

## 🔄 Actualizaciones futuras

Cada vez que hagas cambios:

1. **Actualizar código:**
   ```bash
   git add .
   git commit -m "tu mensaje"
   git push origin main
   ```

2. **Vercel deployará automáticamente** ✅

3. **Si cambias el esquema de base de datos:**
   ```bash
   npx drizzle-kit push
   ```

---

## 🆘 Solución de problemas

### Error: "Failed to connect to Turso"

- Verifica que las variables de entorno estén correctas en Vercel
- Asegúrate de que el token no haya expirado

### Error en el build de Vercel

- Ve a los logs del deployment en Vercel
- Busca el error específico
- Compártelo para ayudarte

### Regenerar token si expira

```bash
turso db tokens create brkl-db
```

Luego actualiza la variable `TURSO_AUTH_TOKEN` en Vercel.

---

## 🔗 Enlaces útiles

- **Turso Dashboard**: https://turso.tech/app
- **Turso Docs**: https://docs.turso.tech
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Drizzle Docs (Turso)**: https://orm.drizzle.team/docs/get-started-sqlite#turso

---

## 🎉 ¡Listo!

Tu app está en la nube con:
- ✅ Backend en Vercel
- ✅ Base de datos SQLite en Turso
- ✅ Deploy automático desde GitHub
- ✅ 100% gratis

**URL de tu app:** `https://tu-proyecto.vercel.app`

¡Disfruta de tu aplicación en producción! 🚀
