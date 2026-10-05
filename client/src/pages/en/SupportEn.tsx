/**
 * /en/support — página para filántropos, fundaciones y empresas. Explica por qué
 * Barkley importa, qué financia un aporte (con montos reales tomados de
 * shared/precios.ts) y cómo contactarse. No promete beneficios tributarios ni
 * cifras de impacto: Barkley abre en marzo de 2027 y los aliados de hoy son
 * aliados fundadores.
 */
import { GraduationCap, HeartHandshake, Laptop, Accessibility, Building2, HandCoins, Mail, Heart } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { usePageMeta } from "@/lib/usePageMeta";
import { useIdioma } from "@/lib/useIdioma";
import { NAVY, RED, GOLD, TEXT, VIVID_BLUE, FONT, MONTOS, CONTACTO, Reveal, Eyebrow, H2, BotonOro, FooterEn } from "./comun";

const ASUNTO = encodeURIComponent("Partnership with Barkley");
const MAILTO = `mailto:${CONTACTO}?subject=${ASUNTO}`;
const PAYPAL_DONATE_URL =
  "https://www.paypal.com/donate/?business=juanpablo.monsalvezb@gmail.com&currency_code=USD&item_name=Donation+for+Barkley";

const PROBLEMA = [
  { titulo: "Children who don't fit the classroom", texto: "Students with ADHD, dyslexia or autism often fall behind not for lack of ability, but because a 40-student classroom moves at one speed." },
  { titulo: "Children the classroom pushes out", texto: "Bullying, anxiety and chronic illness lead many families in Chile to leave in-person school — often with no good alternative." },
  { titulo: "Children who fell behind and stayed behind", texto: "When a class moves on before a student understands, the gaps compound year after year." },
];

const DESTINOS = [
  { icon: GraduationCap, titulo: "Scholarships", texto: `A full school year for one student costs ${MONTOS.escolarAnio} (${MONTOS.meses} months × ${MONTOS.escolarMes}). Scholarships go to families who could not otherwise afford it.` },
  { icon: HeartHandshake, titulo: "Human tutoring", texto: "Extra hours of one-to-one support from a human tutor for scholarship students who need it most." },
  { icon: Accessibility, titulo: "The Adaptive Program", texto: "Developing new accessibility features for students with ADHD, dyslexia, autism and motor difficulties." },
  { icon: Laptop, titulo: "Devices & connectivity", texto: "A laptop and a reliable internet connection for students who have neither — the entry ticket to an online school." },
];

const FORMAS = [
  { icon: GraduationCap, titulo: "Sponsor a student", texto: `Cover one student's full school year (${MONTOS.escolarAnio}) or part of it.` },
  { icon: HandCoins, titulo: "Found a scholarship fund", texto: "Create a named fund that supports several students every year." },
  { icon: Building2, titulo: "Institutional partnership", texto: "Foundations, companies and organisations aligned with inclusive education." },
  { icon: Laptop, titulo: "In-kind support", texto: "Devices, connectivity or professional services for our students." },
];

export default function SupportEn() {
  usePageMeta({
    title: "Support Barkley · Help every child learn their own way",
    description: "Barkley is a 100% asynchronous online school in Chile designed for every learner. Sponsor a student, fund scholarships or partner with us from our first school year in 2027.",
    ogLocale: "en_US",
  });
  useIdioma("en", "/en/support");

  return (
    <div style={{ fontFamily: FONT, color: NAVY, background: "#fff", overflowX: "hidden" }}>
      <SiteHeader idioma="en" />

      {/* HERO */}
      <section style={{ background: NAVY, color: "#fff", padding: "200px 24px 96px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -120, top: -80, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,197,72,0.22), rgba(255,197,72,0))" }} />
        <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative" }}>
          <Reveal>
            <Eyebrow color={GOLD}>Philanthropy & partnerships</Eyebrow>
            <h1 style={{ fontSize: "clamp(36px,5.4vw,68px)", fontWeight: 700, lineHeight: 1.06, margin: "0 0 22px" }}>
              Help us build a school <span style={{ color: GOLD }}>that fits every child</span>
            </h1>
            <p style={{ fontSize: "clamp(17px,1.6vw,20px)", lineHeight: 1.65, opacity: 0.9, maxWidth: 760, margin: "0 0 30px" }}>
              Barkley is a 100% asynchronous online school in Chile where no one moves on without understanding — designed from day one for students
              with ADHD, dyslexia, autism, chronic illness and anyone the traditional classroom left behind. We open in March 2027, and we are looking
              for founding partners to make sure cost is never the reason a child can't join.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <BotonOro href={PAYPAL_DONATE_URL} target="_blank" rel="noopener noreferrer"><Heart style={{ width: 18, height: 18 }} /> Donate now</BotonOro>
              <a href={MAILTO} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 600, color: "#fff", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 999, padding: "13px 26px", textDecoration: "none" }}><Mail style={{ width: 18, height: 18 }} /> Talk to us</a>
            </div>
            <p style={{ fontSize: 13, opacity: 0.65, margin: "14px 0 0" }}>Small donations welcome — any amount helps.</p>
          </Reveal>
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "88px 24px" }}>
        <Reveal>
          <Eyebrow>Why it matters</Eyebrow>
          <H2>Some children need a different kind of school</H2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 26, marginTop: 14 }}>
          {PROBLEMA.map((p, i) => (
            <Reveal key={p.titulo} delay={i * 0.08}>
              <div style={{ borderTop: `3px solid ${RED}`, paddingTop: 18 }}>
                <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>{p.titulo}</p>
                <p style={{ fontSize: 15.5, color: TEXT, lineHeight: 1.7, margin: 0 }}>{p.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <div style={{ marginTop: 44, background: "#f5f7fb", borderRadius: 20, padding: "30px 32px", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
            <p style={{ flex: "1 1 420px", fontSize: 17, lineHeight: 1.7, color: NAVY, margin: 0 }}>
              <strong>Barkley's answer:</strong> the official Chilean curriculum, available on demand, with mastery learning (Umbral™), a weekly plan
              anchored to each student's exam (Brújula™), a silent study room (Together™), an Adaptive Program for each learning profile, and a human
              tutor for every student.
            </p>
            <a href="/en#method" style={{ fontSize: 15, fontWeight: 700, color: VIVID_BLUE, textDecoration: "none", whiteSpace: "nowrap" }}>How Barkley works →</a>
          </div>
        </Reveal>
      </section>

      {/* WHAT YOUR SUPPORT FUNDS */}
      <section style={{ background: VIVID_BLUE, color: "#fff", padding: "88px 24px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <Reveal>
            <Eyebrow color={GOLD}>Where your support goes</Eyebrow>
            <H2 color="#fff">What your contribution makes possible</H2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20, marginTop: 20 }}>
            {DESTINOS.map((d, i) => (
              <Reveal key={d.titulo} delay={i * 0.07}>
                <div style={{ background: "#fff", color: NAVY, borderRadius: 18, padding: 26, height: "100%", boxSizing: "border-box" }}>
                  <d.icon style={{ width: 32, height: 32, color: VIVID_BLUE }} />
                  <p style={{ fontSize: 20, fontWeight: 700, margin: "14px 0 8px" }}>{d.titulo}</p>
                  <p style={{ fontSize: 15, color: TEXT, lineHeight: 1.65, margin: 0 }}>{d.texto}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WAYS TO PARTNER */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "88px 24px" }}>
        <Reveal>
          <Eyebrow>Ways to partner</Eyebrow>
          <H2>Choose how you want to help</H2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 18, marginTop: 14 }}>
          {FORMAS.map((f, i) => (
            <Reveal key={f.titulo} delay={i * 0.07}>
              <a href={MAILTO} style={{ display: "block", textDecoration: "none", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 18, padding: 24, height: "100%", boxSizing: "border-box" }}>
                <f.icon style={{ width: 28, height: 28, color: RED }} />
                <p style={{ fontSize: 19, fontWeight: 700, margin: "12px 0 6px" }}>{f.titulo}</p>
                <p style={{ fontSize: 15, color: TEXT, lineHeight: 1.6, margin: 0 }}>{f.texto}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FOUNDING PARTNERS + CONTACT */}
      <section style={{ background: NAVY, color: "#fff", padding: "90px 24px", textAlign: "center" }}>
        <Reveal>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <Eyebrow color={GOLD}>Founding partners · 2027</Eyebrow>
            <H2 color="#fff" center>Be part of Barkley from day one</H2>
            <p style={{ fontSize: 17, lineHeight: 1.7, opacity: 0.9, margin: "0 0 30px" }}>
              Our first school year starts in March 2027. Write to us and we will share our plan, how scholarship students are selected and how we
              report on the use of every contribution.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              <BotonOro href={PAYPAL_DONATE_URL} target="_blank" rel="noopener noreferrer"><Heart style={{ width: 18, height: 18 }} /> Donate now</BotonOro>
              <a href={MAILTO} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 600, color: "#fff", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 999, padding: "13px 26px", textDecoration: "none" }}><Mail style={{ width: 18, height: 18 }} /> {CONTACTO}</a>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "22px 0 0" }}>
              Scholarship and sponsorship amounts are in Chilean pesos (CLP), based on Barkley's {new Date().getFullYear() >= 2027 ? "current" : "2027"} tuition. Donations via PayPal are processed in USD.
            </p>
          </div>
        </Reveal>
      </section>

      <FooterEn />
    </div>
  );
}

