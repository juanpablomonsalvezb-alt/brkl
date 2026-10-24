# Verificación prioritaria: autorización administrativa y registros de API

**Estado:** análisis estático de código publicado; requiere validación del responsable técnico.  
**Rama inspeccionada:** `vortice/integracion`  
**Rama documental:** `docs/p0-e-maestro`  
**Fecha:** 2026-10-24

## Resultado ejecutivo

La lectura directa de los archivos publicados confirma dos señales de riesgo que merecen revisión inmediata antes de implementar P0-E:

1. En `server/routes.ts`, el middleware `isAdmin` ejecuta `next(); return;` antes de la comprobación de identidad y rol, que queda comentada. En ese middleware, la autorización administrativa no se aplica.
2. En `server/index.ts`, un middleware de registro sustituye `res.json` y registra el cuerpo completo de las respuestas de rutas `/api` cuando termina cada petición. Si una respuesta incluye puntuaciones, respuestas correctas, explicaciones, datos personales u otros datos sensibles, estos podrían copiarse a los registros de aplicación.

Estos hallazgos son de código estático. No se ha comprobado el despliegue activo, la configuración de logs, las rutas concretas que usan `isAdmin`, ni quién puede leer los registros. No se afirma que exista explotación confirmada. Aun así, por su impacto potencial, deben tratarse como bloqueantes para una revisión de seguridad antes de liberar cambios relacionados con evaluaciones.

## Hallazgo A — middleware administrativo permite continuar sin verificar rol

**Archivo:** [`server/routes.ts`](https://github.com/juanpablomonsalvezb-alt/brkl/blob/vortice/integracion/server/routes.ts)  
**Símbolo:** `isAdmin`

El middleware contiene este patrón:

```ts
const isAdmin: RequestHandler = async (req: any, res, next) => {
  // DEV MODE: Allow all access
  next();
  return;

  /*
  // ... obtiene identidad, consulta perfil y exige profile.role === "admin"
  */
};
```

### Impacto potencial

Si las rutas administrativas confían en este middleware y no existe otro control de autorización equivalente, la petición continúa sin verificar que el usuario tenga rol de administrador. El comentario “DEV MODE” no es un control de seguridad por sí mismo.

### Lo que falta confirmar

- Inventario completo de rutas que incorporan `isAdmin`.
- Si `isAuthenticated` se aplica antes de cada una y si eso solo autentica (no autoriza).
- Configuración real del entorno desplegado y si esta rama corresponde al artefacto en producción.
- Si existe una segunda autorización en handlers o servicios.
- Qué operaciones pueden ejecutarse a través de esas rutas.

### Verificación segura recomendada

1. Inspeccionar estáticamente cada uso de `isAdmin` y documentar método, ruta, autenticación previa, autorización adicional y efecto.
2. Confirmar con el responsable de despliegue qué commit está desplegado y en qué entornos.
3. En un entorno local aislado y con datos ficticios, añadir pruebas negativas para petición anónima, usuario autenticado no administrador y administrador autorizado.
4. No probar el hallazgo contra producción ni modificar el middleware hasta contar con autorización específica y plan de revisión.

## Hallazgo B — el middleware de logging registra cuerpos JSON completos

**Archivo:** [`server/index.ts`](https://github.com/juanpablomonsalvezb-alt/brkl/blob/vortice/integracion/server/index.ts)

El middleware de registro envuelve `res.json`, conserva el objeto de respuesta y, al finalizar la petición, concatena `JSON.stringify(capturedJsonResponse)` en el registro para rutas que comienzan por `/api`.

### Impacto potencial

Los cuerpos de respuesta podrían incluir datos que no deberían replicarse en logs. En el flujo de evaluaciones inspeccionado, la ruta de envío devuelve puntuación, número de correctas y resultados por pregunta, incluidos `correctAnswer` y `explanation`. Por tanto, la lógica de logging puede registrar información académica detallada, además de cualquier otro dato sensible que devuelvan otras APIs.

El riesgo depende también de dónde se envían los logs, su retención, acceso, redacción y uso en observabilidad. Esos controles no se verificaron.

### Verificación segura recomendada

1. Identificar el destino de logs, permisos de acceso, retención y exportaciones.
2. Revisar todas las respuestas API que pueden incluir información personal, evaluaciones, tokens, credenciales o datos de soporte.
3. Definir una política de logging por lista permitida: método, ruta normalizada, código HTTP, duración y un identificador de correlación; evitar registrar cuerpos completos por defecto.
4. Redactar explícitamente campos sensibles y añadir pruebas que impidan su aparición en logs.
5. Revisar registros existentes de acuerdo con las políticas de privacidad y retención aplicables; no copiar ni exportar datos reales para esta revisión.

## Hallazgo C — la respuesta de evaluación contradice la revisión diferida P0-E

**Archivo:** [`server/routes.ts`, envío de evaluación](https://github.com/juanpablomonsalvezb-alt/brkl/blob/vortice/integracion/server/routes.ts#L1935-L1994)  
**Cliente:** [`EvaluationQuiz.tsx`](https://github.com/juanpablomonsalvezb-alt/brkl/blob/vortice/integracion/client/src/components/EvaluationQuiz.tsx)

El servidor devuelve información detallada de resultados y el cliente presenta puntuaciones y revisión por pregunta. Esto entra en conflicto con la especificación P0-E: resultado inmediato solo «Aprobado» / «No aprobado», con revisión diferida hasta `review_at = T + 49 h`.

Este hallazgo es independiente del logging: aunque se limitara lo que se registra, el contrato de respuesta seguiría necesitando adecuación a la especificación ratificada.

## Orden recomendado

1. **Contener y verificar el control administrativo** antes de habilitar operaciones sensibles.
2. **Evaluar la exposición de datos en logs** y reducir el registro de cuerpos completos mediante un cambio aprobado.
3. **Ratificar y corregir el contrato de respuestas de evaluación** para impedir exposición prematura desde el servidor y la interfaz.
4. Revisar las rutas de HTML, formularios externos y repaso recogidas en el [Anexo de riesgos de seguridad P0-E](https://github.com/juanpablomonsalvezb-alt/brkl/blob/docs/p0-e-maestro/docs/P0-E/ANEXO_RIESGOS_SEGURIDAD_P0E.md).

## Gobernanza

Este documento no autoriza correcciones. No se modificó código, base de datos, migraciones ni configuración; no se ejecutaron pruebas ni se accedió a producción. Cualquier cambio de código, commit, push, merge o despliegue requiere autorización explícita e independiente.
