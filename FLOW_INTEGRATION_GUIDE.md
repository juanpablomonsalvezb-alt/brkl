# Guía de Integración Flow.cl - Instituto UCE

## ✅ Integración Completada

La integración con Flow.cl ha sido implementada exitosamente en tu sistema de reservas. Aquí está todo lo que necesitas saber:

## 📋 Lo que se ha implementado

### 1. **Servicio de Flow.cl** (`server/flowService.ts`)
   - Creación de pagos
   - Verificación de estado de pagos
   - Generación de firmas de seguridad
   - Validación de respuestas

### 2. **Rutas API** (`server/flowRoutes.ts`)
   - `POST /api/flow/create-payment` - Crea un pago en Flow
   - `POST /api/flow/confirm` - Webhook para confirmación de pagos
   - `GET /api/flow/payment-status/:token` - Consulta estado de pago

### 3. **Base de Datos** (`shared/schema.ts`)
   Se agregaron campos a la tabla `reservations`:
   - `paymentStatus`: Estado del pago (pending, completed, failed, cancelled)
   - `flowOrder`: Número de orden de Flow
   - `flowToken`: Token del pago
   - `paymentDate`: Fecha de pago completado
   - `paymentAmount`: Monto pagado en CLP

### 4. **Componente de Reserva** (`client/src/components/ReservationDialog.tsx`)
   - Flujo de dos pasos: Crear reserva → Pagar
   - Botón "Pagar Ahora con Flow"
   - Opción "Pagar después"
   - Integración con API de Flow

### 5. **Página de Resultado** (`client/src/pages/PaymentResult.tsx`)
   - Verificación automática del pago
   - Muestra estado: éxito, error o procesando
   - Redirección apropiada

## 🔧 Configuración Necesaria

### Paso 1: Obtener Credenciales de Flow.cl

1. **Registrarse en Flow.cl**
   - Sandbox (pruebas): https://sandbox.flow.cl
   - Producción: https://www.flow.cl

2. **Obtener API Key y Secret Key**
   - Inicia sesión en tu cuenta Flow
   - Ve a **"Configuración"** → **"API"**
   - Copia tu `API Key` y `Secret Key`

### Paso 2: Configurar Variables de Entorno

Crea o edita el archivo `.env` en la raíz del proyecto:

```bash
# Flow.cl Configuration
FLOW_API_KEY=tu-api-key-aqui
FLOW_SECRET_KEY=tu-secret-key-aqui
FLOW_API_URL=https://sandbox.flow.cl/api

# Para producción usa:
# FLOW_API_URL=https://www.flow.cl/api

# URL base de tu aplicación (para webhooks)
BASE_URL=http://localhost:3001
```

### Paso 3: Actualizar Base de Datos

Ejecuta la migración para agregar los nuevos campos:

```bash
npm run db:push
```

Si estás usando una base de datos remota, asegúrate de que las credenciales estén correctas en el archivo `.env`.

## 🚀 Cómo Funciona

### Flujo de Usuario:

1. **Usuario llena el formulario de inscripción**
   - Datos personales del alumno y apoderado
   - Selecciona curso y plan

2. **Se crea la reserva**
   - Se guarda en la base de datos con estado "pending"
   - Se muestra opción de pagar

3. **Usuario hace clic en "Pagar Ahora con Flow"**
   - Se crea un pago en Flow.cl
   - Usuario es redirigido a la página de pago de Flow
   - Puede pagar con:
     - Tarjetas de crédito/débito
     - Transferencia bancaria
     - Otros métodos disponibles en Flow

4. **Usuario completa el pago en Flow**
   - Flow procesa el pago
   - Flow envía confirmación a tu servidor (webhook)
   - Flow redirige al usuario a `/payment-result`

5. **Confirmación**
   - El webhook actualiza el estado de la reserva
   - La página de resultado muestra el estado del pago
   - Usuario recibe confirmación

## 🧪 Pruebas

### Ambiente Sandbox (Desarrollo)

Flow.cl proporciona tarjetas de prueba para sandbox:

**Tarjeta de prueba exitosa:**
```
Número: 4051 8842 3993 7763
CVV: 123
Fecha: Cualquier fecha futura
```

**Tarjeta de prueba rechazada:**
```
Número: 5186 0589 2551 3346
CVV: 123
Fecha: Cualquier fecha futura
```

### Probar el flujo completo:

1. Inicia el servidor: `npm run dev`
2. Ve a la página principal y haz clic en "Reservar Cupo"
3. Llena el formulario de inscripción
4. Haz clic en "Pagar Ahora con Flow"
5. Usa las tarjetas de prueba de sandbox
6. Verifica que el pago se confirma correctamente

## 📊 Panel de Administración

Para ver las reservas con su estado de pago:

1. Ve a `/reservations-admin` (requiere autenticación de admin)
2. Verás todas las reservas con:
   - Estado de la reserva
   - Estado del pago
   - Información de Flow (orden, token)
   - Fecha y monto del pago

## 🔐 Seguridad

- **Firmas HMAC-SHA256**: Todas las comunicaciones con Flow están firmadas
- **Validación de webhooks**: Se valida la firma de cada notificación
- **Tokens únicos**: Cada pago tiene un token único
- **HTTPS requerido**: En producción, Flow requiere HTTPS para webhooks

## 🌐 Producción

Para pasar a producción:

1. **Obtén credenciales de producción** en https://www.flow.cl
2. **Actualiza `.env`**:
   ```bash
   FLOW_API_KEY=tu-api-key-produccion
   FLOW_SECRET_KEY=tu-secret-key-produccion
   FLOW_API_URL=https://www.flow.cl/api
   BASE_URL=https://tu-dominio.com
   ```
3. **Configura el webhook en Flow**:
   - URL: `https://tu-dominio.com/api/flow/confirm`
   - Método: POST

## 📝 Precios de los Planes

Los precios están definidos en `ReservationDialog.tsx`:

```typescript
const plansByGroup = {
  basica: [
    { value: "basica_plataforma", price: "$480.000" },
    { value: "basica_mentor", price: "$708.480" },
  ],
  media1: [
    { value: "media1_plataforma", price: "$520.000" },
    { value: "media1_mentor", price: "$748.480" },
  ],
  // ... más planes
}
```

## 🆘 Solución de Problemas

### Error: "Flow.cl credentials not configured"
- Verifica que `FLOW_API_KEY` y `FLOW_SECRET_KEY` están en `.env`
- Reinicia el servidor después de agregar las credenciales

### Error: "HTTP 401" al crear pago
- Las credenciales son incorrectas
- Verifica que estás usando las credenciales correctas (sandbox vs producción)

### El webhook no se ejecuta
- Verifica que `BASE_URL` está configurado correctamente
- En desarrollo local, usa herramientas como ngrok para exponer tu servidor
- En producción, asegúrate de que la URL es accesible públicamente

### El pago no se actualiza
- Revisa los logs del servidor para ver si el webhook está llegando
- Verifica que la firma del webhook es válida
- Asegúrate de que la base de datos está actualizada con los nuevos campos

## 📞 Soporte

- **Flow.cl**: soporte@flow.cl
- **Documentación Flow**: https://www.flow.cl/docs

## ✨ Próximos Pasos

Ahora que Flow.cl está integrado, puedes:

1. ✅ Personalizar los mensajes de confirmación
2. ✅ Agregar envío de emails de confirmación
3. ✅ Crear reportes de pagos
4. ✅ Implementar reembolsos (Flow.cl lo soporta)
5. ✅ Agregar pagos recurrentes para suscripciones

---

**¡Integración completada!** 🎉

Para cualquier pregunta o problema, revisa los logs del servidor o contacta al equipo de desarrollo.
