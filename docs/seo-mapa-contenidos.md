# SEO editorial: pilotos y siguientes pasos

## Alcance de esta tanda

Cuatro URLs existentes; sin rutas nuevas ni contenido privado. Pilotos 1° y 8°
básico elegidos por contraste de necesidades de estudio, no por volumen de
búsqueda supuesto. No hay export actual de Search Console para priorizar demanda.

| URL | Intención y aporte | Siguiente paso público | Criterio de aceptación |
|---|---|---|---|
| /guia-examenes-libres/ | Orientar sobre proceso oficial, edades, calendario y límites | Nivel → tour → admisión | Distinguir menores/adultos; fuentes oficiales enlazadas; FAQ visible coincide con JSON-LD; no extrapolar 2026 a 2027 |
| /examenes-libres-1-basico/ | Ayudar a diferenciar comprensión, lectura y acompañamiento | Adulto acompañante y tour | Ejemplo original rotulado, no promesa de aprobación; regla de lectoescritura atribuida a MINEDUC |
| /examenes-libres-8-basico/ | Revisar razonamiento y transición a media | 1° medio y tour | Ejemplo resuelto con comprobación; autonomía no deducida solo de la edad |
| /tour-plataforma | Explicar Vórtice sin consultar cuentas | Guía, pilotos, preguntas frecuentes | Ejemplo ficticio separado de evaluación oficial; no presentar como una sesión real |

## Fuentes y mantenimiento

Fuentes oficiales revisadas el 16 de noviembre de 2026:
- https://www.ayudamineduc.cl/ficha/examenes-libres-menores-de-18-anos-11/
- https://www.ayudamineduc.cl/ficha/examenes-libres-mayores-de-18-anos-12

Se corrigió en la guía la prohibición absoluta de volver a rendir el mismo año:
la ficha de menores contempla una nueva inscripción en otro período solo con
plazos vigentes, cupos y requisitos. No hay recuperación automática.

Los ejemplos son elaboración editorial, no se extrajeron del banco interno de
preguntas ni del motor. No se añadieron nombres, diagnósticos ni credenciales.
`level-editorial.mjs` es la fuente común de las secciones de ambos pilotos y el
generador de niveles. Los HTML curados se actualizan de forma selectiva para no
pisar correcciones anteriores con una regeneración completa.

La guía tiene mantenimiento directo en su HTML. Tras cambios de cliente/shared,
regenerar los snapshots con el procedimiento documentado en
`seo-publico-verificacion.md`. No hace falta ejecutar el backend ni abrir BD.

## Dependencias pendientes (no inventar)

- Search Console: export de 90 días de consultas y páginas, con país/dispositivo
  cuando esté disponible. Medir clics, impresiones y CTR antes/después; no atribuir
  causalidad a una única modificación ni prometer rankings.
- Equipo institucional: autoría, cargos, credenciales profesionales verificables
  y autorización de publicación. No añadir personas ficticias como revisores.
- Estadística de aprobación: denominador, cohortes, método y respaldo del 92 %.
  La revisión de este dato sigue pendiente, no se añadió evidencia ficticia.
- Confirmar funciones y apoyos de cada nivel antes de anunciar nuevas prestaciones.
- Revisión pedagógica/editorial de los ejemplos antes de la fusión; no son un
  temario completo ni sustituyen los documentos oficiales.

## Extensión al resto de niveles

Solo ampliar al comprobar valor de los pilotos y tener revisión editorial. Cada
nivel debe aportar un problema real distinto, ejemplo propio y enlace pertinente;
no duplicar texto cambiando el curso o ciudad. Mantener herramientas y paneles
privados fuera del alcance editorial. Sin mediciones actuales, no se declara
mejora en Core Web Vitals, citas de IA ni cobertura de indexación.
