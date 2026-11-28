// Capa pedagógica estática y aditiva de IABARKLEY para el piloto autorizado:
// Matemática · Módulo 1 (Fracciones y decimales: OA 7, OA 8, OA 10, OA 11, OA 13).
// Principio: complementa la presentación pedagógica de GuiaEstudioModulo sin modificar
// contenidos curriculares oficiales, evaluaciones, claves ni reglas de Vórtice.

import type { OaPilotoId } from "@shared/aulaUniversal";

export interface EnriquecimientoGuiaOA {
  /** 2 a 3 ideas previas concretas que conviene recordar antes de estudiar el OA. */
  conocimientosPrevios: readonly string[];
  /** Analogía cotidiana acotada con su límite explícito para evitar confusiones. */
  analogia: {
    titulo: string;
    explicacion: string;
    limite: string;
  };
  /** Caso que muestra por qué una regla mal aplicada falla. */
  contraejemplo: {
    enunciado: string;
    porQueNoSirve: string;
  };
  /** Explicación del porqué del ejemplo resuelto y forma de comprobar el resultado. */
  modeladoPorque: {
    porqueFunciona: string;
    comoVerificar: string;
  };
  /** Guía para leer la representación visual y una representación alternativa. */
  guiaLecturaVisual: {
    queObservar: string;
    otraForma: string;
  };
  /** Causa del error frecuente y estrategia breve para evitarlo. */
  errorFrecuenteCausa: {
    porqueOcurre: string;
    comoEvitarlo: string;
  };
  /** Preguntas abiertas de reflexión metacognitiva (no evaluativas, sin nota). */
  reflexionMetacognitiva: readonly string[];
}

export const ENRIQUECIMIENTO_MATEMATICA_M1: Readonly<
  Record<OaPilotoId, EnriquecimientoGuiaOA>
> = {
  oa7: {
    conocimientosPrevios: [
      "En una fracción, el denominador indica en cuántas partes iguales se divide el entero y el numerador indica cuántas partes se consideran.",
      "Multiplicar o dividir un número por 1 no cambia su valor; por ejemplo, 2/2 y 4/4 valen 1 entero.",
      "Para comparar dos cantidades con justicia, ambas deben medirse con partes del mismo tamaño.",
    ],
    analogia: {
      titulo: "Partir una barra de chocolate en trozos más pequeños",
      explicacion:
        "Si tienes la mitad de una barra (1/2) y cortas cada mitad en dos trozos iguales, ahora tienes 2/4. Hay más trozos, pero comes exactamente la misma cantidad de chocolate.",
      limite:
        "Esta comparación sirve cuando los cortes son siempre en partes iguales; si los trozos tienen tamaños distintos, ya no representan la misma fracción.",
    },
    contraejemplo: {
      enunciado: "¿Sirve sumar 1 arriba y 1 abajo para buscar una fracción equivalente a 1/3?",
      porQueNoSirve:
        "No. Si sumas 1 arriba y abajo pasas de 1/3 a 2/4. Pero 2/4 es exactamente la mitad del entero, mientras que 1/3 es menos de la mitad: cambiaste el valor real de la fracción.",
    },
    modeladoPorque: {
      porqueFunciona:
        "Al amplificar 2/3 por 4/4 y 3/4 por 3/3 multiplicas cada fracción por 1. No cambia la cantidad que representan, solo las expresas en doceavos para comparar partes del mismo tamaño.",
      comoVerificar:
        "Simplifica 8/12 dividiendo por 4 para comprobar que vuelve a ser 2/3, y simplifica 9/12 dividiendo por 3 para comprobar que vuelve a ser 3/4.",
    },
    guiaLecturaVisual: {
      queObservar:
        "Fíjate que las dos barras tienen el mismo largo total (el mismo entero), pero la barra de 3/4 (= 9/12) avanza un doceavo más a la derecha que la de 2/3 (= 8/12).",
      otraForma:
        "También puedes imaginarlo en una recta numérica entre 0 y 1 dividida en 12 tramos iguales: 8/12 queda en la octava marca y 9/12 en la novena marca, más cerca del 1.",
    },
    errorFrecuenteCausa: {
      porqueOcurre:
        "Suele ocurrir porque estamos acostumbrados a sumar en otros cálculos y pensamos que agregar la misma cantidad arriba y abajo mantiene el equilibrio.",
      comoEvitarlo:
        "Antes de escribir la nueva fracción, pregúntate: ¿multipliqué o dividí arriba y abajo por el mismo número? Si sumaste o restaste, detente y vuelve a calcular.",
    },
    reflexionMetacognitiva: [
      "¿Con tus propias palabras, por qué amplificar una fracción no la hace más grande?",
      "Si te dan dos fracciones con distinto denominador, ¿cuál es el primer paso que vas a hacer antes de compararlas?",
    ],
  },

  oa8: {
    conocimientosPrevios: [
      "Cuando el numerador es igual al denominador (como 4/4 o 5/5), la fracción equivale exactamente a 1 entero.",
      "Dividir con resto significa ver cuántos grupos completos caben y cuántos elementos quedan sueltos.",
      "Un número mayor que 1 puede escribirse solo con partes fraccionarias o separando los enteros completos de lo que sobra.",
    ],
    analogia: {
      titulo: "Llenar botellas de 1 litro con vasos de un cuarto de litro",
      explicacion:
        "Si tienes 5 vasos de 1/4 de litro (5/4), con 4 vasos llenas 1 botella completa y te sobra 1 vaso aparte. Tienes 1 1/4 de litro, pero el tamaño del vaso sigue siendo 1/4.",
      limite:
        "La comparación asume que todas las botellas y todos los vasos tienen exactamente la misma medida; nunca se mezclan cuartos con tercios en el mismo número mixto.",
    },
    contraejemplo: {
      enunciado: "Al convertir 5/3 a número mixto, ¿puede quedar 1 2/5?",
      porQueNoSirve:
        "No. Al escribir 5 abajo cambiaste tercios por quintos. El entero estaba partido en 3 partes, así que lo que sobra siguen siendo tercios: 5/3 = 1 2/3.",
    },
    modeladoPorque: {
      porqueFunciona:
        "Dividir 11 entre 4 agrupa los cuartos de 4 en 4 para formar enteros completos (8/4 = 2 enteros). El resto 3 indica los cuartos que no alcanzaron a completar otro entero.",
      comoVerificar:
        "Haz el camino inverso desde 2 3/4: multiplica 2 × 4 = 8 cuartos de los enteros y suma los 3 cuartos sueltos (8 + 3 = 11), recuperando exactamente 11/4.",
    },
    guiaLecturaVisual: {
      queObservar:
        "Observa que la primera barra llega al 100 % (4/4 = 1 entero completo) y la segunda llega al 75 % (3/4). Juntas muestran que 7/4 supera a 1 entero sin llegar a 2.",
      otraForma:
        "En una recta numérica graduada en cuartos, cuentas 7 saltos desde el 0: en el cuarto salto llegas al 1 y con 3 saltos más llegas a 1 3/4, entre 1 y 2.",
    },
    errorFrecuenteCausa: {
      porqueOcurre:
        "Al ver el numerador original tan cerca durante la división, es fácil copiarlo por distracción en el lugar del denominador del resto.",
      comoEvitarlo:
        "Escribe primero el denominador del número mixto copiando el mismo denominador de la fracción impropia, y recién después completa el entero y el numerador.",
    },
    reflexionMetacognitiva: [
      "¿Qué te indica que una fracción representa más de 1 entero antes siquiera de dividir?",
      "¿Cuál de las dos conversiones te resulta más clara ahora (impropia a mixto o mixto a impropia) y qué paso te conviene repasar?",
    ],
  },

  oa10: {
    conocimientosPrevios: [
      "En nuestro sistema decimal, cada posición hacia la derecha vale 10 veces menos: unidad, décimo (1/10) y centésimo (1/100).",
      "Una fracción también puede leerse como una división entre el numerador y el denominador.",
      "Amplificar a denominador 10 o 100 te permite leer el número decimal directamente por su nombre.",
    ],
    analogia: {
      titulo: "Partir un billete o una barra de 100 unidades iguales",
      explicacion:
        "Si un entero se reparte en 100 partes iguales, la mitad (1/2) son 50 partes (0,50 = 0,5) y un cuarto (1/4) son 25 partes (0,25). Cambia la forma de escribirlo, no la cantidad.",
      limite:
        "Esta analogía funciona directo con denominadores que caben exacto en 10 o 100 (como 2, 4, 5 y 10); otras fracciones como 1/3 no dan un número exacto de centésimos.",
    },
    contraejemplo: {
      enunciado: "¿Es correcto escribir 1/4 como 0,14 juntando el 1 y el 4 después de la coma?",
      porQueNoSirve:
        "No. El decimal 0,14 equivale a 14/100, que es mucho menos que un cuarto. Un cuarto de 100 es 25, por eso 1/4 = 25/100 = 0,25.",
    },
    modeladoPorque: {
      porqueFunciona:
        "Al amplificar 3/5 por 2/2 obtienes 6/10, que tiene el mismo valor pero expresado en décimos. Como la primera cifra tras la coma son los décimos, 6/10 se escribe directo 0,6.",
      comoVerificar:
        "Divide 3 ÷ 5 o revisa el camino inverso: 0,6 se lee seis décimos (6/10) y al simplificar por 2 vuelves a obtener 3/5.",
    },
    guiaLecturaVisual: {
      queObservar:
        "Compara el largo de las dos barras sobre una base de 100: 1/4 ocupa 25 de 100 (0,25) y 3/4 ocupa exactamente el triple, 75 de 100 (0,75).",
      otraForma:
        "También puedes pensarlo como cuartos de una hora o de un entero dividido en 4 partes iguales: cada parte vale 0,25, así que tres partes suman 0,25 + 0,25 + 0,25 = 0,75.",
    },
    errorFrecuenteCausa: {
      porqueOcurre:
        "Ocurre cuando se copian los dígitos de la fracción como si la raya fraccionaria se transformara simplemente en una coma decimal.",
      comoEvitarlo:
        "Antes de escribir el decimal, pregúntate: ¿cuántos décimos o centésimos vale esta fracción? Solo escribe los dígitos después de pasar por /10, /100 o la división.",
    },
    reflexionMetacognitiva: [
      "¿Cuándo prefieres amplificar a denominador 10 o 100 y cuándo prefieres dividir numerador entre denominador?",
      "¿Qué equivalencia entre fracción y decimal ya reconoces sin hacer cálculos y cuál te falta afianzar?",
    ],
  },

  oa11: {
    conocimientosPrevios: [
      "En un número decimal, cada posición a la derecha de la coma vale diez veces menos que la anterior: 1 décimo vale lo mismo que 10 centésimos y que 100 milésimos.",
      "Agregar ceros al final de la parte decimal no altera el valor del número (por ejemplo, 0,5 = 0,50 = 0,500).",
      "Al comparar números enteros siempre miras primero la cifra de mayor valor posicional, de izquierda a derecha.",
    ],
    analogia: {
      titulo: "Comparar tiempos en un cronómetro o longitudes en una cinta métrica",
      explicacion:
        "En una carrera, 0,5 segundos (0,50 s) es más tiempo que 0,45 segundos, igual que 50 centésimas superan a 45 centésimas. Igualar la cantidad de cifras decimales los deja en la misma unidad.",
      limite:
        "Recuerda que los ceros que no cambian el valor son solo los que van al final (a la derecha); un cero entre la coma y un dígito (como en 0,05) sí cambia por completo el valor.",
    },
    contraejemplo: {
      enunciado: "¿Es mayor 0,38 que 0,4 porque 38 es mayor que 4?",
      porQueNoSirve:
        "No. En 0,38 hay 3 décimos y 8 centésimos, mientras que 0,4 equivale a 0,40 (4 décimos y 0 centésimos). Como 4 décimos > 3 décimos, entonces 0,4 > 0,38.",
    },
    modeladoPorque: {
      porqueFunciona:
        "Al completar 0,5 como 0,50 expresas ambos números en centésimos (45 centésimos frente a 50 centésimos) y luego comparas de izquierda a derecha empezando por la posición que vale más.",
      comoVerificar:
        "Escribe ambos decimales en una tabla de valor posicional (U | d | c): al quedar las comas alineadas ves de inmediato que en la columna de décimos 4 < 5.",
    },
    guiaLecturaVisual: {
      queObservar:
        "Nota que aunque 0,45 tiene más cifras escritas que 0,5, su barra llega a 45 de 100 y es más corta que la de 0,5 (= 0,50), que llega exactamente a la mitad (50 de 100).",
      otraForma:
        "Puedes ubicarlos en una recta numérica entre 0,4 y 0,6: 0,45 queda a mitad de camino entre 0,4 y 0,5, por lo tanto está a la izquierda de 0,5 y es menor.",
    },
    errorFrecuenteCausa: {
      porqueOcurre:
        "Ocurre cuando trasladamos la regla de los números enteros (más dígitos = número más grande) a la parte decimal, olvidando que cada nueva cifra a la derecha representa trozos más pequeños.",
      comoEvitarlo:
        "Antes de decidir cuál es mayor, iguala siempre la cantidad de cifras decimales agregando ceros al final y compara columna por columna desde la izquierda.",
    },
    reflexionMetacognitiva: [
      "¿Por qué agregar un cero al final de 0,4 no cambia su valor, pero ponerlo justo después de la coma (0,04) sí lo cambia?",
      "Cuando tienes que ordenar tres decimales parecidos, ¿qué paso te ayuda a no confundirte?",
    ],
  },

  oa13: {
    conocimientosPrevios: [
      "Solo puedes sumar o restar directamente cantidades expresadas en la misma unidad (por ejemplo, quintos con quintos o centésimos con centésimos).",
      "Amplificar fracciones te permite llevar dos denominadores distintos a un denominador común sin cambiar su valor.",
      "En decimales, alinear la coma asegura que sumes o restes unidades con unidades, décimos con décimos y centésimos con centésimos.",
    ],
    analogia: {
      titulo: "Sumar medidas solo cuando están en la misma unidad",
      explicacion:
        "Si juntas trozos de torta cortados en cuartos con trozos cortados en tercios, primero necesitas un tamaño común (doceavos) para contar cuántos trozos iguales tienes. En decimales, alinear la coma cumple el mismo papel.",
      limite:
        "Igualar denominadores o completar con ceros prepara el cálculo, pero al final siempre debes revisar si el resultado tiene sentido con la situación del problema.",
    },
    contraejemplo: {
      enunciado: "¿Puede ser correcto que 1/2 + 1/3 dé 2/5 sumando numeradores y denominadores?",
      porQueNoSirve:
        "No. Solo 1/2 (= 5/10) ya es mayor que 2/5 (= 4/10). Es imposible sumar dos cantidades positivas y obtener un resultado menor que una de ellas.",
    },
    modeladoPorque: {
      porqueFunciona:
        "Al transformar 1/4 en 3/12 y 1/3 en 4/12, ambas fracciones quedan expresadas en doceavos. Como las partes ahora tienen el mismo tamaño, basta sumar cuántos doceavos hay en total (3 + 4 = 7 doceavos).",
      comoVerificar:
        "Estima el resultado: 1/4 es un poco menos que un tercio y 1/3 es un tercio; juntos deben superar la mitad (6/12) sin llegar a 1 entero. Como 7/12 cumple eso, el resultado es razonable.",
    },
    guiaLecturaVisual: {
      queObservar:
        "Las barras muestran que 1/4 cubre 3 doceavos (25 % del entero) y 1/3 cubre 4 doceavos (33 %). Al unirlos sobre el mismo entero, ocupan 7 doceavos (58 %).",
      otraForma:
        "En problemas con decimales, puedes usar una tabla vertical con columnas U, d, c, m y escribir ceros en los espacios vacíos antes de sumar o restar en columna.",
    },
    errorFrecuenteCausa: {
      porqueOcurre:
        "En fracciones ocurre por tratar numerador y denominador como si fueran dos sumas independientes; en decimales ocurre al alinear los números por la derecha en vez de alinearlos por la coma.",
      comoEvitarlo:
        "Haz una pausa de dos segundos antes de operar: en fracciones revisa si los denominadores son iguales; en decimales dibuja la línea vertical de las comas primero.",
    },
    reflexionMetacognitiva: [
      "¿Qué tienen en común buscar denominador común en fracciones y alinear la coma en decimales?",
      "Después de obtener una respuesta en un problema, ¿cómo puedes darte cuenta rápido si el resultado tiene sentido?",
    ],
  },
};
