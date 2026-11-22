# Área: calendario 2027 por nivel
**Archivos:** `shared/calendario2027.ts`, `server/calendario2027Db.ts`, `scripts/calendario2027-opciones.ts`, `scripts/aplicar-calendario-2027.ts`. Protegido: `server/calendarUtils.ts` (solo importar).
**Invariantes:** cierre 15-oct (general) y 15-sep (4.º medio); inicio 8-mar-2027; viernes de evaluación por días civiles; recesos y feriados son SUPUESTOS hasta la resolución oficial del Mineduc.
**Pruebas:** `script/calendario2027.check.ts`, `calendario2027-db.check.ts`.
**Pendiente:** decidir cómo acortar el ciclo (sin recesos 32 semanas caben justo; con recesos faltan ~3). Aplicar a `program_calendar` solo con autorización.
