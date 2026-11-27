export function SinSesion({ cargando, enPreview }: { cargando: boolean; enPreview: boolean }) {
  if (cargando) return <div className="vx-state" aria-busy="true"><div className="vx-skeleton" /></div>;
  return (
    <div className="vx" style={{ display: "block" }}>
      <div className="vx-state">
        <h1>Inicia sesión para ver tu espacio</h1>
        <p>Tu avance, tus metas de la semana y tu siguiente paso aparecen aquí cuando entras con tu cuenta.</p>
        <a className="vx-cta" href={enPreview ? "/api/preview/entrar" : "/api/login"}>Iniciar sesión</a>
      </div>
    </div>
  );
}