// Pantalla para usuarios sin sesión en páginas privadas. El servidor ya rechaza las API
// privadas (401); esto evita mostrar una interfaz vacía o engañosa.
export function loginUrl(): string {
  return typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app")
    ? "/api/preview/entrar"
    : "/api/login";
}

export function RequiereSesion({ titulo = "Inicia sesión para continuar" }: { titulo?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold text-primary">{titulo}</h1>
        <p className="text-muted-foreground">Esta sección es solo para estudiantes y equipo de Barkley con su cuenta.</p>
        <a href={loginUrl()} className="inline-flex rounded-md bg-primary px-5 py-2.5 text-primary-foreground font-medium">
          Iniciar sesión
        </a>
      </div>
    </div>
  );
}
