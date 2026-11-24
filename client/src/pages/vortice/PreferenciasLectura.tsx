import { useState } from "react";
import { Type } from "lucide-react";
import {
  CONTRASTES,
  FUENTES,
  LECTURA_POR_DEFECTO,
  TAMANOS,
  type PreferenciasLectura as TipoPreferenciasLectura,
} from "@shared/lectura";
import { useLectura } from "@/lib/lectura";

const ETIQUETAS_TAMANO: Record<TipoPreferenciasLectura["tamano"], string> = {
  normal: "Normal",
  grande: "Grande",
  "muy-grande": "Muy grande",
};

const ETIQUETAS_FUENTE: Record<TipoPreferenciasLectura["fuente"], string> = {
  editorial: "Editorial (la de Vórtice)",
  legible: "Más legible (Atkinson Hyperlegible)",
};

const ETIQUETAS_CONTRASTE: Record<TipoPreferenciasLectura["contraste"], string> = {
  normal: "Normal",
  alto: "Alto",
};

export function PreferenciasLectura() {
  const [preferencias, cambiar] = useLectura();
  const [abierto, setAbierto] = useState(false);

  return (
    <section className="vx-lectura">
      <button
        className="vx-lectura-toggle"
        type="button"
        aria-expanded={abierto}
        aria-controls="vx-lectura-panel"
        onClick={() => setAbierto((actual) => !actual)}
      >
        <Type aria-hidden="true" size={18} />
        Preferencias de lectura
      </button>
      {abierto && (
        <div className="vx-lectura-panel" id="vx-lectura-panel">
          <fieldset>
            <legend>Tamaño del texto</legend>
            {TAMANOS.map((tamano) => (
              <label key={tamano}>
                <input
                  type="radio"
                  name="vx-lectura-tamano"
                  value={tamano}
                  checked={preferencias.tamano === tamano}
                  onChange={() => cambiar({ tamano })}
                />
                <span>{ETIQUETAS_TAMANO[tamano]}</span>
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Tipografía</legend>
            {FUENTES.map((fuente) => (
              <label key={fuente}>
                <input
                  type="radio"
                  name="vx-lectura-fuente"
                  value={fuente}
                  checked={preferencias.fuente === fuente}
                  onChange={() => cambiar({ fuente })}
                />
                <span>{ETIQUETAS_FUENTE[fuente]}</span>
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Contraste</legend>
            {CONTRASTES.map((contraste) => (
              <label key={contraste}>
                <input
                  type="radio"
                  name="vx-lectura-contraste"
                  value={contraste}
                  checked={preferencias.contraste === contraste}
                  onChange={() => cambiar({ contraste })}
                />
                <span>{ETIQUETAS_CONTRASTE[contraste]}</span>
              </label>
            ))}
          </fieldset>

          <p className="vx-lectura-guardado">Se guarda en este dispositivo.</p>
          <button className="vx-lectura-restablecer" type="button" onClick={() => cambiar(LECTURA_POR_DEFECTO)}>
            Restablecer
          </button>
          <p className="vx-lectura-preview">Así se verá tu texto.</p>
        </div>
      )}
    </section>
  );
}