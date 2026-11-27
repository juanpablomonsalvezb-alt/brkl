// Catálogo privado de servidor del Aula Universal del piloto (Matemática 5.º Básico U3: OA 7, 8, 10, 11, 13).
// IMPORTANTE: Este módulo vive exclusivamente en `server/` porque contiene `respuestaCorrecta` y
// `explicacionCorrecta`. NUNCA debe importarse desde `client/` ni reexportarse en `shared/`.
import type {
  ApoyosLeccion,
  AlternativaItem,
  EjemploResuelto,
  EjercicioConPistasPublico,
  EjercicioSimplePublico,
  LeccionUniversalPublica,
  MicroTramo,
  OaPilotoId,
  PuertaAprendizaje,
  PuertaDetalle,
  VocabularioItem,
} from "@shared/aulaUniversal";

export interface EjercicioConPistasPrivado extends EjercicioConPistasPublico {
  respuestaCorrecta: string;
  explicacionCorrecta: string;
}

export interface EjercicioSimplePrivado extends EjercicioSimplePublico {
  respuestaCorrecta: string;
  explicacionCorrecta: string;
}

export interface LeccionUniversalPrivada {
  oaId: OaPilotoId;
  codigo: string;
  titulo: string;
  modulo: string;
  prioridad: "nucleo_examen" | "solo_nivel";
  objetivo: string;
  tiempoEstimadoMin: number;
  vocabulario: readonly VocabularioItem[];
  microTramos: readonly MicroTramo[];
  ejemploResuelto: EjemploResuelto;
  puertaSugerida: PuertaAprendizaje;
  puertas: Record<PuertaAprendizaje, PuertaDetalle>;
  apoyos: ApoyosLeccion;
  preguntaDiagnostico: EjercicioSimplePrivado;
  ejerciciosPractica: readonly [EjercicioConPistasPrivado, EjercicioConPistasPrivado];
  ejerciciosComprobacion: readonly [EjercicioSimplePrivado, EjercicioSimplePrivado, EjercicioSimplePrivado];
}

const LECCIONES_PILOTO_PRIVADAS: readonly LeccionUniversalPrivada[] = [
  {
    oaId: "oa7",
    codigo: "OA 7",
    titulo: "Fracciones propias, equivalentes y comparación",
    modulo: "Fracciones y decimales",
    prioridad: "nucleo_examen",
    objetivo: "Vas a representar fracciones propias, amplificar y simplificar fracciones equivalentes y comparar cuál es mayor.",
    tiempoEstimadoMin: 18,
    vocabulario: [
      { termino: "Fracción propia", definicion: "Fracción menor que 1 entero.", ejemplo: "3/4 (3 partes de 4)" },
      { termino: "Fracciones equivalentes", definicion: "Fracciones distintas que valen exactamente la misma cantidad.", ejemplo: "1/2 = 2/4 = 3/6" },
      { termino: "Amplificar", definicion: "Multiplicar el numerador y el denominador por el mismo número.", ejemplo: "3/4 × 2/2 = 6/8" },
      { termino: "Simplificar", definicion: "Dividir el numerador y el denominador por un mismo número hasta llegar a la irreductible.", ejemplo: "6/12 ÷ 6/6 = 1/2" },
    ],
    microTramos: [
      {
        titulo: "Tramo 1 · Amplificar sin cambiar el valor",
        consigna: "Lee cómo cambia la cantidad de partes manteniendo el mismo tamaño total.",
        contenido: "Cuando amplificas una fracción multiplicando arriba y abajo por el mismo número distinto de cero, obtienes partes más pequeñas pero cubres exactamente la misma cantidad del entero (1/2 = 2/4 = 4/8).",
      },
      {
        titulo: "Tramo 2 · Simplificar hasta irreductible",
        consigna: "Busca el número más grande que divide exacto arriba y abajo.",
        contenido: "Simplificar es dividir numerador y denominador por el mismo divisor. Una fracción es irreductible cuando ya no existe un divisor común mayor que 1, como pasar de 6/12 a 1/2 dividiendo por 6.",
      },
      {
        titulo: "Tramo 3 · Comparar con denominador común",
        consigna: "Iguala el denominador antes de decidir cuál fracción es mayor.",
        contenido: "Si tienen el mismo denominador, es mayor la de mayor numerador (5/7 > 2/7). Si tienen distinto denominador, las expresamos con denominador común: 2/3 = 8/12 y 3/4 = 9/12, por lo tanto 3/4 > 2/3.",
      },
    ],
    ejemploResuelto: {
      titulo: "Comparar 2/3 y 3/4 paso a paso",
      pasos: [
        "Buscamos un denominador común para 3 y 4: 12.",
        "Amplificamos cada fracción: 2/3 = 8/12 y 3/4 = 9/12.",
        "Como 8 < 9 con el mismo denominador, entonces 2/3 < 3/4.",
      ],
      errorFrecuente: "Sumar en lugar de multiplicar al amplificar (1/3 no pasa a 3/5 sumando 2; se multiplica por 2 para obtener 2/6).",
    },
    puertaSugerida: "video",
    puertas: {
      video: {
        tipo: "video",
        etiqueta: "Video guiado",
        duracion: "6 min",
        descripcion: "Explicación visual paso a paso con barras fraccionarias equivalentes.",
        transcripcion: "Comenzamos doblando una barra entera: si pintamos 2/3 y otra igual en 3/4, necesitamos partir ambas en 12 partes iguales. Así vemos 8/12 frente a 9/12.",
      },
      podcast: {
        tipo: "podcast",
        etiqueta: "Audio conversado",
        duracion: "7 min",
        descripcion: "Dos voces explican cómo amplificar, simplificar y evitar errores típicos.",
        transcripcion: "¿Por qué multiplicar arriba y abajo no agranda la fracción? Porque partes cada trozo en más pedazos pequeños manteniendo la misma barra completa.",
      },
      presentacion: {
        tipo: "presentacion",
        etiqueta: "Presentación en láminas",
        duracion: "8 láminas",
        descripcion: "Resumen visual con una regla por lámina y ejemplos ordenados.",
        transcripcion: "Lámina 1: Fracción propia < 1. Lámina 2: Amplificar = multiplicar arriba y abajo. Lámina 3: Simplificar = dividir arriba y abajo. Lámina 4: Comparar con denominador común.",
      },
      explorar: {
        tipo: "explorar",
        etiqueta: "Laboratorio visual",
        duracion: "5 min",
        descripcion: "Compara visualmente dos fracciones en una cuadrícula de barras.",
        transcripcion: "Prueba comparar fracciones en la cuadrícula: 8/12 frente a 9/12 muestran enseguida cuál cubre más entero.",
        explorarConfig: {
          titulo: "Barra equivalente: 8/12 frente a 9/12",
          descripcion: "Observa cómo 2/3 equivale a 8 partes de 12 y 3/4 equivale a 9 partes de 12.",
          izqEtiqueta: "2/3 (= 8/12)",
          izqValor: 67,
          derEtiqueta: "3/4 (= 9/12)",
          derValor: 75,
        },
      },
    },
    apoyos: {
      mapaMental: [
        { nodo: "Fracción propia", detalle: "Numerador menor que denominador (< 1)" },
        { nodo: "Amplificar", detalle: "Multiplicar arriba y abajo por el mismo número" },
        { nodo: "Simplificar", detalle: "Dividir arriba y abajo hasta que no se pueda más" },
        { nodo: "Comparar", detalle: "Igualar denominador para comparar numeradores" },
      ],
      infografiaResumen: [
        "1/2 = 2/4 = 3/6 = 4/8 = 5/10 representan exactamente la misma cantidad.",
        "Nunca sumes ni restes un número fijo arriba y abajo: siempre se multiplica o divide.",
        "Con denominador distinto, busca denominador común antes de ordenar.",
      ],
      tarjetas: [
        { frente: "¿Cuánto es 3/4 con denominador 8?", reverso: "6/8 (multiplicamos numerador y denominador por 2)." },
        { frente: "¿Cuál es la fracción irreductible de 6/12?", reverso: "1/2 (dividimos ambos términos por 6)." },
        { frente: "¿Qué fracción es mayor: 2/3 o 3/4?", reverso: "3/4, porque 9/12 > 8/12." },
      ],
    },
    preguntaDiagnostico: {
      id: "oa7-diag",
      enunciado: "¿Qué fracción es equivalente a 3/4?",
      alternativas: [
        { id: "A", texto: "6/8" },
        { id: "B", texto: "3/8" },
        { id: "C", texto: "4/6" },
        { id: "D", texto: "5/6" },
      ],
      respuestaCorrecta: "A",
      explicacionCorrecta: "Al multiplicar numerador y denominador por 2 resulta 6/8.",
    },
    ejerciciosPractica: [
      {
        id: "oa7-p1",
        enunciado: "En el aula dividimos una barra en 4 partes iguales y pintamos 3. Si la dividimos en 8 partes iguales, ¿cuántas partes debemos pintar para conservar la misma fracción?",
        alternativas: [
          { id: "A", texto: "6 partes (porque 3/4 = 6/8)" },
          { id: "B", texto: "3 partes (porque el numerador no cambia)" },
          { id: "C", texto: "4 partes (porque el denominador es 8 y 8 ÷ 2 = 4)" },
          { id: "D", texto: "8 partes (porque el denominador es 8)" },
        ],
        respuestaCorrecta: "A",
        pistas: [
          "Mira qué número multiplicó al denominador 4 para llegar a 8.",
          "Como 4 × 2 = 8, debes multiplicar también el numerador 3 por 2.",
          "Ejemplo similar: para pasar 1/2 a denominador 6, multiplicamos por 3 arriba y abajo: 1/2 = 3/6.",
        ],
        explicacionCorrecta: "Al amplificar 3/4 por 2 en numerador y denominador se obtiene 6/8.",
      },
      {
        id: "oa7-p2",
        enunciado: "En este ejemplo guiado, María tiene 2/3 de litro de jugo y Juan tiene 3/4 de litro. ¿Quién tiene una mayor cantidad de jugo?",
        alternativas: [
          { id: "A", texto: "María, porque 2/3 > 3/4" },
          { id: "B", texto: "Juan, porque 3/4 > 2/3 (8/12 < 9/12)" },
          { id: "C", texto: "Ambos tienen lo mismo" },
          { id: "D", texto: "No se puede saber sin dibujar las barras" },
        ],
        respuestaCorrecta: "B",
        pistas: [
          "No compares solo 2 con 3: primero transforma las dos fracciones al mismo denominador.",
          "Usa 12 como denominador común: amplifica 2/3 por 4 y amplifica 3/4 por 3.",
          "Ejemplo similar: para 1/2 y 2/5, con denominador 10 quedan 5/10 y 4/10, así que 1/2 > 2/5.",
        ],
        explicacionCorrecta: "Con denominador 12, 2/3 = 8/12 y 3/4 = 9/12, así que Juan tiene más jugo.",
      },
    ],
    ejerciciosComprobacion: [
      {
        id: "oa7-c1",
        enunciado: "Durante la clase, Sofía afirma que 2/6 equivale exactamente a 1/3. ¿Tiene razón Sofía?",
        alternativas: [
          { id: "A", texto: "Sí, porque 2 ÷ 2 = 1 y 6 ÷ 2 = 3, entonces 2/6 = 1/3" },
          { id: "B", texto: "No, porque 2/6 es mayor que 1/3" },
          { id: "C", texto: "No, porque 2/6 = 2/3" },
          { id: "D", texto: "No, porque 2/6 = 1/6 (se restó 1 al numerador)" },
        ],
        respuestaCorrecta: "A",
        explicacionCorrecta: "Simplificando 2/6 entre 2 en numerador y denominador resulta 1/3.",
      },
      {
        id: "oa7-c2",
        enunciado: "Observa una cuadrícula de 12 cuadritos con 6 pintados de azul. ¿Qué fracción simplificada representa la zona pintada?",
        alternativas: [
          { id: "A", texto: "6/12 (no se puede simplificar)" },
          { id: "B", texto: "3/6 (solo se simplificó por 2)" },
          { id: "C", texto: "1/2 (se simplificó dividiendo por 6)" },
          { id: "D", texto: "2/6 (se restó 4 al numerador y denominador)" },
        ],
        respuestaCorrecta: "C",
        explicacionCorrecta: "Dividiendo 6 y 12 por 6 se llega a la fracción irreductible 1/2.",
      },
      {
        id: "oa7-c3",
        enunciado: "Al comparar las fracciones propias 7/12 y 5/8, ¿cuál de las dos es mayor?",
        alternativas: [
          { id: "A", texto: "5/8, porque 5/8 = 15/24 y 7/12 = 14/24" },
          { id: "B", texto: "7/12, porque 7 > 5" },
          { id: "C", texto: "Son iguales" },
          { id: "D", texto: "Ninguna se puede comparar porque tienen distinto denominador" },
        ],
        respuestaCorrecta: "A",
        explicacionCorrecta: "En denominador 24, 5/8 = 15/24 y 7/12 = 14/24; 15/24 es mayor.",
      },
    ],
  },
  {
    oaId: "oa8",
    codigo: "OA 8",
    titulo: "Fracciones impropias y números mixtos",
    modulo: "Fracciones y decimales",
    prioridad: "solo_nivel",
    objetivo: "Vas a reconocer fracciones impropias y números mixtos y convertir con seguridad de uno a otro.",
    tiempoEstimadoMin: 15,
    vocabulario: [
      { termino: "Fracción impropia", definicion: "Fracción igual o mayor que 1: su numerador es igual o mayor que el denominador.", ejemplo: "7/4 o 4/3" },
      { termino: "Número mixto", definicion: "Número mayor que 1 formado por un entero y una fracción propia.", ejemplo: "1 3/4" },
    ],
    microTramos: [
      {
        titulo: "Tramo 1 · De fracción impropia a número mixto",
        consigna: "Divide el numerador entre el denominador para ver cuántos enteros caben.",
        contenido: "En 7/4, como 4/4 forma 1 entero, separamos 7/4 = 4/4 + 3/4 = 1 3/4. Dividiendo 7 ÷ 4 da 1 entero y resto 3 sobre el mismo denominador 4.",
      },
      {
        titulo: "Tramo 2 · De número mixto a fracción impropia",
        consigna: "Convierte cada entero en fracciones del mismo denominador y suma la parte fraccionaria.",
        contenido: "En 2 3/5, cada entero vale 5/5: dos enteros son 10/5, más 3/5 dan 13/5. En corto: (entero × denominador + numerador) sobre el mismo denominador.",
      },
    ],
    ejemploResuelto: {
      titulo: "Convertir 11/4 a número mixto",
      pasos: [
        "Dividimos 11 ÷ 4: cabe 2 veces exactas (2 × 4 = 8).",
        "Calculamos lo que sobra: 11 − 8 = 3.",
        "Armamos el número mixto conservando el denominador 4: 2 3/4.",
      ],
      errorFrecuente: "Poner el resto sobre el numerador original (7/4 = 1 3/4, nunca 1 3/7; el denominador no cambia).",
    },
    puertaSugerida: "presentacion",
    puertas: {
      video: {
        tipo: "video",
        etiqueta: "Video guiado",
        duracion: "5 min",
        descripcion: "Conversión usando envases de 1 litro y cuartos de litro.",
        transcripcion: "Si juntamos 1 litro completo (4/4 L) y 3/4 de litro más, tenemos 7/4 L en total, que es lo mismo que 1 3/4 L.",
      },
      podcast: {
        tipo: "podcast",
        etiqueta: "Audio conversado",
        duracion: "6 min",
        descripcion: "Por qué el denominador nunca cambia al convertir entre mixto e impropia.",
        transcripcion: "Si el envase está dividido en cuartos, el tamaño del trozo sigue siendo un cuarto antes y después de agrupar enteros.",
      },
      presentacion: {
        tipo: "presentacion",
        etiqueta: "Presentación en láminas",
        duracion: "6 láminas",
        descripcion: "Fórmulas visuales de ida y vuelta entre impropia y mixto.",
        transcripcion: "Lámina 1: Impropia >= 1. Lámina 2: Impropia a mixto = dividir y dejar resto sobre el denominador. Lámina 3: Mixto a impropia = entero × denominador + numerador.",
      },
      explorar: {
        tipo: "explorar",
        etiqueta: "Laboratorio visual",
        duracion: "4 min",
        descripcion: "Observa cómo 7 cuartos llenan 1 entero y sobran 3/4.",
        transcripcion: "7/4 = 4/4 + 3/4 = 1 3/4. Cada barra de 100 % equivale a 4/4.",
        explorarConfig: {
          titulo: "Un entero (4/4) frente a lo que sobra (3/4)",
          descripcion: "7/4 llena un entero completo y alcanza 75 % del segundo entero.",
          izqEtiqueta: "1 entero (4/4)",
          izqValor: 100,
          derEtiqueta: "Resto (3/4)",
          derValor: 75,
        },
      },
    },
    apoyos: {
      mapaMental: [
        { nodo: "Impropia a mixto", detalle: "Numerador ÷ denominador = entero y resto/denominador" },
        { nodo: "Mixto a impropia", detalle: "(Entero × denominador + numerador) / denominador" },
      ],
      infografiaResumen: [
        "El denominador indica en cuántas partes se parte cada entero y nunca se cambia al convertir.",
        "4/3 = 1 1/3 · 7/4 = 1 3/4 · 11/4 = 2 3/4 · 13/5 = 2 3/5.",
      ],
      tarjetas: [
        { frente: "¿Cómo se pasa 7/4 a número mixto?", reverso: "7 ÷ 4 = 1 y sobran 3, entonces 1 3/4." },
        { frente: "¿Qué fracción impropia es 2 3/5?", reverso: "(2 × 5 + 3) / 5 = 13/5." },
      ],
    },
    preguntaDiagnostico: {
      id: "oa8-diag",
      enunciado: "¿Qué número mixto representa a la fracción impropia 7/4?",
      alternativas: [
        { id: "A", texto: "1 3/4" },
        { id: "B", texto: "1 4/7" },
        { id: "C", texto: "2 1/4" },
        { id: "D", texto: "1 7/4" },
      ],
      respuestaCorrecta: "A",
      explicacionCorrecta: "7 ÷ 4 = 1 entero y sobran 3 cuartos, así que 7/4 = 1 3/4.",
    },
    ejerciciosPractica: [
      {
        id: "oa8-p1",
        enunciado: "En una práctica del aula, Ana reúne 2 tortas completas y 3/5 de otra. ¿Cuántos quintos de torta tiene en total?",
        alternativas: [
          { id: "A", texto: "11/5" },
          { id: "B", texto: "13/5" },
          { id: "C", texto: "10/5" },
          { id: "D", texto: "8/5" },
        ],
        respuestaCorrecta: "B",
        pistas: [
          "Recuerda cuántos quintos forman 1 torta completa.",
          "Multiplica los 2 enteros por 5 quintos (2 × 5) y luego suma los 3 quintos extra.",
          "Ejemplo similar: 1 1/3 son 3/3 + 1/3 = 4/3.",
        ],
        explicacionCorrecta: "2 × 5 + 3 = 13 quintos en total, es decir 13/5.",
      },
      {
        id: "oa8-p2",
        enunciado: "Sobre una recta numérica graduada en medios, ¿entre qué dos números enteros queda ubicada la fracción 5/2?",
        alternativas: [
          { id: "A", texto: "Entre 1 y 2" },
          { id: "B", texto: "Entre 2 y 3" },
          { id: "C", texto: "Entre 3 y 4" },
          { id: "D", texto: "Justo en el 2" },
        ],
        respuestaCorrecta: "B",
        pistas: [
          "Convierte 5/2 a número mixto dividiendo 5 entre 2.",
          "Como 5 ÷ 2 = 2 y sobra 1, tienes 2 1/2: piensa qué entero viene justo después de 2.",
          "Ejemplo similar: 3/2 = 1 1/2, por eso se ubica entre 1 y 2.",
        ],
        explicacionCorrecta: "5/2 equivale a 2 1/2, justo a la mitad entre 2 y 3.",
      },
    ],
    ejerciciosComprobacion: [
      {
        id: "oa8-c1",
        enunciado: "Una cinta del taller mide 11/4 de metro. ¿Cómo se expresa esa medida en metros enteros y cuartos de metro?",
        alternativas: [
          { id: "A", texto: "2 3/4 m" },
          { id: "B", texto: "2 4/11 m" },
          { id: "C", texto: "3 1/4 m" },
          { id: "D", texto: "1 7/4 m" },
        ],
        respuestaCorrecta: "A",
        explicacionCorrecta: "11 ÷ 4 = 2 y resto 3, conservando denominador 4: 2 3/4 m.",
      },
      {
        id: "oa8-c2",
        enunciado: "En su caminata, María recorrió 1 1/3 de kilómetro. ¿Qué fracción impropia representa exactamente esa distancia?",
        alternativas: [
          { id: "A", texto: "2/3" },
          { id: "B", texto: "3/3" },
          { id: "C", texto: "4/3" },
          { id: "D", texto: "5/3" },
        ],
        respuestaCorrecta: "C",
        explicacionCorrecta: "1 × 3 + 1 = 4 tercios, entonces 1 1/3 = 4/3.",
      },
      {
        id: "oa8-c3",
        enunciado: "En clase, Camila propone: «2 3/5 es igual a 11/5 porque 2 × 3 + 5 = 11». ¿Es correcto lo que dice Camila?",
        alternativas: [
          { id: "A", texto: "Sí, 2 3/5 = 11/5" },
          { id: "B", texto: "No, 2 3/5 = 13/5 porque se multiplica entero × denominador + numerador" },
          { id: "C", texto: "No, 2 3/5 = 10/5 porque 2 × 5 = 10" },
          { id: "D", texto: "No, 2 3/5 = 8/5 porque 2 + 3 + 5 = 10" },
        ],
        respuestaCorrecta: "B",
        explicacionCorrecta: "Siempre se multiplica entero por denominador y se suma el numerador: 2 × 5 + 3 = 13.",
      },
    ],
  },
  {
    oaId: "oa10",
    codigo: "OA 10",
    titulo: "Fracciones y su número decimal",
    modulo: "Fracciones y decimales",
    prioridad: "nucleo_examen",
    objetivo: "Vas a expresar fracciones con denominador 2, 4, 5 y 10 como número decimal y realizar el camino inverso.",
    tiempoEstimadoMin: 16,
    vocabulario: [
      { termino: "Fracción decimal", definicion: "Fracción cuyo denominador es 10, 100, 1 000 o puede amplificarse a esos valores.", ejemplo: "5/10 = 0,5" },
      { termino: "Décimo", definicion: "Una de 10 partes iguales del entero.", ejemplo: "1/10 = 0,1" },
      { termino: "Centésimo", definicion: "Una de 100 partes iguales del entero.", ejemplo: "1/100 = 0,01 y 1/4 = 25/100 = 0,25" },
    ],
    microTramos: [
      {
        titulo: "Tramo 1 · Llevar a denominador 10",
        consigna: "Amplifica medios y quintos para leerlos directo en décimos.",
        contenido: "Si multiplicamos 1/2 por 5 arriba y abajo obtenemos 5/10, que se lee cinco décimos y se escribe 0,5. Si multiplicamos 4/5 por 2 obtenemos 8/10 = 0,8.",
      },
      {
        titulo: "Tramo 2 · Dividir numerador entre denominador",
        consigna: "Divide cuando quieras pasar cualquier fracción a decimal.",
        contenido: "Toda fracción representa una división: en 3/4 dividimos 3 ÷ 4 = 0,75 (equivalente a 75/100). Así 1/4 = 0,25 y 3/4 = 0,75.",
      },
    ],
    ejemploResuelto: {
      titulo: "Escribir 3/5 como número decimal",
      pasos: [
        "Buscamos denominador 10 amplificando por 2: (3 × 2) / (5 × 2) = 6/10.",
        "Leemos 6/10 como seis décimos.",
        "Escribimos seis décimos en forma decimal: 0,6.",
      ],
      errorFrecuente: "Juntar los dígitos del numerador y denominador tras la coma (1/5 no es 0,15; 1/5 = 2/10 = 0,2).",
    },
    puertaSugerida: "video",
    puertas: {
      video: {
        tipo: "video",
        etiqueta: "Video guiado",
        duracion: "5 min",
        descripcion: "Paso visual de barra decimal (décimos y centésimos) a fracción.",
        transcripcion: "Dividimos una barra en 10 partes iguales: cada parte es 0,1. Cinco partes son 5/10 = 1/2 = 0,5.",
      },
      podcast: {
        tipo: "podcast",
        etiqueta: "Audio conversado",
        duracion: "6 min",
        descripcion: "Equivalencias clave que conviene reconocer al instante: 1/2, 1/4, 3/4 y quintos.",
        transcripcion: "Cada quinto equivale a 0,2. Por eso 1/5 = 0,2; 2/5 = 0,4; 3/5 = 0,6 y 4/5 = 0,8.",
      },
      presentacion: {
        tipo: "presentacion",
        etiqueta: "Presentación en láminas",
        duracion: "7 láminas",
        descripcion: "Tabla de equivalencias frecuentes de denominador 2, 4, 5 y 10.",
        transcripcion: "1/2 = 0,5 · 1/4 = 0,25 · 3/4 = 0,75 · 1/5 = 0,2 · 2/5 = 0,4 · 3/5 = 0,6 · 4/5 = 0,8.",
      },
      explorar: {
        tipo: "explorar",
        etiqueta: "Laboratorio visual",
        duracion: "4 min",
        descripcion: "Compara porcentajes cubiertos por 1/4 (0,25) y 3/4 (0,75).",
        transcripcion: "Un cuarto cubre 25 de 100 cuadritos (0,25) y tres cuartos cubren 75 de 100 (0,75).",
        explorarConfig: {
          titulo: "Cuartos en una cuadrícula de 100",
          descripcion: "1/4 equivale a 0,25 y 3/4 equivale a 0,75.",
          izqEtiqueta: "1/4 = 0,25",
          izqValor: 25,
          derEtiqueta: "3/4 = 0,75",
          derValor: 75,
        },
      },
    },
    apoyos: {
      mapaMental: [
        { nodo: "Método 1", detalle: "Amplificar a denominador 10 o 100" },
        { nodo: "Método 2", detalle: "Dividir numerador ÷ denominador" },
        { nodo: "Camino inverso", detalle: "Leer posición (décimos = /10) y simplificar" },
      ],
      infografiaResumen: [
        "1/2 = 0,5 · 1/4 = 0,25 · 3/4 = 0,75.",
        "1/5 = 0,2 · 2/5 = 0,4 · 3/5 = 0,6 · 4/5 = 0,8 · 1/10 = 0,1.",
      ],
      tarjetas: [
        { frente: "¿A qué decimal equivale 3/4?", reverso: "0,75 (porque 3 ÷ 4 = 0,75 = 75/100)." },
        { frente: "¿Qué fracción con denominador 5 es 0,4?", reverso: "2/5 (porque 0,4 = 4/10 = 2/5)." },
      ],
    },
    preguntaDiagnostico: {
      id: "oa10-diag",
      enunciado: "Ana tiene medio litro de jugo. ¿Cómo se escribe 1/2 como número decimal?",
      alternativas: [
        { id: "A", texto: "0,5" },
        { id: "B", texto: "0,2" },
        { id: "C", texto: "1,2" },
        { id: "D", texto: "0,12" },
      ],
      respuestaCorrecta: "A",
      explicacionCorrecta: "1/2 amplificado por 5 es 5/10, que se escribe 0,5.",
    },
    ejerciciosPractica: [
      {
        id: "oa10-p1",
        enunciado: "Si una barra se parte en 4 trozos iguales y se colorean 3, ¿qué número decimal corresponde a 3/4?",
        alternativas: [
          { id: "A", texto: "0,34" },
          { id: "B", texto: "0,75" },
          { id: "C", texto: "0,3" },
          { id: "D", texto: "0,43" },
        ],
        respuestaCorrecta: "B",
        pistas: [
          "Recuerda que 1/4 equivale a 25 de 100 partes (0,25).",
          "Divide 3 entre 4 o suma tres veces 0,25.",
          "Ejemplo similar: 1/4 = 1 ÷ 4 = 0,25.",
        ],
        explicacionCorrecta: "Dividiendo 3 ÷ 4 se obtiene 0,75 (75 centésimos).",
      },
      {
        id: "oa10-p2",
        enunciado: "Un envase escolar contiene 0,6 litros de agua. ¿Qué fracción con denominador 5 equivale a 0,6?",
        alternativas: [
          { id: "A", texto: "1/5 (que es 0,2)" },
          { id: "B", texto: "2/5 (que es 0,4)" },
          { id: "C", texto: "3/5 (que es 0,6)" },
          { id: "D", texto: "6/5 (que es 1,2)" },
        ],
        respuestaCorrecta: "C",
        pistas: [
          "Lee 0,6 como seis décimos y escríbelo como 6/10.",
          "Simplifica 6/10 dividiendo arriba y abajo por 2 para obtener denominador 5.",
          "Ejemplo similar: 0,4 = 4/10; simplificado por 2 es 2/5.",
        ],
        explicacionCorrecta: "0,6 es 6/10, y al simplificar por 2 queda 3/5.",
      },
    ],
    ejerciciosComprobacion: [
      {
        id: "oa10-c1",
        enunciado: "En la carrera del colegio, Carolina avanzó 2/5 del recorrido total. ¿Qué número decimal representa 2/5?",
        alternativas: [
          { id: "A", texto: "0,25" },
          { id: "B", texto: "0,5" },
          { id: "C", texto: "0,4" },
          { id: "D", texto: "0,2" },
        ],
        respuestaCorrecta: "C",
        explicacionCorrecta: "2/5 amplificado por 2 es 4/10, igual a 0,4.",
      },
      {
        id: "oa10-c2",
        enunciado: "En una cuadrícula de 10 columnas iguales hay 7 columnas azules. ¿Qué número decimal representa esa parte?",
        alternativas: [
          { id: "A", texto: "0,7" },
          { id: "B", texto: "0,07" },
          { id: "C", texto: "7,0" },
          { id: "D", texto: "0,17" },
        ],
        respuestaCorrecta: "A",
        explicacionCorrecta: "7 de 10 columnas corresponde a 7/10 = 0,7.",
      },
      {
        id: "oa10-c3",
        enunciado: "Felipe comenta en clase: «3/10 se escribe 0,30 y eso es distinto de 0,3 porque 30 es mayor que 3». ¿Tiene razón Felipe?",
        alternativas: [
          { id: "A", texto: "Sí, 0,30 es mayor que 0,3" },
          { id: "B", texto: "No, son iguales: los ceros al final no cambian el valor" },
          { id: "C", texto: "No, 3/10 = 0,03" },
          { id: "D", texto: "No, 3/10 = 3,10 porque el 3 y el 10 se escriben a los lados de la coma" },
        ],
        respuestaCorrecta: "B",
        explicacionCorrecta: "Completar con ceros a la derecha de los decimales no cambia el valor: 0,30 = 0,3.",
      },
    ],
  },
  {
    oaId: "oa11",
    codigo: "OA 11",
    titulo: "Comparar y ordenar decimales hasta la milésima",
    modulo: "Fracciones y decimales",
    prioridad: "nucleo_examen",
    objetivo: "Vas a comparar y ordenar números decimales hasta la milésima usando el valor posicional y completando con ceros.",
    tiempoEstimadoMin: 16,
    vocabulario: [
      { termino: "Décimo", definicion: "Primera cifra a la derecha de la coma.", ejemplo: "0,1 (1 de 10 partes)" },
      { termino: "Centésimo", definicion: "Segunda cifra a la derecha de la coma.", ejemplo: "0,01 (1 de 100 partes)" },
      { termino: "Milésimo", definicion: "Tercera cifra a la derecha de la coma.", ejemplo: "0,001 (1 de 1 000 partes)" },
    ],
    microTramos: [
      {
        titulo: "Tramo 1 · Comparar de izquierda a derecha",
        consigna: "Siempre parte comparando la posición de mayor valor.",
        contenido: "Primero compara la parte entera. Si son iguales, compara los décimos; si empatan, los centésimos; y luego los milésimos. Por eso 0,9 es mayor que 0,009 (9 décimos > 0 décimos).",
      },
      {
        titulo: "Tramo 2 · Completar con ceros al final",
        consigna: "Iguala la cantidad de cifras decimales antes de comparar.",
        contenido: "Los ceros al final de la parte decimal no cambian el valor (0,5 = 0,50 = 0,500). Al escribir 0,45 y 0,50 ves de inmediato que 0,45 < 0,50.",
      },
    ],
    ejemploResuelto: {
      titulo: "Comparar 0,45 y 0,5 paso a paso",
      pasos: [
        "Completamos con ceros al final para tener las mismas cifras: 0,45 y 0,50.",
        "Comparamos las unidades: 0 y 0, están empatadas.",
        "Comparamos los décimos: 4 < 5, por lo tanto 0,45 < 0,5.",
      ],
      errorFrecuente: "Creer que un decimal con más cifras es automáticamente mayor (0,125 < 0,9 porque 1 décimo < 9 décimos).",
    },
    puertaSugerida: "explorar",
    puertas: {
      video: {
        tipo: "video",
        etiqueta: "Video guiado",
        duracion: "6 min",
        descripcion: "Demostración visual de 0,45 vs 0,5 en cuadrícula de 100 partes.",
        transcripcion: "45 cuadritos frente a 50 cuadritos muestran por qué 0,5 cubre más que 0,45.",
      },
      podcast: {
        tipo: "podcast",
        etiqueta: "Audio conversado",
        duracion: "6 min",
        descripcion: "El truco de completar con ceros sin cambiar el valor del número.",
        transcripcion: "Cuando empatan las unidades, agrega ceros a la derecha para comparar milésimos con milésimos sin equivocarte.",
      },
      presentacion: {
        tipo: "presentacion",
        etiqueta: "Presentación en láminas",
        duracion: "6 láminas",
        descripcion: "Regla ordenada en 3 pasos: parte entera, completar con ceros y comparar.",
        transcripcion: "Lámina 1: Parte entera. Lámina 2: Completar con ceros. Lámina 3: Décimos, centésimos y milésimos.",
      },
      explorar: {
        tipo: "explorar",
        etiqueta: "Laboratorio visual",
        duracion: "5 min",
        descripcion: "Compara 0,45 y 0,50 sobre enteros partidos en 100 partes.",
        transcripcion: "0,45 cubre 45 centésimos mientras 0,5 equivale a 50 centésimos (0,50).",
        explorarConfig: {
          titulo: "0,45 frente a 0,5 (= 0,50)",
          descripcion: "Al expresar ambos en centésimos se ve directo que 45 < 50.",
          izqEtiqueta: "0,45 (45 centésimos)",
          izqValor: 45,
          derEtiqueta: "0,5 = 0,50 (50 centésimos)",
          derValor: 50,
        },
      },
    },
    apoyos: {
      mapaMental: [
        { nodo: "1. Parte entera", detalle: "Si es distinta, gana el entero mayor" },
        { nodo: "2. Igualar cifras", detalle: "Agregar ceros al final no cambia el valor" },
        { nodo: "3. Posición por posición", detalle: "Décimos -> centésimos -> milésimos" },
      ],
      infografiaResumen: [
        "Más cifras después de la coma NO significa número mayor: 0,9 > 0,009.",
        "0,4 = 0,40 = 0,400.",
      ],
      tarjetas: [
        { frente: "¿Qué número es mayor: 0,7 o 0,69?", reverso: "0,7 (= 0,70), porque en los décimos 7 > 6." },
        { frente: "¿Son distintos 9,99 y 9,990?", reverso: "Son iguales: los ceros finales no cambian el valor." },
      ],
    },
    preguntaDiagnostico: {
      id: "oa11-diag",
      enunciado: "María compró 0,7 litros de jugo y Pedro compró 0,69 litros. ¿Quién compró más jugo?",
      alternativas: [
        { id: "A", texto: "María, porque 0,7 > 0,69" },
        { id: "B", texto: "Pedro, porque 0,69 > 0,7" },
        { id: "C", texto: "Compraron la misma cantidad" },
        { id: "D", texto: "No se puede comparar porque tienen distinta cantidad de cifras" },
      ],
      respuestaCorrecta: "A",
      explicacionCorrecta: "0,7 = 0,70 y en los décimos 7 > 6, así que 0,7 > 0,69.",
    },
    ejerciciosPractica: [
      {
        id: "oa11-p1",
        enunciado: "Compara los decimales 0,900 y 0,009 indicando si corresponde >, < o =.",
        alternativas: [
          { id: "A", texto: "0,900 > 0,009" },
          { id: "B", texto: "0,900 < 0,009" },
          { id: "C", texto: "0,900 = 0,009" },
          { id: "D", texto: "No se pueden comparar porque tienen distinta cantidad de ceros" },
        ],
        respuestaCorrecta: "A",
        pistas: [
          "Mira la primera cifra justo después de la coma (los décimos).",
          "En 0,900 hay 9 décimos y en 0,009 hay 0 décimos.",
          "Ejemplo similar: 0,4 > 0,04 porque 4 décimos valen más que 0 décimos.",
        ],
        explicacionCorrecta: "En los décimos, 9 es mayor que 0, entonces 0,900 > 0,009.",
      },
      {
        id: "oa11-p2",
        enunciado: "Ordena de mayor a menor los siguientes decimales: 1 ; 0,1 ; 0,011.",
        alternativas: [
          { id: "A", texto: "1 > 0,1 > 0,011" },
          { id: "B", texto: "0,011 > 0,1 > 1" },
          { id: "C", texto: "0,1 > 1 > 0,011" },
          { id: "D", texto: "1 > 0,011 > 0,1" },
        ],
        respuestaCorrecta: "A",
        pistas: [
          "Completa todos con tres cifras decimales para verlos parejos: 1,000 ; 0,100 ; 0,011.",
          "Compara primero la parte entera (1 frente a 0) y luego los décimos entre los que tienen entero 0.",
          "Ejemplo similar: 2 > 0,5 > 0,055 porque 2,000 > 0,500 > 0,055.",
        ],
        explicacionCorrecta: "1,000 es el mayor; luego 0,100 tiene 1 décimo y 0,011 tiene 0 décimos.",
      },
    ],
    ejerciciosComprobacion: [
      {
        id: "oa11-c1",
        enunciado: "En la sala pesaron tres mochilas (en kg): 2,340 ; 2,304 ; 2,403. Ordénalas de menor a mayor.",
        alternativas: [
          { id: "A", texto: "2,304 < 2,340 < 2,403" },
          { id: "B", texto: "2,340 < 2,304 < 2,403" },
          { id: "C", texto: "2,403 < 2,340 < 2,304" },
          { id: "D", texto: "2,304 < 2,403 < 2,340" },
        ],
        respuestaCorrecta: "A",
        explicacionCorrecta: "En 2,304 hay 0 centésimos, en 2,340 hay 4 centésimos y 2,403 tiene 4 décimos.",
      },
      {
        id: "oa11-c2",
        enunciado: "Al pesar dos paquetes de harina se registró 5,025 kg y 5,250 kg. ¿Cuál de los dos pesos es menor?",
        alternativas: [
          { id: "A", texto: "5,025 kg" },
          { id: "B", texto: "5,250 kg" },
          { id: "C", texto: "Son iguales" },
          { id: "D", texto: "5,025 kg es mayor porque 250 > 25" },
        ],
        respuestaCorrecta: "A",
        explicacionCorrecta: "En los décimos, 0 es menor que 2, por eso 5,025 kg es menor.",
      },
      {
        id: "oa11-c3",
        enunciado: "Al comparar 9,99 y 9,990, ¿qué signo corresponde (>, < o =)?",
        alternativas: [
          { id: "A", texto: "9,99 = 9,990" },
          { id: "B", texto: "9,99 < 9,990" },
          { id: "C", texto: "9,99 > 9,990" },
          { id: "D", texto: "No se pueden comparar porque tienen distinta cantidad de cifras" },
        ],
        respuestaCorrecta: "A",
        explicacionCorrecta: "Completar con cero en los milésimos muestra que 9,990 = 9,990.",
      },
    ],
  },
  {
    oaId: "oa13",
    codigo: "OA 13",
    titulo: "Problemas con suma y resta de fracciones y decimales",
    modulo: "Fracciones y decimales",
    prioridad: "nucleo_examen",
    objetivo: "Vas a resolver problemas sumando y restando fracciones propias con denominador común y decimales alineando la coma.",
    tiempoEstimadoMin: 18,
    vocabulario: [
      { termino: "Denominador común", definicion: "Mismo denominador compartido por dos fracciones antes de sumar o restar.", ejemplo: "1/3 + 1/2 = 2/6 + 3/6 = 5/6" },
      { termino: "Alinear la coma", definicion: "Ubicar las comas decimales exactamente una debajo de otra al sumar o restar en columna.", ejemplo: "0,50 + 0,25 = 0,75" },
    ],
    microTramos: [
      {
        titulo: "Tramo 1 · Sumar y restar fracciones",
        consigna: "Nunca sumes ni restes denominadores distintos entre sí.",
        contenido: "Con igual denominador se operan solo los numeradores (4/5 − 1/5 = 3/5). Con distinto denominador primero amplificas a un denominador común: 1/3 + 1/2 = 2/6 + 3/6 = 5/6.",
      },
      {
        titulo: "Tramo 2 · Sumar y restar decimales",
        consigna: "Alinea las comas y completa con ceros si falta alguna cifra.",
        contenido: "Escribimos los números en columna haciendo coincidir cada posición (unidades, décimos, centésimos, milésimos). Al restar 3,4 − 1,84 completamos 3,40 − 1,84 = 1,56.",
      },
    ],
    ejemploResuelto: {
      titulo: "Sumar 1/4 + 1/3 paso a paso",
      pasos: [
        "Buscamos un denominador común para 4 y 3: 12.",
        "Amplificamos ambas fracciones: 1/4 = 3/12 y 1/3 = 4/12.",
        "Sumamos los numeradores conservando el denominador 12: 3/12 + 4/12 = 7/12.",
      ],
      errorFrecuente: "Sumar numeradores y denominadores por separado (1/3 + 1/4 no es 2/7) o correr la coma decimal al no alinear.",
    },
    puertaSugerida: "video",
    puertas: {
      video: {
        tipo: "video",
        etiqueta: "Video guiado",
        duracion: "6 min",
        descripcion: "Suma y resta de fracciones con barras y alineación vertical de comas.",
        transcripcion: "Primero igualamos los tamaños de las partes en fracciones y luego vemos la suma en columna de 1,250 + 0,875 = 2,125.",
      },
      podcast: {
        tipo: "podcast",
        etiqueta: "Audio conversado",
        duracion: "6 min",
        descripcion: "Por qué el denominador funciona como el nombre de la unidad que estás sumando.",
        transcripcion: "No puedes sumar tercios con cuartos directo; igual que con monedas, primero pasas todo a doceavos.",
      },
      presentacion: {
        tipo: "presentacion",
        etiqueta: "Presentación en láminas",
        duracion: "6 láminas",
        descripcion: "Checklist antes de calcular: mismo denominador o comas alineadas.",
        transcripcion: "Fracciones = igual denominador. Decimales = comas en línea vertical y ceros al final si faltan cifras.",
      },
      explorar: {
        tipo: "explorar",
        etiqueta: "Laboratorio visual",
        duracion: "5 min",
        descripcion: "Visualiza la unión de 1/4 (3/12) y 1/3 (4/12) para obtener 7/12.",
        transcripcion: "3/12 ocupa el 25 % del entero y 4/12 ocupa 33 %; juntos llegan a 7/12 (58 %).",
        explorarConfig: {
          titulo: "Partes de 1/4 frente a 1/3 del entero",
          descripcion: "Al convertir ambos a doceavos ves directo cuántas partes cubre cada fracción.",
          izqEtiqueta: "1/4 = 3/12",
          izqValor: 25,
          derEtiqueta: "1/3 = 4/12",
          derValor: 33,
        },
      },
    },
    apoyos: {
      mapaMental: [
        { nodo: "Fracciones", detalle: "Mismo denominador -> operar solo numeradores" },
        { nodo: "Decimales", detalle: "Alinear comas -> completar con ceros -> operar" },
      ],
      infografiaResumen: [
        "1/3 + 1/2 = 2/6 + 3/6 = 5/6.",
        "0,5 + 0,25 = 0,50 + 0,25 = 0,75.",
      ],
      tarjetas: [
        { frente: "¿Cuánto es 1/3 + 1/4?", reverso: "7/12 (4/12 + 3/12 = 7/12)." },
        { frente: "¿Cuánto es 0,5 + 0,25?", reverso: "0,75 (alineando las comas: 0,50 + 0,25)." },
      ],
    },
    preguntaDiagnostico: {
      id: "oa13-diag",
      enunciado: "Ana tenía 4/5 de litro de jugo y se tomó 1/5 de litro. ¿Cuánto jugo le queda?",
      alternativas: [
        { id: "A", texto: "3/5 de litro" },
        { id: "B", texto: "5/5 de litro" },
        { id: "C", texto: "3/10 de litro" },
        { id: "D", texto: "4/5 de litro" },
      ],
      respuestaCorrecta: "A",
      explicacionCorrecta: "Con el mismo denominador se restan los numeradores: 4 − 1 = 3 quintos.",
    },
    ejerciciosPractica: [
      {
        id: "oa13-p1",
        enunciado: "Si juntas el agua de una botella con 1/3 de litro y otra con 1/2 de litro, ¿cuántos litros obtienes en total?",
        alternativas: [
          { id: "A", texto: "2/5 de litro" },
          { id: "B", texto: "5/6 de litro" },
          { id: "C", texto: "1/6 de litro" },
          { id: "D", texto: "2/6 de litro" },
        ],
        respuestaCorrecta: "B",
        pistas: [
          "No sumes 3 + 2 en el denominador: busca un denominador común para 3 y 2.",
          "Usa 6 como denominador común: amplifica 1/3 a 2/6 y 1/2 a 3/6.",
          "Ejemplo similar: 1/2 + 1/4 = 2/4 + 1/4 = 3/4.",
        ],
        explicacionCorrecta: "1/3 = 2/6 y 1/2 = 3/6, así que juntos forman 5/6 de litro.",
      },
      {
        id: "oa13-p2",
        enunciado: "Un sendero junto al río mide 3,400 metros en su tramo norte y 1,840 metros en el sur. ¿Cuántos metros más largo es el tramo norte?",
        alternativas: [
          { id: "A", texto: "1,560 m" },
          { id: "B", texto: "1,460 m" },
          { id: "C", texto: "2,440 m" },
          { id: "D", texto: "1,660 m" },
        ],
        respuestaCorrecta: "A",
        pistas: [
          "Alinea 3,400 sobre 1,840 haciendo coincidir la coma decimal.",
          "Resta desde la derecha; en los centésimos pide préstamo (10 − 4 = 6) y en los décimos (13 − 8 = 5).",
          "Ejemplo similar: 2,400 − 1,250 = 1,150.",
        ],
        explicacionCorrecta: "3,400 − 1,840 = 1,560 metros.",
      },
    ],
    ejerciciosComprobacion: [
      {
        id: "oa13-c1",
        enunciado: "Se unen dos cintas que miden 1,250 m y 0,875 m. ¿Cuál es la longitud total al juntarlas?",
        alternativas: [
          { id: "A", texto: "2,125 m" },
          { id: "B", texto: "1,325 m" },
          { id: "C", texto: "2,025 m" },
          { id: "D", texto: "1,925 m" },
        ],
        respuestaCorrecta: "A",
        explicacionCorrecta: "Alineando la coma: 1,250 + 0,875 = 2,125 m.",
      },
      {
        id: "oa13-c2",
        enunciado: "De un estanque con 5,480 litros de agua se utilizan 2,150 litros. ¿Cuántos litros quedan disponibles?",
        alternativas: [
          { id: "A", texto: "3,330 litros" },
          { id: "B", texto: "3,370 litros" },
          { id: "C", texto: "2,330 litros" },
          { id: "D", texto: "7,630 litros" },
        ],
        respuestaCorrecta: "A",
        explicacionCorrecta: "5,480 − 2,150 = 3,330 litros.",
      },
      {
        id: "oa13-c3",
        enunciado: "En el aula, Camila calcula: «0,5 + 0,25 = 0,30, porque sumo 5 + 25 = 30 y pongo la coma». ¿Es correcto su razonamiento?",
        alternativas: [
          { id: "A", texto: "Sí, 0,5 + 0,25 = 0,30" },
          { id: "B", texto: "No, 0,5 + 0,25 = 0,750 porque se alinean las comas" },
          { id: "C", texto: "No, 0,5 + 0,25 = 0,20 porque 5 − 25 = −20" },
          { id: "D", texto: "No, 0,5 + 0,25 = 0,525 porque se juntan los números" },
        ],
        respuestaCorrecta: "B",
        explicacionCorrecta: "Alineando las comas y completando con cero: 0,50 + 0,25 = 0,75.",
      },
    ],
  },
];

function limpiarSimple(ej: EjercicioSimplePrivado): EjercicioSimplePublico {
  return {
    id: ej.id,
    enunciado: ej.enunciado,
    alternativas: ej.alternativas.map((a): AlternativaItem => ({ id: a.id, texto: a.texto })),
  };
}

function limpiarPractica(ej: EjercicioConPistasPrivado): EjercicioConPistasPublico {
  return {
    id: ej.id,
    enunciado: ej.enunciado,
    alternativas: ej.alternativas.map((a): AlternativaItem => ({ id: a.id, texto: a.texto })),
    pistas: [ej.pistas[0], ej.pistas[1], ej.pistas[2]],
  };
}

export function sanitizarLeccionPublica(leccion: LeccionUniversalPrivada): LeccionUniversalPublica {
  return {
    oaId: leccion.oaId,
    codigo: leccion.codigo,
    titulo: leccion.titulo,
    modulo: leccion.modulo,
    prioridad: leccion.prioridad,
    objetivo: leccion.objetivo,
    tiempoEstimadoMin: leccion.tiempoEstimadoMin,
    vocabulario: leccion.vocabulario,
    microTramos: leccion.microTramos,
    ejemploResuelto: leccion.ejemploResuelto,
    puertaSugerida: leccion.puertaSugerida,
    puertas: leccion.puertas,
    apoyos: leccion.apoyos,
    preguntaDiagnostico: limpiarSimple(leccion.preguntaDiagnostico),
    ejerciciosPractica: [
      limpiarPractica(leccion.ejerciciosPractica[0]),
      limpiarPractica(leccion.ejerciciosPractica[1]),
    ],
    ejerciciosComprobacion: [
      limpiarSimple(leccion.ejerciciosComprobacion[0]),
      limpiarSimple(leccion.ejerciciosComprobacion[1]),
      limpiarSimple(leccion.ejerciciosComprobacion[2]),
    ],
  };
}

/** Catálogo privado completo (solo para siembra y corrección interna en servidor). */
export function obtenerLeccionesPilotoPrivadas(): readonly LeccionUniversalPrivada[] {
  return LECCIONES_PILOTO_PRIVADAS;
}

export function obtenerLeccionPrivadaPorOa(oaId: string): LeccionUniversalPrivada | null {
  return LECCIONES_PILOTO_PRIVADAS.find((l) => l.oaId === oaId) ?? null;
}

/** Catálogo público seguro para cliente: sin `respuestaCorrecta` ni `explicacionCorrecta`. */
export function obtenerLeccionesPilotoPublicas(): readonly LeccionUniversalPublica[] {
  return LECCIONES_PILOTO_PRIVADAS.map(sanitizarLeccionPublica);
}

export function obtenerLeccionPublicaPorOa(oaId: string): LeccionUniversalPublica | null {
  const priv = obtenerLeccionPrivadaPorOa(oaId);
  return priv ? sanitizarLeccionPublica(priv) : null;
}

export function evaluarDiagnosticoCero(respuestas: Record<string, string>): {
  porOa: Array<{
    oaId: string;
    codigo: string;
    titulo: string;
    recomendacion: "ya_lo_se_sugerido" | "conviene_estudiar";
  }>;
  sugeridosRepasar: string[];
  sugeridosYaLoSe: string[];
} {
  const porOa: Array<{
    oaId: string;
    codigo: string;
    titulo: string;
    recomendacion: "ya_lo_se_sugerido" | "conviene_estudiar";
  }> = [];
  const sugeridosRepasar: string[] = [];
  const sugeridosYaLoSe: string[] = [];

  for (const leccion of LECCIONES_PILOTO_PRIVADAS) {
    const marcada = respuestas[leccion.preguntaDiagnostico.id] ?? respuestas[leccion.oaId];
    const acierta = marcada === leccion.preguntaDiagnostico.respuestaCorrecta;
    const recomendacion = acierta ? "ya_lo_se_sugerido" : "conviene_estudiar";
    porOa.push({
      oaId: leccion.oaId,
      codigo: leccion.codigo,
      titulo: leccion.titulo,
      recomendacion,
    });
    if (acierta) {
      sugeridosYaLoSe.push(leccion.oaId);
    } else {
      sugeridosRepasar.push(leccion.oaId);
    }
  }

  return { porOa, sugeridosRepasar, sugeridosYaLoSe };
}

export function evaluarEjercicioPractica(
  oaId: string,
  preguntaId: string,
  opcionId: string,
): { ok: true; correcta: boolean; explicacion: string | null } | { ok: false; status: 400 | 404; reason: string } {
  const leccion = obtenerLeccionPrivadaPorOa(oaId);
  if (!leccion) {
    return { ok: false, status: 404, reason: "Lección no encontrada" };
  }
  const ej = leccion.ejerciciosPractica.find((p) => p.id === preguntaId);
  if (!ej) {
    return { ok: false, status: 404, reason: "Ejercicio de práctica no encontrado en esta lección" };
  }
  if (!ej.alternativas.some((a) => a.id === opcionId)) {
    return { ok: false, status: 400, reason: "Alternativa inexistente" };
  }
  const correcta = opcionId === ej.respuestaCorrecta;
  return {
    ok: true,
    correcta,
    explicacion: correcta ? ej.explicacionCorrecta : null,
  };
}

export function evaluarProcesoSinPorcentaje(
  oaId: string,
  respuestas: Record<string, string>,
): { estado: "logrado" | "sigue_practicando"; detalle: Record<string, boolean> } {
  const leccion = obtenerLeccionPrivadaPorOa(oaId);
  if (!leccion) {
    throw new Error(`Lección desconocida: ${oaId}`);
  }
  const detalle: Record<string, boolean> = {};
  let todasCorrectas = true;
  for (const ej of leccion.ejerciciosComprobacion) {
    const bien = respuestas[ej.id] === ej.respuestaCorrecta;
    detalle[ej.id] = bien;
    if (!bien) todasCorrectas = false;
  }
  return {
    estado: todasCorrectas ? "logrado" : "sigue_practicando",
    detalle,
  };
}

export function explicacionesAcertadasProceso(
  oaId: string,
  detalle: Record<string, boolean>,
): Record<string, string> {
  const leccion = obtenerLeccionPrivadaPorOa(oaId);
  if (!leccion) return {};
  const out: Record<string, string> = {};
  for (const ej of leccion.ejerciciosComprobacion) {
    if (detalle[ej.id]) {
      out[ej.id] = ej.explicacionCorrecta;
    }
  }
  return out;
}
