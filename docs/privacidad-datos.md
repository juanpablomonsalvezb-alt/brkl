# Inventario de datos personales — Barkley Instituto

Marco: Ley 21.719 (Chile) de protección de datos personales. Público: estudiantes
menores de edad y sus apoderados. Este documento describe **lo que el código hace
hoy** (rama `vortice/privacidad`); las retenciones marcadas "propuesta" no están
implementadas salvo donde se indica.

## Hallazgo transversal: `isAdmin` no protege nada

`server/routes.ts:111-114` — el middleware `isAdmin` llama `next()` sin verificar
("DEV MODE: Allow all access"). Todo endpoint marcado "Admin only" queda abierto a
cualquier usuario **autenticado** (si además usa `isAuthenticated`) o a **cualquiera**
(si solo usa `isAdmin` o nada). Afecta directamente a reservas (RUT, adjuntos) e
inscripciones PAES. Es el riesgo de privacidad más grave del inventario y precede a
cualquier política de retención.

## Inventario

| Tabla / flujo | Datos personales | Para qué | Quién accede (según código) | Retención actual | Retención propuesta | Riesgos |
|---|---|---|---|---|---|---|
| `waitlist_signups` (`shared/schema.ts:13`) — `POST /api/waitlist` (`server/routes.ts:215`) y chatbot de ventas (`server/salesChatRoutes.ts:169`) | email, nombre, nivel de interés, `learningProfileInterest` (TDAH/dislexia/TEA/motor), notas libres | Lista de espera pre-lanzamiento; avisar al equipo y confirmar al inscrito | Sin endpoint de lectura en el código: solo acceso directo a la base (Turso). Copia por correo a `NOTIFY_EMAIL` vía Resend (`server/notify.ts:3`); confirmación al inscrito (`server/notify.ts:48`) | Indefinida | Hasta inicio de matrícula 2027 + 6 meses, o hasta que se convierta en matrícula; borrar el resto | `learningProfileInterest` es dato de salud/neurodivergencia (dato sensible) de posibles menores; notas libres pueden contener cualquier cosa; el correo interno interpola valores sin escapar HTML (`server/notify.ts:16-20`) |
| `funnel_events` (`shared/schema.ts:35`) — `POST /api/track` (`server/routes.ts:204`) | Ninguno directo: paso, ruta, dominio de origen, id aleatorio por pestaña. Sin IP ni cookies | Medir conversión del formulario | Solo base de datos | Indefinida → **implementada: 12 meses** (`server/retencion.ts`, `purgarEventosEmbudoViejos`) | 12 meses | Bajo; `path` llega del cliente (máx. 200 chars) y podría traer query string si el cliente la mandara |
| `reservations` (`shared/schema.ts:396`) — `POST /api/reservations` público (`server/routes.ts:1823`) | Nombre, RUT, email, teléfono, fecha de nacimiento, edad del alumno; nombre/RUT/email del apoderado; **adjunto** (certificado, cédula) en base64 en la propia fila (`attachmentData`); datos de pago Flow (orden, token, monto) | Reserva / inscripción y pago | `GET /api/reservations`, `/:id`, `/:id/attachment`, `PATCH`, `DELETE` con `isAuthenticated, isAdmin` (`server/routes.ts:1865-1930`) → cualquier usuario autenticado por el hallazgo de arriba. El listado excluye el adjunto (`server/storage.ts:576-579`), `/:id` no. Correo interno con nombre, email, teléfono (`server/routes.ts` en el handler). Email del alumno se envía a Flow (`server/flowRoutes.ts:14`) | Indefinida | Activa durante la matrícula + plazo legal/contable; adjunto: borrar tras verificarlo (p. ej. 90 días); reservas no convertidas: 12 meses | RUT + cédula de menores en una sola fila; adjunto en la base (no en almacenamiento con control de acceso propio); acceso efectivo de cualquier usuario logueado |
| `users` (`shared/models/auth.ts:19`) — login Replit OIDC (`server/replit_integrations/auth/replitAuth.ts:136`) | email, nombre, apellido, foto de perfil, proveedor | Identificar la cuenta | Servidor; `/api/auth/*` | Indefinida | Mientras la cuenta esté activa + 1 año tras egreso | Cuentas de menores |
| `sessions` (`shared/models/auth.ts:7`) | id de sesión y payload | Sesión de login | Servidor. En la práctica se usa un `MemoryStore` en memoria (`replitAuth.ts:33`) con TTL 1 semana (`replitAuth.ts:105`); la tabla se crea pero no es el store | Memoria del proceso, se limpia cada hora | Sin cambio | — |
| `user_profiles` (`shared/schema.ts:69`) | userId, rol, nivel | Rol y curso del estudiante | Servidor; `GET /api/profile` (`server/routes.ts:396`) | Indefinida | Igual que `users` | Bajo |
| `enrollments`, `student_progress` (`shared/schema.ts:184`, `:193`) | Matrícula y recursos completados por userId | Avance académico | Servidor / dashboard del propio estudiante | Indefinida | Año académico + plazo de certificación | Historial académico de menores |
| `evaluation_progress` (`shared/schema.ts:155`) — `POST /api/evaluations/:id/submit` (`server/routes.ts:1532`) y `/complete` (`:936`) | Puntaje, aprobado, y **`answersJson`**: el arreglo `answers` del cliente se guarda tal cual (`JSON.stringify(answers)`), sin límite de tamaño ni de forma | Registrar el resultado | Servidor | Indefinida | Puntaje: año académico + certificación. `answersJson`: 6 meses (o guardar solo `{questionId, answer}` validados) | El cliente puede guardar cualquier contenido en `answersJson`; no hay lectura de ese campo en el código, por lo que su utilidad actual no está demostrada |
| `together_presence` (`shared/schema.ts:830`) — `POST /api/together/heartbeat` (`server/routes.ts:259`) | Nombre visible (texto libre, máx. 40), materia, sala, `clientId` aleatorio de `localStorage` | Mostrar quién está en la sala de estudio | Público: `GET /api/together/presence` (`server/routes.ts:281`) devuelve nombre y materia de quien latió en los últimos 30 s | Antes: indefinida y con columna `email` (siempre `""`). **Ahora: sin `email` (migración 0002) y borrado a 1 hora en cada latido** (`server/routes.ts:274`, `server/retencion.ts`) | 1 hora (implementada) | El nombre es libre: un menor puede escribir su nombre real y es visible para cualquiera en la sala |
| `paes_subscriptions` (`shared/schema.ts:782`) — `POST /api/paes/subscriptions` (`server/paesRoutes.ts:248`) | Nombre, email, teléfono del estudiante, plan, precio, notas | Inscripción PAES | `GET /api/admin/paes/subscriptions` (`server/paesRoutes.ts:233`) **sin ningún middleware**: público | Indefinida | Ciclo PAES + 6 meses | Listado completo de inscritos expuesto sin autenticación |
| Chat de ventas — `POST /api/chat/sales` (`server/salesChatRoutes.ts:200`) | Mensaje + últimos 10 turnos (`:225`) enviados por el cliente; si el modelo llama `registrar_interesado`, nombre/email/nivel van a `waitlist_signups` | Responder dudas y captar interesados | Se envía a Groq (`server/salesChatRoutes.ts:11`, tercero fuera de Chile). **No se persiste** en la base | No se guarda | Sin cambio | Transferencia internacional a un proveedor de IA; el registro en lista de espera lo decide el modelo |
| Copiloto académico — `POST /api/academic-copilot/chat` (`server/routes.ts:2134`) | Mensaje e historial enviados a Gemini (`server/geminiChat.ts`) | Ayuda académica | Google (tercero). No se persiste | No se guarda | Sin cambio | Transferencia internacional; sin autenticación |
| `conversations`, `messages` (`shared/models/chat.ts:5`, `:11`) | Texto de conversaciones | Integración Replit | `registerChatRoutes` existe pero **no se registra** en ninguna parte: tablas sin escritura activa | — | Eliminar tablas si están vacías | — |

## Implementado en esta rama

- `together_presence.email` eliminado: el cliente nunca lo enviaba y el servidor siempre guardaba `""`.
- `server/retencion.ts`: `purgarPresenciaVieja` (1 h) y `purgarEventosEmbudoViejos` (12 meses), idempotentes, `db` como parámetro. Probadas en `script/vortice-db.check.ts` (`npm run check:vortice`).
- La presencia se purga en cada latido. **La purga del embudo no está programada**: falta un cron (p. ej. Vercel Cron) que llame `purgarEventosEmbudoViejos(db)`.

## SQL pendiente (NO aplicado)

`migrations/0002_together_sin_email.sql`:

```sql
ALTER TABLE `together_presence` DROP COLUMN `email`;
```

- `migrations/0001_linea_base_db_push.sql` es solo línea base: el snapshot `0000` estaba
  desactualizado respecto de lo que producción tiene vía `npm run db:push`. **No ejecutarla**
  contra producción (crea tablas que ya existen).
- Orden: aplicar 0002 junto con el despliegue del código. Entre ambos, el latido falla en
  silencio (el handler responde 204 igual) y la presencia se recupera sola en el siguiente latido.
- Opcional, limpieza inicial de presencia vieja: `DELETE FROM together_presence WHERE last_seen < unixepoch() - 3600;`

## Pendientes recomendados (no implementados)

1. Reactivar la verificación de `isAdmin` y proteger `/api/admin/paes/*`.
2. Sacar los adjuntos de reservas de la base a almacenamiento privado con expiración.
3. Validar y acotar `answersJson`.
4. Escapar HTML en `notifyByEmail`.
5. Programar la purga del embudo y definir con el equipo las retenciones "propuesta".
