import { lazy, type ComponentType } from "react";

/**
 * React.lazy con precarga. Si el módulo ya se cargó (vía preload() antes de
 * montar), renderiza el componente directo, sin pasar por Suspense: así el HTML
 * prerenderizado que trae la página no se reemplaza por un fallback en blanco.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pagina = ComponentType<any>;

export function lazyRoute(load: () => Promise<{ default: Pagina }>) {
  let Loaded: Pagina | null = null;
  let promise: Promise<void> | null = null;
  const preload = () =>
    (promise ??= load().then(
      (m) => {
        Loaded = m.default;
      },
      (err) => {
        promise = null;
        throw err;
      },
    ));
  const Lazy = lazy(() => preload().then(() => ({ default: Loaded as Pagina })));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function RouteComponent(props: any) {
    const Comp = (Loaded ?? Lazy) as Pagina;
    return <Comp {...props} />;
  }
  return Object.assign(RouteComponent, { preload });
}
