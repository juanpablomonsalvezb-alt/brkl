# P0-E — Resultados de las pruebas técnicas T1–T5

**Script:** `script/p0e-t15.ts` (no forma parte de `check:vortice`).
**Base:** libsql local desechable (`turso dev`, mismo protocolo HTTP que Turso). El script se niega a correr contra hosts no locales.
**Alcance:** tablas de prueba con prefijo `t15_`, creadas y borradas en la base desechable. No se modificó el esquema de Vórtice, `brkl-preview` ni producción.

## Cómo reproducir

```bash
turso dev --db-file /tmp/p0e-t15.db --port 8099
T15_URL=http://127.0.0.1:8099 npx tsx script/p0e-t15.ts
```

`T15_REPS` cambia el número de repeticiones (por defecto 50).

## Qué verifica cada prueba

| ID | Verifica |
|---|---|
| T1 | Un `db.batch` con una sentencia que viola un índice único no deja ninguna escritura (rollback completo). |
| T2a | 20 inicios simultáneos dejan un único intento `en_curso` (índice único parcial). |
| T2b | 20 envíos simultáneos del último intento permitido dejan 1 envío, 1 progreso y 1 cierre por agotamiento. |
| T2c | Aprobación + 10 intentos concurrentes de abrir y enviar: exactamente 1 cierre (causa `aprobacion`, intento que aprobó), 1 intento enviado, 1 progreso, **0 intentos abiertos**; después del cierre, un inicio y un envío nuevos **no registran nada**. |
| T2d | El mismo `submission_id` enviado 10 veces deja una sola fila (idempotencia). |
| T3 | El `CHECK` de estado y el índice único parcial rechazan datos inválidos y aceptan los válidos. |
| T4 | T = 23:59 hora de Chile y extensión de 48 h reales, en fechas de cambio de horario 2026–2027. |
| T5 | Desfase de reloj entre la aplicación y libsql. |

## Salida de la última ejecución

```
fecha: 2026-10-26T19:25:52Z
node: v20.20.0  sqld: turso dev (libsql local, HTTP)
comando: T15_URL=http://127.0.0.1:8099 npx tsx script/p0e-t15.ts

T1 atomicidad de db.batch: 50/50 sin escrituras parciales
T2a 20 inicios simultáneos: 50/50 con un único intento en curso
T2b 20 envíos simultáneos del último intento: 50/50 con 1 envío, 1 progreso y 1 cierre
T2c aprobación + 10 intentos concurrentes: 50/50 con 1 cierre (aprobación, intento a1), 1 enviado, 1 progreso, 0 abiertos, sin inicio ni envío posteriores (0 intentos abiertos en la carrera quedaron "vencido")
T2d mismo submission_id ×10: 50/50 con una sola fila
T3 CHECK de status y único parcial de intento en curso: rechazan lo inválido, aceptan lo válido
T4 2026-04-04: T=2026-04-05T02:59:00.000Z ext=2026-04-07T02:59:00.000Z (local 06-04-26, 10:59 p. m.) review_at=2026-04-07T03:59:00.000Z
T4 2026-04-05: T=2026-04-06T03:59:00.000Z ext=2026-04-08T03:59:00.000Z (local 07-04-26, 11:59 p. m.) review_at=2026-04-08T04:59:00.000Z
T4 2026-09-05: T=2026-09-06T03:59:00.000Z ext=2026-09-08T03:59:00.000Z (local 08-09-26, 12:59 a. m.) review_at=2026-09-08T04:59:00.000Z
T4 2026-09-06: T=2026-09-07T02:59:00.000Z ext=2026-09-09T02:59:00.000Z (local 08-09-26, 11:59 p. m.) review_at=2026-09-09T03:59:00.000Z
T4 2027-04-03: T=2027-04-04T02:59:00.000Z ext=2027-04-06T02:59:00.000Z (local 05-04-27, 10:59 p. m.) review_at=2027-04-06T03:59:00.000Z
T4 2027-09-04: T=2027-09-05T03:59:00.000Z ext=2027-09-07T03:59:00.000Z (local 07-09-27, 12:59 a. m.) review_at=2027-09-07T04:59:00.000Z
T4 2026-06-15: T=2026-06-16T03:59:00.000Z ext=2026-06-18T03:59:00.000Z (local 17-06-26, 11:59 p. m.) review_at=2026-06-18T04:59:00.000Z
T5 desfase reloj app↔libsql local: 2 ms (en Vercel debe medirse entre instancias desplegadas)
p0e-t15: ok
exit=0
```

## Límites (no verificado)

- **Concurrencia en Turso con réplicas:** la base de prueba es un solo `sqld`. T2 debe repetirse contra una base Turso desechable antes de dar la concurrencia por confirmada en producción (requiere autorización para crear esa base).
- **Expiración de intentos abiertos al cierre (T2c):** el lote de envío incluye una sentencia que marca como `vencido` cualquier intento `en_curso` al cerrar. En 50 repeticiones ningún intento quedó abierto durante la carrera, porque el índice único de intento abierto y la atomicidad del lote lo impiden; esa sentencia es una defensa adicional y no llegó a ejercitarse.
- **T5:** mide el reloj local. En Vercel hay que medirlo entre instancias desplegadas.
- **T4 (para comunicar):** con 48 h reales, la extensión que cruza un cambio de horario termina a las 22:59 o a las 00:59 locales, no a las 23:59 (coherente con P3).
