import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const NAVY = "#003366";
const GOLD = "#FFC548";
const TEXT = "#525252";
const FONT = "'Poppins', sans-serif";

function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: FONT, color: TEXT, background: "#fff", minHeight: "100vh" }}>
      <header style={{ background: NAVY, padding: "28px 24px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <Link href="/" style={{ color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, opacity: 0.85 }}>
            <ArrowLeft style={{ width: 16, height: 16 }} /> Barkley Online
          </Link>
        </div>
      </header>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "56px 24px 96px" }}>
        <h1 style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>{title}</h1>
        <p style={{ fontSize: 13, fontWeight: 600, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 40px" }}>
          Última actualización: {updated}
        </p>
        <div style={{ fontSize: 16, lineHeight: 1.85 }}>{children}</div>
      </div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY, margin: "36px 0 12px" }}>{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 16px" }}>{children}</p>;
}
function Ul({ children }: { children: React.ReactNode }) {
  return <ul style={{ margin: "0 0 16px", paddingLeft: 22 }}>{children}</ul>;
}

export function PrivacyPolicy() {
  return (
    <LegalPage title="Política de privacidad" updated="julio 2026">
      <P>
        Barkley Online ("Barkley", "nosotros") recopila y trata los datos personales de estudiantes y apoderados
        exclusivamente para operar el servicio educativo: crear la cuenta del estudiante, hacer seguimiento de su
        avance académico, comunicarnos con la familia y gestionar el pago del servicio.
      </P>
      <H2>Qué datos recopilamos</H2>
      <Ul>
        <li>Datos de identificación del estudiante y del apoderado (nombre, RUT, correo, teléfono).</li>
        <li>Datos académicos: avance por lección, notas, entregas, mensajes con tutor y asesor.</li>
        <li>Datos de uso de la plataforma (días activos, tiempo por lección) para medir el progreso.</li>
        <li>Datos de pago, procesados por nuestro proveedor de pagos — Barkley no almacena números de tarjeta.</li>
      </Ul>
      <H2>Cómo protegemos tus datos</H2>
      <P>
        La información académica del estudiante solo es visible para el propio estudiante, su apoderado vinculado,
        su tutor y su asesor asignado. El acceso está segmentado por rol y protegido a nivel de base de datos.
        No vendemos ni compartimos datos con terceros para fines publicitarios.
      </P>
      <H2>Tus derechos</H2>
      <P>
        Puedes solicitar acceso, corrección o eliminación de tus datos escribiendo a{" "}
        <a href="mailto:admisiones@barkleyinstituto.cl" style={{ color: NAVY, fontWeight: 600 }}>admisiones@barkleyinstituto.cl</a>.
      </P>
    </LegalPage>
  );
}

export function TermsOfUse() {
  return (
    <LegalPage title="Términos de uso" updated="julio 2026">
      <P>
        Al inscribirte en Barkley Online aceptas estos términos, que regulan el uso de la plataforma y el servicio
        educativo de preparación para exámenes libres ante el Ministerio de Educación de Chile (MINEDUC).
      </P>
      <H2>El servicio</H2>
      <P>
        Barkley entrega contenido asincrónico (video, pódcast, lecturas y evaluaciones) organizado por Aprendizaje
        por Dominio, acompañamiento de un tutor general y un asesor académico, y acceso al Portal Familia. El año de
        preparación corre de marzo al 31 de octubre.
      </P>
      <H2>Responsabilidades del estudiante y la familia</H2>
      <Ul>
        <li>Mantener actualizados los datos de contacto de estudiante y apoderado.</li>
        <li>Usar la plataforma y sus materiales solo para fines educativos personales, sin redistribuirlos.</li>
        <li>Rendir los exámenes libres directamente ante el MINEDUC — Barkley prepara, no certifica ni rinde por ti.</li>
      </Ul>
      <H2>Suspensión de cuenta</H2>
      <P>
        Barkley puede suspender el acceso ante atraso de pago no regularizado o uso indebido de la plataforma,
        previo aviso al correo registrado.
      </P>
    </LegalPage>
  );
}

export function RefundPolicy() {
  return (
    <LegalPage title="Política de reembolso y cancelación" updated="julio 2026">
      <P>
        Barkley no cobra matrícula. Puedes reservar tu cupo ahora sin pagar hasta febrero de 2027, antes del inicio
        del año de preparación en marzo.
      </P>
      <H2>Cancelación antes de marzo</H2>
      <P>
        Si cancelas tu cupo antes del inicio de clases en marzo, no se realiza ningún cobro y no aplica penalidad.
      </P>
      <H2>Plan mensual</H2>
      <P>
        El plan mensual se cobra mes a mes. Puedes cancelar en cualquier momento desde el mes siguiente al aviso;
        el mes ya facturado no es reembolsable, pero el estudiante conserva acceso hasta el término de ese mes.
      </P>
      <H2>Plan anual (pago único con 15% de descuento)</H2>
      <Ul>
        <li>Cancelación dentro de los primeros 14 días desde el inicio de clases en marzo: reembolso del 100%.</li>
        <li>
          Cancelación después de los 14 días: se reembolsa el saldo proporcional a los meses no cursados, calculado
          al valor del plan mensual (sin el 15% de descuento), descontando los meses ya utilizados.
        </li>
      </Ul>
      <H2>Cómo solicitarlo</H2>
      <P>
        Escribe a{" "}
        <a href="mailto:admisiones@barkleyinstituto.cl" style={{ color: NAVY, fontWeight: 600 }}>admisiones@barkleyinstituto.cl</a>{" "}
        indicando el nombre del estudiante. Procesamos reembolsos dentro de 10 días hábiles.
      </P>
    </LegalPage>
  );
}
