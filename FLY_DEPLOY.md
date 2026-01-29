# 🚀 Deploy en Fly.io (GRATIS)

## ✅ Por qué Fly.io:

- ✅ **GRATIS permanente** (3 VMs incluidas en tier gratuito)
- ✅ **NO se duerme** (siempre activo)
- ✅ **Muy rápido** (edge computing global)
- ✅ **SQLite con volumen persistente** (1GB gratis)
- ✅ **Deploy automático** con GitHub Actions (opcional)
- ⚠️ Requiere tarjeta de crédito (pero NO cobra si no excedes el límite gratis)

---

## 📋 Pasos para Deploy:

### 1. Instalar Fly CLI

**En tu computadora local:**

#### macOS/Linux:
```bash
curl -L https://fly.io/install.sh | sh
```

#### Windows (PowerShell):
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

### 2. Crear cuenta y autenticarte

```bash
# Crear cuenta (o login si ya tienes)
fly auth signup

# O si ya tienes cuenta:
fly auth login
```

Te pedirá agregar tarjeta de crédito (requerido pero NO cobrará nada en tier gratuito).

### 3. Clonar el repositorio localmente

```bash
git clone https://github.com/juanpablomonsalvezb-alt/brkl.git
cd brkl
```

### 4. Crear la app en Fly.io

```bash
# Esto creará la app y el volumen para SQLite
fly apps create brkl

# Crear volumen persistente para la base de datos
fly volumes create brkl_data --region iad --size 1
```

### 5. Configurar variables de entorno

```bash
# Generar un SESSION_SECRET seguro
fly secrets set SESSION_SECRET=$(openssl rand -hex 32)
```

### 6. Deploy!

```bash
fly deploy
```

Esto:
1. Construirá la imagen Docker
2. La subirá a Fly.io
3. Creará la VM
4. Montará el volumen para SQLite
5. Iniciará tu aplicación

### 7. Verificar que funciona

```bash
# Ver logs en vivo
fly logs

# Abrir la app en el navegador
fly open

# Ver el estado
fly status
```

Tu app estará en: `https://brkl.fly.dev`

---

## 🔄 Actualizaciones futuras

Cada vez que hagas cambios:

```bash
git pull origin main  # Si estás trabajando localmente
fly deploy            # Deploy de nuevo
```

---

## 🔧 Comandos útiles

```bash
# Ver logs en tiempo real
fly logs

# SSH a tu VM
fly ssh console

# Ver el estado de la app
fly status

# Ver volúmenes
fly volumes list

# Escalar (agregar más VMs si necesitas)
fly scale count 2

# Ver dashboard
fly dashboard
```

---

## 💾 Base de datos SQLite

La base de datos está montada en `/data/taskManagement.db` con persistencia permanente.

**No perderás tus datos** entre deploys porque está en un volumen separado.

---

## 💰 Límites del tier gratuito

- ✅ 3 VMs compartidas (256MB RAM cada una)
- ✅ 160GB ancho de banda/mes
- ✅ 3GB volumen persistente
- ✅ Certificado SSL gratis

**Más que suficiente para tu proyecto.**

---

## 🆘 Solución de problemas

### Si el deploy falla:

```bash
# Ver logs detallados
fly logs

# Verificar estado
fly status

# Reiniciar la app
fly apps restart brkl
```

### Si necesitas cambiar región:

```bash
# Listar regiones disponibles
fly platform regions

# Cambiar región (ejemplo: Santiago)
fly regions set scl
```

---

## 🔗 Enlaces útiles

- Dashboard: https://fly.io/dashboard
- Documentación: https://fly.io/docs
- Status: https://status.fly.io
- Pricing: https://fly.io/docs/about/pricing/

---

## 🎉 ¡Listo!

Tu app estará en: **https://brkl.fly.dev**

Siempre activa, rápida, y con SQLite funcionando perfectamente.
