# Área: calendario 2027 por nivel
**Archivos:** `shared/calendario2027.ts`, `server/calendario2027Db.ts`, `scripts/calendario2027-opciones.ts`, `scripts/aplicar-calendario-2027.ts`. Protegido: `server/calendarUtils.ts` (solo importar).
**Invariantes:** cierre 15-oct (general) y 15-sep (4.º medio); inicio 8-mar-2027; viernes de evaluación por días civiles; **sin recesos ni feriados por política (2026-11-23): Barkley es asincrónico y no los considera** (`holidays: []`, `breaks: []`); la resolución del Mineduc solo importa para las fechas de las pruebas de exámenes libres que sustentan el cierre.
**Pruebas:** `script/calendario2027.check.ts`, `calendario2027-db.check.ts`.
**Pendiente:** aplicar a `program_calendar` solo con autorización. El ciclo ya está decidido desde el 2026-11-21 (sin recesos: 32 semanas caben justo para `1b` a `3m`; `4m` con 12 módulos cierra el 3-sep).
