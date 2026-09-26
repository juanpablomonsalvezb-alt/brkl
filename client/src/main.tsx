import { createRoot } from "react-dom/client";
import App, { preloadRoute } from "./App";
import "./index.css";

// Error boundary para capturar errores de renderizado
window.addEventListener("error", (event) => {
  console.error("Error global:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Promise rechazada:", event.reason);
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("No se encontró el elemento root");
}

function montar(root: HTMLElement) {
  try {
    createRoot(root).render(<App />);
  } catch (error) {
    console.error("Error al renderizar la aplicación:", error);
    root.innerHTML = `
      <div style="padding: 2rem; font-family: system-ui; text-align: center;">
        <h1 style="color: #a51c30;">Error al cargar la aplicación</h1>
        <p>Por favor, abre la consola del navegador (F12) para ver los detalles del error.</p>
        <pre style="background: #f5f5f5; padding: 1rem; margin-top: 1rem; text-align: left; overflow: auto;">${error}</pre>
      </div>
    `;
  }
}

// Con HTML prerenderizado en #root, montar antes de tener el chunk de la ruta
// lo reemplazaría por el fallback vacío de Suspense (parpadeo en blanco).
// Si la precarga falla, se monta igual y lazy() reintenta.
preloadRoute(window.location.pathname)
  .catch(() => {})
  .then(() => montar(rootElement));
