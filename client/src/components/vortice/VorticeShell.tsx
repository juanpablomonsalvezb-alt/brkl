import { useState, type ReactNode } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CalendarRange,
  Compass,
  Home,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PreferenciasLectura } from "@/pages/vortice/PreferenciasLectura";
import { BARRA_ESTUDIANTE, NAV_ESTUDIANTE, NAV_FAMILIA, type ItemNav } from "./navegacion";

interface VorticeShellProps {
  variante: "estudiante" | "familia";
  activo: string;
  nombre?: string | null;
  detalle?: string | null;
  tramo?: string | null;
  salirHref?: string;
  claseRaiz?: string;
  children: ReactNode;
}

const ICONOS_NAV: Record<string, LucideIcon> = {
  inicio: Home,
  aula: BookOpen,
  saber: Target,
  semana: CalendarDays,
  ano: CalendarRange,
  portafolio: BriefcaseBusiness,
  "tutor-virtual": MessageCircle,
  together: Users,
  resumen: Compass,
  asignaturas: BookOpen,
  evaluaciones: CalendarDays,
};

function EnlaceNav({
  item,
  activo,
  alNavegar,
  texto,
}: {
  item: ItemNav;
  activo: boolean;
  alNavegar?: () => void;
  texto?: string;
}) {
  const Icono = ICONOS_NAV[item.id];
  const contenido = <><Icono aria-hidden="true" size={20} /><span>{texto ?? item.texto}</span></>;
  const props = {
    className: "vx-enlace-nav",
    "aria-current": activo ? "page" as const : undefined,
    onClick: alNavegar,
  };

  return item.href.includes("#")
    ? <a href={item.href} {...props}>{contenido}</a>
    : <Link href={item.href} {...props}>{contenido}</Link>;
}

export function VorticeShell({
  variante,
  activo,
  nombre,
  detalle,
  tramo,
  salirHref,
  claseRaiz,
  children,
}: VorticeShellProps) {
  const [masAbierto, setMasAbierto] = useState(false);
  const esEstudiante = variante === "estudiante";
  const items = esEstudiante ? NAV_ESTUDIANTE : NAV_FAMILIA;
  const idsBarra = esEstudiante ? BARRA_ESTUDIANTE : items.map(({ id }) => id);
  const itemsBarra = items.filter(({ id }) => idsBarra.includes(id));
  const itemsMas = items.filter(({ id }) => !idsBarra.includes(id));
  const raiz = claseRaiz
    ? claseRaiz.split(/\s+/).includes("vx") ? claseRaiz : `vx ${claseRaiz}`
    : "vx";
  const inicial = nombre?.trim().charAt(0).toLocaleUpperCase() || (esEstudiante ? "E" : "A");
  const hrefMarca = esEstudiante ? "/vortice" : "/familia";
  const visibleEnBarra = new Set(idsBarra);

  return (
    <div className={raiz} data-tramo={tramo ?? undefined}>
      <a className="vx-saltar" href="#contenido">Saltar al contenido</a>
      <aside className="vx-side" aria-label="Menú principal">
        <Link className="vx-brand" href={hrefMarca}>
          BARKLEY<span>{esEstudiante ? "INSTITUTO" : "FAMILIA"}</span>
        </Link>
        <nav className="vx-nav" aria-label="Secciones">
          {items.map((item) => (
            <EnlaceNav key={item.id} item={item} activo={item.id === activo} />
          ))}
        </nav>
        {esEstudiante && <PreferenciasLectura />}
        <div className="vx-me">
          <div className="vx-avatar" aria-hidden="true">{inicial}</div>
          <div><b>{nombre ?? (esEstudiante ? "Estudiante" : "Apoderado")}</b>{detalle && <small>{detalle}</small>}</div>
          {salirHref && <a href={salirHref}>Salir</a>}
        </div>
      </aside>

      <nav className="vx-barra" aria-label="Secciones" data-variante={variante}>
        {itemsBarra.map((item) => (
          <EnlaceNav
            key={item.id}
            item={item}
            activo={item.id === activo}
            texto={esEstudiante && item.id === "semana" ? "Semana" : item.texto}
          />
        ))}
        <button
          className="vx-enlace-nav"
          type="button"
          aria-expanded={masAbierto}
          aria-haspopup="dialog"
          aria-current={!visibleEnBarra.has(activo) ? "page" : undefined}
          onClick={() => setMasAbierto(true)}
        >
          <MoreHorizontal aria-hidden="true" size={20} />
          <span>Más</span>
        </button>
      </nav>

      <main id="contenido" tabIndex={-1} className="vx-main">{children}</main>

      <Sheet open={masAbierto} onOpenChange={setMasAbierto}>
        <SheetContent side="bottom" className="vx-editorial vx-hoja-mas">
          <SheetHeader>
            <SheetTitle>Más</SheetTitle>
          </SheetHeader>
          <nav className="vx-hoja-mas-nav" aria-label="Más secciones">
            {itemsMas.map((item) => (
              <EnlaceNav
                key={item.id}
                item={item}
                activo={item.id === activo}
                alNavegar={() => setMasAbierto(false)}
              />
            ))}
            {salirHref && (
              <a className="vx-enlace-nav" href={salirHref} onClick={() => setMasAbierto(false)}>
                <LogOut aria-hidden="true" size={20} />
                <span>Salir</span>
              </a>
            )}
          </nav>
          {esEstudiante && <PreferenciasLectura />}
        </SheetContent>
      </Sheet>
    </div>
  );
}