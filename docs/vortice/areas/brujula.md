# Área: Brújula (panel del estudiante, parte 2 y vista de familia)
**Archivos:** `shared/brujula.ts`, `shared/brujulaPanel.ts`, `server/brujula.ts`, `server/familia.ts`, `server/notificaciones.ts`, `client/src/pages/vortice/BrujulaPanel.tsx`, `FamiliaVista.tsx`.
**Invariantes:** orienta sin castigos, rachas ni puntajes; mensajes por reglas (sin IA); días en calendario de Chile contados por días civiles (no por instantes: el 5-sep-2027 cambia la hora); vista de familia sin notas ni porcentajes de E2.
**Pruebas:** `script/brujula.check.ts`, `brujula-panel.check.ts` (18 casos), `brujula-parte2.check.ts`; mutaciones manuales `script/brujula-mutacion.ts`.
**Estado:** terminada (parte 2 hecha por Antigravity, sin verificar a fondo por mí); no vista en pantalla con datos reales.
