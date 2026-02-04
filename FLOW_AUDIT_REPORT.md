# 🔍 Auditoría de Seguridad y Funcionalidad - Flow.cl Integration

**Fecha:** 2026-02-05  
**Auditor:** Senior Developer Review  
**Estado General:** ⚠️ **FUNCIONAL CON PROBLEMAS CRÍTICOS DE SEGURIDAD**

---

## 🚨 PROBLEMAS CRÍTICOS (Deben solucionarse AHORA)

### 1. **WEBHOOK SIN VALIDACIÓN DE FIRMA** - CRÍTICO
**Archivo:** `server/flowRoutes.ts` línea 88-144  
**Problema:** El webhook `/api/flow/confirm` NO valida la firma de Flow  
**Riesgo:** Cualquiera puede enviar POST y marcar pagos como completados  
**Impacto:** Fraude, pagos falsos, pérdida de dinero  

**Ataque posible:**
```bash
curl -X POST https://tu-sitio.com/api/flow/confirm \
  -d '{"token":"FAKE_TOKEN"}' \
  -H "Content-Type: application/json"
```

**Solución requerida:**
- Validar firma en cada request del webhook
- Usar `flowService.validateSignature()`
- Rechazar requests con firma inválida

---

### 2. **LOGS SENSIBLES EN PRODUCCIÓN** - ALTO RIESGO
**Archivos:**
- `server/flowService.ts` líneas 118-121, 130-131, 143
- `client/src/pages/PaymentResult.tsx` líneas 12-13

**Problema:** API Keys y datos sensibles en logs  
**Riesgo:** Exposición de credenciales en logs de producción  

**Solución:**
```typescript
if (process.env.NODE_ENV !== 'production') {
  console.log('Debug info...');
}
```

---

### 3. **URL DE RETORNO INCORRECTA** - FUNCIONALIDAD ROTA
**Archivo:** `server/flowRoutes.ts` línea 42  
**Problema:** `urlReturn` no incluye el token como parámetro  
**Impacto:** Usuario ve "Token no encontrado" después de pagar  

**Actual:**
```typescript
const urlReturn = `${baseUrl}/payment-result`;
```

**Debe ser:**
```typescript
const urlReturn = `${baseUrl}/payment-result?token={{token}}`;
```
Flow reemplaza `{{token}}` con el token real.

---

## ⚠️ PROBLEMAS IMPORTANTES (Deben solucionarse pronto)

### 4. **FALTA TIMEOUT EN REQUESTS**
**Archivo:** `server/flowService.ts` líneas 133-141  
**Problema:** Requests sin timeout pueden colgar indefinidamente  
**Solución:**
```typescript
const response = await axios.post(url, data, {
  timeout: 30000, // 30 segundos
  headers: { ... }
});
```

---

### 5. **NO SE GUARDA paymentAmount**
**Archivo:** `server/flowRoutes.ts` línea 62-69  
**Problema:** Campo `paymentAmount` nunca se guarda en BD  
**Impacto:** No hay registro del monto pagado  

**Solución:**
```typescript
await db.update(reservations).set({
  paymentStatus: "pending",
  flowOrder: paymentData.flowOrder.toString(),
  flowToken: paymentData.token,
  paymentAmount: amount, // <-- Agregar esto
})
```

---

### 6. **FALTA VALIDACIÓN DE EMAIL**
**Archivo:** `client/src/components/ReservationDialog.tsx`  
**Problema:** No valida que el email sea real antes de enviar a Flow  
**Impacto:** Flow rechaza emails inválidos, usuario ve error confuso  

**Solución:**
- Validar formato de email más estrictamente
- Agregar lista de dominios válidos
- Mostrar mensaje claro al usuario

---

### 7. **NO HAY MANEJO DE IDEMPOTENCIA**
**Archivo:** `server/flowRoutes.ts` línea 10-83  
**Problema:** No verifica si ya existe un pago para esa reserva  
**Impacto:** Podría crear pagos duplicados  

**Solución:**
```typescript
// Verificar si ya existe un pago
if (reservation.flowOrder) {
  return res.status(400).json({ 
    message: "Ya existe un pago en proceso para esta reserva" 
  });
}
```

---

### 8. **CAMPO optional COMENTADO**
**Archivo:** `server/flowRoutes.ts` líneas 53-58  
**Problema:** Datos adicionales no se envían a Flow  
**Impacto:** Pérdida de contexto sobre el pago  

**Solución:** Descomentar y enviar datos opcionales

---

## 📝 PROBLEMAS MENORES (Mejoras de calidad)

### 9. **FALTA POLLING EN PaymentResult**
**Archivo:** `client/src/pages/PaymentResult.tsx`  
**Problema:** Una sola verificación, si el webhook no llegó, muestra error  
**Solución:** Hacer polling cada 2-3 segundos por 30 segundos

---

### 10. **REDIRECCIÓN BRUTAL**
**Archivo:** `client/src/components/ReservationDialog.tsx` línea 232  
**Problema:** `window.location.href` pierde estado de la app  
**Solución:** Abrir en nueva ventana o mejor UX

---

### 11. **FALTA ÍNDICE EN flowOrder**
**Problema:** Búsquedas lentas en webhook  
**Solución:**
```sql
CREATE INDEX idx_flow_order ON reservations(flow_order);
```

---

## ✅ ASPECTOS POSITIVOS

1. ✅ Firma de seguridad HMAC-SHA256 implementada correctamente
2. ✅ Tipos TypeScript bien definidos
3. ✅ Manejo de errores con try-catch
4. ✅ Formato form-urlencoded correcto
5. ✅ Estados de pago bien mapeados
6. ✅ UI/UX clara y profesional
7. ✅ Flujo de dos pasos bien implementado

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### **FASE 1: URGENTE (Hacer HOY)**
1. ✅ Agregar validación de firma en webhook
2. ✅ Corregir URL de retorno con token
3. ✅ Remover logs sensibles en producción

### **FASE 2: IMPORTANTE (Esta semana)**
4. ✅ Agregar timeout a requests
5. ✅ Guardar paymentAmount en BD
6. ✅ Implementar idempotencia
7. ✅ Validar emails correctamente

### **FASE 3: MEJORAS (Próxima semana)**
8. ✅ Implementar polling en PaymentResult
9. ✅ Agregar índices en BD
10. ✅ Descomentar campo optional
11. ✅ Mejorar UX de redirección

---

## 📊 SCORE DE SEGURIDAD

| Aspecto | Score | Estado |
|---------|-------|--------|
| **Seguridad** | 4/10 | ⚠️ Crítico |
| **Funcionalidad** | 7/10 | ⚠️ Con bugs |
| **Performance** | 6/10 | 🟡 Aceptable |
| **Código** | 7/10 | 🟡 Bueno |
| **UX** | 8/10 | ✅ Bien |

**Score Total: 6.4/10** - ⚠️ Requiere mejoras urgentes

---

## 🔧 ¿ESTÁ LISTO PARA PRODUCCIÓN?

### ❌ **NO** - Por las siguientes razones:

1. Webhook sin validación = Riesgo de fraude
2. URL de retorno rota = UX rota
3. Logs sensibles = Riesgo de seguridad

### ✅ **Puede estar listo DESPUÉS de:**

1. Implementar validación de firma en webhook
2. Corregir URL de retorno
3. Limpiar logs de producción

**Tiempo estimado de corrección:** 2-3 horas de trabajo

---

## 📞 CONTACTO

Para cualquier duda sobre esta auditoría, contactar al equipo de desarrollo.

**Próxima revisión recomendada:** Después de implementar FASE 1
