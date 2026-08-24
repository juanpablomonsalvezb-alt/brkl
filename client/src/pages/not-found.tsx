import { useEffect } from "react";
import { Link } from "wouter";

export default function NotFound() {
  useEffect(() => {
    document.title = "Página no encontrada — Barkley Online";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, follow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f4ede1] px-4">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-semibold tracking-wide text-[#b3541e] uppercase mb-3">
          Error 404
        </p>
        <h1 className="text-3xl font-bold text-[#003366] mb-3">
          Esta página no existe
        </h1>
        <p className="text-gray-600 mb-8">
          El enlace puede estar roto o la página se movió. Volvé al inicio para
          encontrar lo que buscabas.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#003366] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#002347] transition-colors"
        >
          Volver a Barkley Online
        </Link>
      </div>
    </div>
  );
}
