/**
 * /en — portada en inglés. Mismo relato que la portada en español (quiénes
 * somos, los 4 fundamentos, el programa adaptativo, el acompañamiento, niveles
 * y arancel), escrita para lectores internacionales y con un llamado a apoyar
 * la misión (/en/support) en vez del formulario de inscripción, que es para
 * familias en Chile y sigue en español.
 */
import { ArrowUpRight, Brain, Compass, Users2, Lock, Sparkles, MessageCircle, UserRound, Eye } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { usePageMeta } from "@/lib/usePageMeta";
import { useIdioma } from "@/lib/useIdioma";
import { NAVY, RED, GOLD, TEXT, SLATE, VIVID_BLUE, FONT, MONTOS, Reveal, Eyebrow, H2, BotonOro, FooterEn } from "./comun";

const FUNDAMENTOS = [
  { icon: Brain, nombre: "Vórtice™", lema: "Your whole school year, in one place.", texto: "Our own learning platform. Every lesson, assessment, tutor message and family update lives in a single place — no scattered apps." },
  { icon: Lock, nombre: "Umbral™", lema: "You move on when you've mastered it.", texto: "Mastery learning: the next unit unlocks only after scoring 70% or more on the current one. Students can review and retry as many times as they need." },
  { icon: Compass, nombre: "Brújula™", lema: "Your pace, recalculated every week.", texto: "A suggested weekly plan anchored to the real date of each student's official exam. If life gets in the way, it recalculates — direction, not pressure." },
  { icon: Users2, nombre: "Together™", lema: "You study alone, but you're not alone.", texto: "A silent study room where students see others working alongside them. No camera, no chat — just the quiet focus of studying in company." },
];

const PERFILES = [
  { titulo: "ADHD", texto: "Short blocks, a visible agenda and no fixed timetable." },
  { titulo: "Dyslexia", texto: "Text-to-speech, a dyslexia-friendly typeface and audio versions of every lesson." },
  { titulo: "Autism (ASD)", texto: "A predictable routine without classroom overstimulation or forced social interaction." },
  { titulo: "Motor difficulties", texto: "Larger targets and an interface that adapts to how each student moves." },
  { titulo: "Chronic illness", texto: "School that fits around treatments and hospital stays." },
  { titulo: "Athletes & artists", texto: "Training and competitions no longer compete with a school timetable." },
  { titulo: "Families on the move", texto: "The official Chilean curriculum from anywhere in the world." },
  { titulo: "Adults (18+)", texto: "A second chance to finish school, on their own schedule." },
];

const FORMATOS = ["Video", "Podcast", "Infographics", "Reports", "Mind maps", "Slides", "Quizzes", "Assessments"];

const ACOMPANAMIENTO = [
  { icon: UserRound, titulo: "A human tutor", texto: "Every student has an assigned tutor — not a generic support pool — who reviews their work and supports them beyond academics." },
  { icon: Sparkles, titulo: "IA Barkley", texto: "An AI tutor that steps in when a student is genuinely stuck (two failed attempts below 70%) and explains the concept without giving away the answer." },
  { icon: Eye, titulo: "Family Portal", texto: "Parents see grades, progress per subject, study days and tutoring sessions in real time — informed, without having to monitor." },
  { icon: MessageCircle, titulo: "A personal advisor", texto: "Follows each student's progress across the year and steps in early when something isn't working." },
];

export default function HomeEn() {
  usePageMeta({
    title: "Barkley Online School · Chile's 100% asynchronous online school",
    description: "Barkley is a 100% asynchronous online school in Chile for grades 1–12 and adults, built on mastery learning and designed for every learner — including students with ADHD, dyslexia and autism.",
    ogLocale: "en_US",
  });
  useIdioma("en", "/en");

  return (
    <div style={{ fontFamily: FONT, color: NAVY, background: "#fff", overflowX: "hidden" }}>
      <SiteHeader idioma="en" />

      {/* HERO */}
      <section data-hero="sec" style={{ position: "relative", padding: 15, background: "#fff", height: "min(820px,88vh)", boxSizing: "border-box" }}>
        <style>{`@media (max-width: 760px) { [data-hero="sec"] { height: 86vh !important; padding: 10px !important; } [data-hero="texto"] { left: 22px !important; right: 22px !important; bottom: 28px !important; } }`}</style>
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <img
            src="/images/hero-estudiante.webp"
            srcSet="/images/hero-estudiante-900.webp 900w, /images/hero-estudiante-1400.webp 1400w, /images/hero-estudiante.webp 1800w"
            sizes="100vw" alt="" fetchPriority="high" decoding="async"
            style={{ width: "100%", height: "100%", position: "absolute", inset: 0, objectFit: "cover", filter: "saturate(0.85)" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,51,102,0) 35%, rgba(10,25,50,0.78) 100%)" }} />
          <div data-hero="texto" style={{ position: "absolute", left: 45, right: 40, bottom: 44, color: "#fff", maxWidth: 860 }}>
            <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, margin: "0 0 12px", textShadow: "0 1px 12px rgba(0,20,50,0.7)" }}>Barkley Online School · Chile</p>
            <h1 style={{ fontSize: "clamp(34px,5vw,66px)", fontWeight: 600, margin: 0, lineHeight: 1.06 }}>The online school where no one moves on without understanding</h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
              <BotonOro href="/en/support">Support our mission <ArrowUpRight style={{ width: 18, height: 18 }} /></BotonOro>
              <a href="#method" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 999, padding: "13px 26px", textDecoration: "none" }}>How it works →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ maxWidth: 1180, margin: "0 auto", padding: "90px 24px" }}>
        <Reveal>
          <p style={{ fontSize: "clamp(24px,3.4vw,40px)", fontWeight: 500, lineHeight: 1.35, color: NAVY, margin: 0 }}>
            Barkley is a <span style={{ color: RED }}>100% asynchronous</span> online school in Chile for students from grade 1 to grade 12,
            following the official national curriculum — and built so that every student can learn their own way.
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 28, marginTop: 34 }}>
            {[
              ["No live classes", "No fixed timetable and no Zoom. Every lesson is available on demand, in video and podcast."],
              ["Official certification", "Students validate each grade through Chile's official Exámenes Libres, administered by the Ministry of Education (MINEDUC)."],
              ["Opening March 2027", "Enrolment is open now. The first school year runs from March to October 2027."],
            ].map(([t, d]) => (
              <div key={t} style={{ flex: "1 1 280px", borderTop: `3px solid ${GOLD}`, paddingTop: 16 }}>
                <p style={{ fontSize: 19, fontWeight: 700, margin: "0 0 8px" }}>{t}</p>
                <p style={{ fontSize: 15, color: TEXT, lineHeight: 1.65, margin: 0 }}>{d}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: SLATE, marginTop: 26, maxWidth: 760, lineHeight: 1.6 }}>
            A note on accreditation: in Chile, no fully online school is accredited as a school by the Ministry of Education. The official path is the
            Exámenes Libres, which the Ministry itself administers. Barkley prepares students for them; it does not administer them or issue the certificate.
          </p>
        </Reveal>
      </section>

      {/* THE 4 FUNDAMENTALS */}
      <section id="method" style={{ background: NAVY, color: "#fff", padding: "88px 24px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <Reveal>
            <Eyebrow color={GOLD}>Our own technology</Eyebrow>
            <H2 color="#fff">Four fundamentals behind every student</H2>
            <p style={{ fontSize: 16, opacity: 0.85, maxWidth: 680, lineHeight: 1.7, margin: "0 0 44px" }}>
              Mastery learning is the method used by leading accredited online schools in the United States and the United Kingdom. Barkley applies it
              to the Chilean national curriculum through four tools we designed ourselves.
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            {FUNDAMENTOS.map((f, i) => (
              <Reveal key={f.nombre} delay={i * 0.08}>
                <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 18, padding: 28, height: "100%", boxSizing: "border-box" }}>
                  <f.icon style={{ width: 34, height: 34, color: GOLD }} />
                  <p style={{ fontSize: 26, fontWeight: 800, margin: "16px 0 4px", letterSpacing: "0.02em" }}>{f.nombre}</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: GOLD, margin: "0 0 12px" }}>{f.lema}</p>
                  <p style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, margin: 0 }}>{f.texto}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <div style={{ marginTop: 40 }}>
              <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.75, margin: "0 0 14px" }}>Every lesson includes</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {FORMATOS.map((f) => (
                  <span key={f} style={{ border: `1.5px solid ${GOLD}`, color: GOLD, borderRadius: 999, padding: "8px 18px", fontSize: 14, fontWeight: 600 }}>{f}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* EVERY LEARNER */}
      <section id="every-learner" style={{ background: "#f5f5f5", padding: "88px 24px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
              <Eyebrow>Adaptive Program</Eyebrow>
              <H2 center>Designed for every learner</H2>
              <p style={{ fontSize: 16, color: TEXT, lineHeight: 1.7, margin: 0 }}>
                The same curriculum, with the entry point each student needs. Barkley's Adaptive Program changes how the platform behaves for each
                profile — it is not a separate, simplified course. It does not replace professional diagnosis or treatment.
              </p>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            {PERFILES.map((p, i) => (
              <Reveal key={p.titulo} delay={(i % 4) * 0.06}>
                <div style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", height: "100%", boxSizing: "border-box", boxShadow: "0 2px 12px rgba(0,51,102,0.06)" }}>
                  <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{p.titulo}</p>
                  <p style={{ fontSize: 14.5, color: TEXT, lineHeight: 1.6, margin: 0 }}>{p.texto}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORT MODEL */}
      <section id="support-model" style={{ maxWidth: 1240, margin: "0 auto", padding: "88px 24px" }}>
        <Reveal>
          <Eyebrow>Never alone</Eyebrow>
          <H2>Technology that scales, people who care</H2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 28, marginTop: 18 }}>
          {ACOMPANAMIENTO.map((a, i) => (
            <Reveal key={a.titulo} delay={i * 0.07}>
              <div>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "#eef3fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <a.icon style={{ width: 26, height: 26, color: VIVID_BLUE }} />
                </div>
                <p style={{ fontSize: 19, fontWeight: 700, margin: "14px 0 6px" }}>{a.titulo}</p>
                <p style={{ fontSize: 15, color: TEXT, lineHeight: 1.65, margin: 0 }}>{a.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* LEVELS + TUITION */}
      <section id="tuition" style={{ background: VIVID_BLUE, color: "#fff", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 40, alignItems: "flex-start" }}>
          <Reveal style={{ flex: "1 1 380px" }}>
            <Eyebrow color={GOLD}>Levels & tuition</Eyebrow>
            <H2 color="#fff">Affordable by design</H2>
            <p style={{ fontSize: 16, lineHeight: 1.7, opacity: 0.9, margin: 0 }}>
              Primary (grades 1–8) and secondary (grades 9–12) follow Chile's official curriculum. Adults aged 18+ can finish school through their own
              programme. The school year runs {MONTOS.meses} months, from March to October, when students sit their official exams.
            </p>
          </Reveal>
          <Reveal delay={0.1} style={{ flex: "1 1 360px" }}>
            <div style={{ background: "#fff", color: NAVY, borderRadius: 20, padding: 30 }}>
              {[
                ["School programme (grades 1–12)", `${MONTOS.escolarMes} / month`],
                ["Adult programme (18+)", `${MONTOS.adultosMes} / month`],
                ["A full school year, per student", MONTOS.escolarAnio],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "14px 0", borderBottom: "1px solid #e8edf3" }}>
                  <span style={{ fontSize: 15, color: TEXT }}>{k}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, whiteSpace: "nowrap" }}>{v}</span>
                </div>
              ))}
              <p style={{ fontSize: 13, color: SLATE, margin: "14px 0 0", lineHeight: 1.6 }}>
                All-inclusive: every subject, video and podcast lessons, an assigned tutor, an advisor and the Family Portal. {MONTOS.descuentoAnual} off when paying the full year.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA SUPPORT */}
      <section style={{ padding: "90px 24px", textAlign: "center" }}>
        <Reveal>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <Eyebrow>Philanthropy & partnerships</Eyebrow>
            <H2 center>Help a student whose school never fit them</H2>
            <p style={{ fontSize: 17, color: TEXT, lineHeight: 1.7, margin: "0 0 30px" }}>
              Many families who need Barkley the most — children with learning differences, chronic illness or no nearby school that works for them —
              cannot afford it. Your support can open that door from our very first school year.
            </p>
            <BotonOro href="/en/support">See how you can help <ArrowUpRight style={{ width: 18, height: 18 }} /></BotonOro>
          </div>
        </Reveal>
      </section>

      <FooterEn />
    </div>
  );
}
