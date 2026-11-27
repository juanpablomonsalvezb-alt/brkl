import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, FileText, Link2 } from "lucide-react";
import { VorticeShell } from "@/components/vortice/VorticeShell";
import { SinSesion } from "./SinSesion";
import { useInicioDatos } from "./useInicioDatos";
import "./vortice.css";

const VISIBILIDAD = { privada: ["Privada", "var(--vx-surface)", "var(--vx-ink-soft)"], tutor: ["Tutor", "var(--vx-primary-soft)", "var(--vx-primary)"], familia: ["Familia", "var(--vx-acento-soft)", "var(--vx-primary)"] } as const;

export default function VorticePortafolio() {
  const [pestana, setPestana] = useState<"producciones" | "evaluaciones">("producciones");
  const datos = useInicioDatos({ portafolio: true });
  if (!datos.sesion) return <SinSesion cargando={datos.usuario.isLoading} enPreview={datos.enPreview} />;

  const nombre = datos.usuario.data?.firstName || datos.usuario.data?.name?.split(" ")[0] || null;
  const ov = datos.overview.data;
  const nivel = ov?.level;
  const evidencias = (datos.portafolio.data ?? []).filter((e) => (pestana === "evaluaciones" ? e.kind === "evaluacion" : e.kind !== "evaluacion"));

  return (
    <VorticeShell variante="estudiante" activo="portafolio" nombre={nombre} detalle={nivel?.name ?? "Sin curso asignado"} tramo={ov?.track} salirHref={datos.salir}>
      <div className="vx-pagina">
        <h1 className="vx-titulo">Portafolio</h1>
        <section className="vx-card" id="portafolio" aria-labelledby="vx-port">
          <header><h2 id="vx-port"><FileText aria-hidden="true" />Mi portafolio</h2></header>
          <Tabs value={pestana} onValueChange={(value) => setPestana(value as "producciones" | "evaluaciones")}>
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-(--vx-surface) border border-(--vx-line) p-1">
              <TabsTrigger
                value="producciones"
                className="rounded-lg py-1.5 text-sm text-(--vx-ink-soft) data-[state=active]:bg-white data-[state=active]:text-(--vx-ink) data-[state=active]:shadow-sm"
              >
                Producciones
              </TabsTrigger>
              <TabsTrigger
                value="evaluaciones"
                className="rounded-lg py-1.5 text-sm text-(--vx-ink-soft) data-[state=active]:bg-white data-[state=active]:text-(--vx-ink) data-[state=active]:shadow-sm"
              >
                Evaluaciones
              </TabsTrigger>
            </TabsList>
            {(["producciones", "evaluaciones"] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-3">
                {datos.portafolio.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-14 w-full rounded-xl bg-(--vx-surface)" />
                    <Skeleton className="h-14 w-full rounded-xl bg-(--vx-surface)" />
                  </div>
                ) : evidencias.length === 0 ? (
                  <Empty className="border border-dashed border-(--vx-line-strong) bg-(--vx-bg) py-6 px-4 md:py-7">
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><FileText className="text-(--vx-primary)" /></EmptyMedia>
                      <EmptyTitle className="text-base">
                        {tab === "producciones" ? "Sin producciones todavía" : "Sin evaluaciones registradas"}
                      </EmptyTitle>
                      <EmptyDescription>
                        {tab === "producciones"
                          ? "Aún no hay producciones en tu portafolio."
                          : "Aún no hay evaluaciones en tu portafolio."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <ItemGroup className="gap-2">
                    {evidencias.slice(0, 5).map((evidencia) => {
                      const [texto, fondo, color] = VISIBILIDAD[evidencia.visibility];
                      const Icono = evidencia.kind === "enlace" ? Link2 : evidencia.kind === "evaluacion" ? ClipboardCheck : FileText;
                      return (
                        <Item
                          key={evidencia.id}
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-(--vx-line) bg-(--vx-bg) px-3.5 py-2.5"
                        >
                          <ItemMedia
                            variant="icon"
                            className="rounded-lg border-transparent"
                            style={{
                              background: evidencia.kind === "enlace" ? "var(--vx-naranja-soft)" : "var(--vx-primary-soft)",
                              color: evidencia.kind === "enlace" ? "var(--vx-naranja-text)" : "var(--vx-primary)",
                            }}
                          >
                            <Icono aria-hidden="true" />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle className="text-(--vx-ink)">{evidencia.title}</ItemTitle>
                            <ItemDescription className="vx-portafolio-metadatos text-(--vx-ink-soft)">
                              {evidencia.evaluationTitle ?? (evidencia.kind === "enlace" ? "Enlace" : "Texto")} ·{" "}
                              {new Date(evidencia.createdAt).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <Badge
                              variant="outline"
                              className="vx-portafolio-etiqueta rounded-full border-transparent font-medium"
                              style={{ background: fondo, color }}
                              title="Quién puede verla"
                            >
                              {texto}
                            </Badge>
                          </ItemActions>
                        </Item>
                      );
                    })}
                  </ItemGroup>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </div>
    </VorticeShell>
  );
}