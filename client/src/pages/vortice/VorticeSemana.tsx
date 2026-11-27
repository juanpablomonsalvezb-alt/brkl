import { CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { VorticeShell } from "@/components/vortice/VorticeShell";
import { BrujulaPanel } from "./BrujulaPanel";
import { SinSesion } from "./SinSesion";
import { useInicioDatos } from "./useInicioDatos";
import "./vortice.css";

function semanaActual(hoy: Date) {
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
}
const mismoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export default function VorticeSemana() {
  const datos = useInicioDatos({ brujula: true, mapa: true });
  if (!datos.sesion) return <SinSesion cargando={datos.usuario.isLoading} enPreview={datos.enPreview} />;

  const nombre = datos.usuario.data?.firstName || datos.usuario.data?.name?.split(" ")[0] || null;
  const ov = datos.overview.data;
  const nivel = ov?.level;
  const metas = datos.semana.data?.goals ?? [];
  const cumplida = (goal: typeof metas[number]) => {
    const subject = ov?.subjects.find((item) => item.levelSubjectId === goal.levelSubjectId);
    return !!subject && subject.currentObjective?.id !== goal.objectiveId;
  };
  const pendientesRepaso = datos.repaso.data?.domains.reduce((total, domain) => total + domain.due, 0) ?? 0;
  const repasosMapa = datos.mapa.data?.disponible ? (datos.mapa.data.retencion?.pendientesCount ?? 0) : 0;
  const repasosTotal = repasosMapa + pendientesRepaso;
  const hoy = new Date();
  const dias = semanaActual(hoy);
  const mesNombre = hoy.toLocaleDateString("es-CL", { month: "long" });
  const mes = `${mesNombre.charAt(0).toUpperCase()}${mesNombre.slice(1)} ${hoy.getFullYear()}`;

  return (
    <VorticeShell variante="estudiante" activo="semana" nombre={nombre} detalle={nivel?.name ?? "Sin curso asignado"} tramo={ov?.track} salirHref={datos.salir}>
      <div className="vx-pagina">
        <h1 className="vx-titulo">Mi semana</h1>
        <BrujulaPanel
          panel={datos.panel.data ?? undefined}
          cargando={datos.panel.isLoading}
          error={datos.panel.isError}
          preferencias={datos.preferencias.data ?? undefined}
          bloques={datos.bloques.data?.bloques}
          onSavePreferencias={(preferencias) => datos.savePrefsMutation.mutate(preferencias)}
          onToggleBloque={(blockId, completado) => datos.toggleBloqueMutation.mutate({ blockId, completado })}
          guardandoPreferencias={datos.savePrefsMutation.isPending}
          guardandoBloqueId={datos.togglingId}
        />

        <section className="vx-card" id="semana" aria-labelledby="vx-semana-cal">
          <header>
            <h2 id="vx-semana-cal"><CalendarDays aria-hidden="true" />{mes}</h2>
            {datos.semana.data && !datos.semana.data.saved && <small>Plan propuesto</small>}
          </header>
          <div className="vx-week">
            {dias.map((dia) => (
              <div key={dia.toISOString()} aria-current={mismoDia(dia, hoy) ? "date" : undefined}>
                {dia.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "")}<b>{dia.getDate()}</b>
              </div>
            ))}
          </div>
          {datos.semana.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full rounded-lg bg-(--vx-surface)" />
              <Skeleton className="h-9 w-full rounded-lg bg-(--vx-surface)" />
            </div>
          ) : metas.length ? (
            <ul className="vx-agenda">
              {metas.map((goal) => (
                <li key={goal.objectiveId}>
                  <span className="vx-agenda-check" data-done={cumplida(goal)} aria-hidden="true" />
                  <span>{goal.subjectName}: {goal.objectiveTitle}</span>
                  <small>{cumplida(goal) ? "Cumplida" : goal.objectiveCode}</small>
                </li>
              ))}
            </ul>
          ) : <p className="vx-empty">No hay metas para esta semana.</p>}
        </section>

        <section className="vx-card" aria-labelledby="vx-mis-numeros">
          <header><h2 id="vx-mis-numeros">Mis números</h2></header>
          {datos.overview.isLoading ? (
            <div className="space-y-2"><Skeleton className="h-9 w-full rounded-lg bg-(--vx-surface)" /></div>
          ) : datos.overview.isError ? (
            <p className="vx-empty">No pudimos cargar tus números. Recarga la página para intentarlo de nuevo.</p>
          ) : ov ? (
            <ul className="vx-stats">
              <li><i style={{ background: "var(--vx-primary-2)" }} />Actividades completadas <b>{ov.totals.completedItems} / {ov.totals.totalItems}</b></li>
              <li><i style={{ background: "var(--vx-primary)" }} />Asignaturas con avance <b>{ov.subjects.filter((subject) => (subject.percent ?? 0) > 0).length} / {ov.subjects.length}</b></li>
              <li><i style={{ background: "var(--vx-naranja)" }} />Metas de la semana <b>{metas.filter(cumplida).length} / {metas.length}</b></li>
              <li><i style={{ background: "var(--vx-primary)" }} />Repasos hoy <b>{repasosTotal}</b></li>
            </ul>
          ) : <p className="vx-empty">Aún no hay números disponibles.</p>}
        </section>
      </div>
    </VorticeShell>
  );
}