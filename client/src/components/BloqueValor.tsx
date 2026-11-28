import {
  Bot, ClipboardCheck, DoorOpen, Gift, LayoutDashboard, Lightbulb,
  LineChart, Route, UserRound, Users,
} from "lucide-react";
import { PRECIOS } from "@shared/precios";

const CUOTAS = ["Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep"];

const SERVICIOS = [
  { Icono: LayoutDashboard, nombre: "Vórtice", que: "Plataforma de aprendizaje", detalle: "Asignaturas, unidades, videos, actividades y progreso académico en un solo lugar." },
  { Icono: DoorOpen, nombre: "Umbral", que: "Aprendizaje por dominio", detalle: "El estudiante demuestra que comprendió antes de avanzar." },
  { Icono: UserRound, nombre: "Tutor humano", que: "Acompañamiento personal", detalle: "Un tutor acompaña al estudiante durante su proceso académico." },
  { Icono: Bot, nombre: "Tutor IA", que: "Asistencia académica con inteligencia artificial", detalle: "Apoyo para resolver dudas, comprender contenidos y continuar aprendiendo." },
  { Icono: Lightbulb, nombre: "IABarkley", que: "Inteligencia pedagógica", detalle: "Recursos y organización pedagógica orientados a facilitar la comprensión y el aprendizaje." },
  { Icono: LineChart, nombre: "Seguimiento académico", que: "Monitoreo del progreso", detalle: "Seguimiento del avance del estudiante y detección de necesidades de apoyo." },
  { Icono: Users, nombre: "Portal Familia", que: "Seguimiento para apoderados", detalle: "La familia puede consultar y acompañar el progreso académico del estudiante." },
  { Icono: Route, nombre: "Ruta académica", que: "Programa organizado por asignaturas y unidades", detalle: "Una ruta de aprendizaje estructurada para avanzar de forma ordenada." },
  { Icono: ClipboardCheck, nombre: "Evaluaciones", que: "Evaluación y comprobación de aprendizaje", detalle: "Actividades para comprobar comprensión, identificar dificultades y reforzar conocimientos." },
];

/* Bloque comercial: precio (área A) y servicios incluidos (área B).
   El calendario mar–oct muestra que se pagan siete cuotas y que octubre va incluido. */
const CSS = `
.bv { --azul:#003366; --oro:#ffc548; --papel:#eef3f9; --linea:#d8e1ec; --tinta:#46566b;
  background: var(--papel); padding: clamp(40px,5vw,72px) 20px; scroll-margin-top: 8px; }
.bv *, .bv *::before { box-sizing: border-box; }
.bv-marco { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: minmax(0,460px) minmax(0,1fr); gap: 24px; align-items: stretch; }
.bv-serif { font-family: 'Newsreader', Georgia, serif; font-weight: 500; letter-spacing: -0.02em; font-variant-numeric: tabular-nums lining-nums; }
:where(.bv) :where(p, h2, h3, h4, ul) { margin: 0; padding: 0; }
.bv .bv-octubre h3, .bv .bv-anual h3, .bv .bv-lista h4 { font-family: 'Instrument Sans', system-ui, sans-serif; }
.bv-precio { background: var(--azul); color: #fff; border-radius: 20px; padding: clamp(24px,3vw,36px); display: flex; flex-direction: column; }
.bv-precio h2 { font-size: clamp(30px,3.2vw,38px); line-height: 1.08; color: #fff; text-wrap: balance; }
.bv-sub { margin-top: 10px; font-size: 15.5px; line-height: 1.5; color: #c9d8ea; }
.bv-rotulo { margin-top: 20px; font-size: 14px; color: #c9d8ea; }
.bv-total { font-size: clamp(56px,6vw,76px); line-height: 1; margin-top: 4px; }
.bv-cuotas { margin-top: 14px; font-size: 21px; font-weight: 700; }
.bv-periodo { font-size: 14.5px; color: #c9d8ea; margin-top: 2px; }
.bv-meses { list-style: none; display: grid; grid-template-columns: repeat(7,minmax(0,1fr)) minmax(0,1.55fr); gap: 4px; margin-top: 16px; }
.bv-meses li { border: 1px solid rgba(255,255,255,.28); border-radius: 8px; padding: 8px 0; line-height: 1.3; text-align: center; display: grid; gap: 2px; font-size: 13px; font-weight: 600; }
.bv-meses li span { font-size: 11px; font-weight: 400; color: #c9d8ea; }
.bv-meses li.oct { background: var(--oro); border-color: var(--oro); color: var(--azul); }
.bv-meses li.oct span { color: var(--azul); font-weight: 700; }
.bv-octubre { margin-top: 12px; background: var(--oro); color: var(--azul); border-radius: 12px; padding: 16px 18px; display: flex; gap: 14px; align-items: flex-start; }
.bv-octubre svg { flex-shrink: 0; margin-top: 2px; }
.bv-octubre h3 { font-size: 22px; font-weight: 800; letter-spacing: .01em; color: var(--azul); line-height: 1.2; }
.bv-octubre p { font-size: 14.5px; line-height: 1.45; margin-top: 4px; font-weight: 500; }
.bv-anual { margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.22); }
.bv-anual h3 { font-size: 14px; font-weight: 400; color: #c9d8ea; }
.bv-anual-monto { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; margin-top: 2px; }
.bv-anual-monto strong { font-size: 40px; font-weight: 500; }
.bv-anual-monto span { font-size: 14px; font-weight: 700; color: var(--oro); }
.bv-anual p { font-size: 14.5px; }
.bv-matricula { margin-top: 16px; border: 1.5px dashed rgba(255,197,72,.7); border-radius: 12px; padding: 12px 16px; }
.bv-matricula strong { display: block; font-size: 16px; color: var(--oro); letter-spacing: .02em; }
.bv-matricula span { display: block; margin-top: 4px; font-size: 13.5px; line-height: 1.45; color: #dbe6f3; }
.bv-cta { display: block; text-align: center; background: var(--oro); color: var(--azul); font-weight: 700; font-size: 16px; text-decoration: none; border-radius: 999px; padding: 16px; }
.bv-cta-caja { margin-top: auto; padding-top: 18px; }
.bv-cta:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
.bv-tablero { background: #fff; border: 1px solid var(--linea); border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; }
.bv-tablero > h3 { font-size: clamp(24px,2.4vw,30px); color: var(--azul); padding: 28px 26px 22px; border-bottom: 1px solid var(--linea); line-height: 1.15; }
.bv-lista { list-style: none; flex: 1; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); grid-auto-rows: 1fr; }
.bv-lista li { display: flex; flex-direction: column; padding: 30px 22px 24px; border-right: 1px solid var(--linea); border-bottom: 1px solid var(--linea); margin: 0 -1px -1px 0; }
.bv-icono { align-self: flex-start; display: inline-flex; width: 46px; height: 46px; border-radius: 12px; background: var(--papel); color: var(--azul); align-items: center; justify-content: center; }
.bv-lista h4 { margin: 14px 0 2px; font-size: 18px; font-weight: 700; color: var(--azul); line-height: 1.2; }
.bv-que { font-size: 13.5px; font-weight: 600; color: #8a5a00; line-height: 1.35; }
.bv-detalle { margin-top: 10px; font-size: 15.5px; line-height: 1.5; color: var(--tinta); }
@media (max-width: 1099px) {
  .bv-marco { grid-template-columns: minmax(0,1fr); max-width: 760px; }
  .bv-lista { grid-template-columns: repeat(2,minmax(0,1fr)); }
}
@media (max-width: 600px) {
  .bv { padding: 24px 10px 40px; }
  .bv-precio { padding: 24px 18px; }
  .bv-meses { grid-template-columns: repeat(4,minmax(0,1fr)); }
  .bv-lista { grid-template-columns: minmax(0,1fr); grid-auto-rows: auto; }
  .bv-lista li { display: grid; grid-template-columns: 46px minmax(0,1fr); column-gap: 14px; padding: 20px 18px; }
  .bv-lista li > .bv-icono { grid-row: span 3; align-self: start; }
  .bv-lista h4 { margin-top: 0; }
}
`;

export default function BloqueValor() {
  return (
    <section id="precio" className="bv" aria-labelledby="bv-titulo">
      <style>{CSS}</style>
      <div className="bv-marco">
        <div className="bv-precio">
          <h2 id="bv-titulo" className="bv-serif">Programa Académico Integral Barkley</h2>
          <p className="bv-sub">Aprendizaje asincrónico, inteligencia pedagógica y acompañamiento humano.</p>

          <p className="bv-rotulo">Precio regular · arancel anual</p>
          <p className="bv-total bv-serif" data-testid="precio-anual-lista">{PRECIOS.escolarAnualLista}</p>
          <p className="bv-cuotas">7 cuotas de {PRECIOS.escolar}</p>
          <p className="bv-periodo">Periodo de pago: marzo a septiembre</p>

          <ul className="bv-meses" aria-label="Siete cuotas de marzo a septiembre; octubre incluido sin cobro">
            {CUOTAS.map((mes, i) => (
              <li key={mes}>{mes}<span>{i + 1}ª</span></li>
            ))}
            <li className="oct">Oct<span>Gratis</span></li>
          </ul>

          <div className="bv-octubre">
            <Gift size={28} aria-hidden />
            <div>
              <h3>OCTUBRE GRATIS</h3>
              <p>Tu programa académico continúa durante octubre. No pagas una cuota adicional.</p>
            </div>
          </div>

          <div className="bv-anual">
            <h3>Pago anual anticipado · pago único</h3>
            <div className="bv-anual-monto">
              <strong className="bv-serif">{PRECIOS.escolarAnual}</strong>
              <span>{PRECIOS.descuentoAnual} de descuento</span>
            </div>
            <p>Ahorras {PRECIOS.escolarAhorroAnual} pagando el año completo.</p>
          </div>

          <p className="bv-matricula">
            <strong>MATRÍCULA GRATIS</strong>
            <span>Matrícula {PRECIOS.matricula}, gratis para quienes se inscriban hasta el 31 de diciembre.</span>
          </p>

          <div className="bv-cta-caja">
            <a className="bv-cta" href="#inscripcion">Inscribirme</a>
          </div>
        </div>

        <div className="bv-tablero">
          <h3 className="bv-serif">Qué incluye el programa</h3>
          <ul className="bv-lista">
            {SERVICIOS.map(({ Icono, nombre, que, detalle }) => (
              <li key={nombre}>
                <span className="bv-icono"><Icono size={24} strokeWidth={1.8} aria-hidden /></span>
                <h4>{nombre}</h4>
                <p className="bv-que">{que}</p>
                <p className="bv-detalle">{detalle}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
