import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Total de OA únicos por grado. Verificados contra los encabezados
// "Objetivo de Aprendizaje" de cada PDF oficial (script/extraer-curriculo.py).
// 4_basico: el PDF trae 33 encabezados; el OA 1 de Ciencias Naturales aparece
// dos veces con texto e indicadores idénticos (p. 8 y p. 9), se conserva una vez.
const TOTALES_OA: Record<string, number> = {
  "1_basico": 27,
  "2_basico": 33,
  "3_basico": 29,
  "4_basico": 32,
  "5_basico": 43,
  "6_basico": 44,
  "7_basico": 39,
  "8_basico": 40,
  "1_medio": 40,
  "2_medio": 39,
  "3_medio": 24,
  "4_medio": 20,
};

type OA = {
  numero: number;
  texto: string;
  indicadores: string[];
  eje: string | null;
};

const errores: string[] = [];
const carpeta = join(process.cwd(), "client/src/data/curriculo");
const ENCABEZADO_RESIDUAL = /Indicadores de Evaluación|Objetivo de Aprendizaje N/i;

if (Object.keys(TOTALES_OA).length !== 12) errores.push("Se esperan 12 grados.");

for (const [grado, totalEsperado] of Object.entries(TOTALES_OA)) {
  const archivo = join(carpeta, `${grado}.json`);
  if (!existsSync(archivo)) {
    errores.push(`Falta el archivo ${grado}.json.`);
    continue;
  }

  const contenido = JSON.parse(readFileSync(archivo, "utf8")) as {
    grado: string;
    asignaturas: { slug: string; oa: OA[] }[];
  };

  if (contenido.grado !== grado) errores.push(`${grado}.json declara el grado ${contenido.grado}.`);

  let total = 0;
  for (const asignatura of contenido.asignaturas) {
    if (asignatura.oa.length === 0) errores.push(`${grado}: ${asignatura.slug} no tiene OA.`);
    const porNumero = new Map<number, OA[]>();

    for (const oa of asignatura.oa) {
      total += 1;
      const rotulo = `${grado}: ${asignatura.slug} OA ${oa.numero}`;
      if (!oa.texto.trim()) errores.push(`${rotulo} no tiene texto.`);
      if (ENCABEZADO_RESIDUAL.test(oa.texto)) errores.push(`${rotulo} contiene un encabezado de tabla.`);
      for (const indicador of oa.indicadores) {
        if (ENCABEZADO_RESIDUAL.test(indicador)) errores.push(`${rotulo} tiene un encabezado de tabla en un indicador.`);
        if (indicador.trim().length < 8) {
          errores.push(`${rotulo} tiene un indicador incompleto: ${JSON.stringify(indicador)}.`);
        }
      }
      porNumero.set(oa.numero, [...(porNumero.get(oa.numero) ?? []), oa]);
    }

    for (const [numero, repetidos] of porNumero) {
      if (repetidos.length < 2) continue;
      const ejes = repetidos.map((oa) => oa.eje?.trim().toLocaleLowerCase() ?? "");
      if (ejes.some((eje) => !eje) || new Set(ejes).size !== ejes.length) {
        errores.push(`${grado}: ${asignatura.slug} OA ${numero} se repite sin un eje distinto para cada registro.`);
      }
    }
  }

  if (total !== totalEsperado) {
    errores.push(`${grado}: hay ${total} OA; el total verificado contra el PDF es ${totalEsperado}.`);
  }
}

if (errores.length > 0) {
  console.error(errores.join("\n"));
  process.exitCode = 1;
} else {
  console.log("curriculo.check: ok (12 grados)");
}
