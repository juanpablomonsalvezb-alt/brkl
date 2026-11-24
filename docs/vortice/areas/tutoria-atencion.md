# Área: tutoría humana y alertas de atraso

Actualizado 2026-11-24. Último commit de la serie: `02a77ef`.

## Qué existe
- **Estudiante** (`AyudaTutor.tsx`, tarjeta «¿Necesitas apoyo?» del Inicio): pide ayuda a una persona y ve la respuesta. `GET/POST /api/vortice/ayuda`. Tope de 5 casos sin cerrar.
- **Tutor** (`TutorBandeja.tsx`, ruta `/tutor`, sin enlace en menús): bandeja compartida. «Necesitan atención», «Sin asignar» y «Mis casos». El sostenedor es el tutor de todos.
- **Backend** (`server/tutoria.ts`): roles únicos por usuario (admin, student, tutor, guardian). Estados abierto, asignado, respondido, cerrado. `bandejaTutor`, `tomarCaso` (transición atómica, el segundo tutor recibe 409), `estudiantesQueNecesitanAtencion`. Rutas: `/api/tutoria/bandeja`, `/api/tutoria/atencion`, `/api/tutoria/casos/:id/{tomar,responder,cerrar}`. No se expone el correo.
- **Reglas** (`shared/atencion.ts`): aviso al estudiante a los 3 días sin actividad, atención del tutor y aviso al apoderado a los 5. Días civiles de Chile. Los días no hábiles no se descuentan (colegio asincrónico).
- **Cálculo** (`server/atencion.ts`): última actividad = máximo de `learning_events`, `student_progress`, `lesson_study_progress`, `evaluation_progress`, `reflection_responses`, `portfolio_evidences`. Inicio de medición = el más tardío entre la matrícula activa más antigua y el inicio del módulo 1; antes de eso no se mide.
- **Avisos** (`shared/notificaciones.ts`, `server/notificaciones.ts`): tipos `recordatorioInactividad` y `avisoInactividadApoderado`, activados por defecto, uno por semana. El apoderado solo recibe con vínculo `activo`.

## Pruebas
`script/atencion.check.ts`, `script/atencion.servidor.check.ts`, `script/notificaciones.check.ts`, `script/tutoria.check.ts`, paridad de migración en `script/migraciones-nuevas.check.ts`. Cada pieza se verificó con mutaciones.

## Límites y pendientes
- La práctica del mapa (`practice_sessions`, solo en migraciones SQL) y los bloques de la Brújula no cuentan como actividad.
- Una consulta por estudiante en `/api/tutoria/atencion`: paginar o precalcular si el colegio pasa de cientos.
- Migración `docs/vortice-migracion-incremental-avisos-inactividad.sql` **no aplicada** a ninguna base.
- El rol `tutor` del sostenedor no está asignado en ninguna base (hacerlo solo con la orden «PRODUCCION»).
- Nada probado con base ni login reales, solo SQLite en memoria y datos simulados.
- Falta `/code-review` y `/security-review` formales.
- Los vínculos de apoderado: existe una ruta de administración, no se vio pantalla.
