# OA 11 (v2, borrador): Comparar y ordenar decimales hasta la milésima

Fuentes oficiales (se consultan siempre ambas): (E) «Sumo Primero 5.º básico», Texto del Estudiante Tomo 1, Cap. 6 «Números decimales»; (G) su Guía del Docente, solo apoyo; (S) «Matemática 5.º, Casa del Saber», Santillana, Tomo I, Unidad 3, «Orden y comparación de números decimales». Cada cita lleva su línea en el `.md` y se verifica con `verificar.py`.

## 1. Qué vas a aprender
Vas a comparar y ordenar números decimales hasta la milésima. [texto propio, une el objetivo del OA]

## 2. Cómo se escriben las partes más pequeñas que 1
- «La cantidad que se obtiene dividiendo 0,1 L en 10 partes iguales se escribe como 0,01 L y se lee una centésima de litro.» [E:4715]
- «0,001 L y se lee una milésima de litro.» [E:4767]
- «Las posiciones que están a la derecha de la coma tienen los siguientes valores:» décimos 1/10 = 0,1; centésimos 1/100 = 0,01; milésimos 1/1 000 = 0,001. [E:4853]

## 3. Idea clave: el valor de la posición manda
- «Tanto en los números naturales como en los números decimales, cuando se forma un grupo de 10 en una posición, aumenta en 1 el dígito de la posición inmediatamente mayor.» [E:5084-5086]
- «Cuando un número se multiplica por 10, cada dígito se mueve a la siguiente posición de mayor valor.» [E:4917-4918]
- «Cuando un número se divide por 10, cada dígito se mueve a la siguiente posición de menor valor.» [E:4919-4920]
- «para ordenar los números decimales se emplea la misma estrategia» que con los naturales: comparar «los dígitos de la posición de los décimos, y si estos son iguales, continúan comparando con el dígito de la posición de los centésimos o milésimos.» [G:5550]
- «en los números decimales no es determinante la cantidad de dígitos que tenga un número para ser mayor o menor que otro, sino que el valor de los dígitos que se ubican en las posiciones de mayor valor posicional.» [G:5552]
- Ejemplo del libro: «0,9 es mayor que 0,009, pues en el primer caso el 9 está ubicado en una posición de mayor valor.» [G:5647]

## 3b. La regla de comparar, en el texto de Santillana
- «Para ordenar dos números decimales, se compara primero la parte entera» [S:5010]
- «Si son diferentes, es mayor el número que tiene la mayor parte entera.» Ejemplo del libro: «9,5 > 8,5, ya que 9 > 8.» [S:5011-5013]
- «Si son iguales, se verifica que tengan la misma cantidad de cifras decimales para poder compararlas. Si no las tienen, se completa con ceros según corresponda y luego se comparan.» [S:5015-5016]
- Ejemplo del libro: «123,41 y 123,4. Finalmente, 123,41 > 123,4.» (123,4 se completa como 123,40) [S:5018-5020]

## 4. Practica con las actividades del libro
- Ordena de mayor a menor: a) 0,5 5 0,005 0 0,05 · b) 0,25 0,9 0,125 0,911 0,1 [E:4929-4934]
- Ordena de menor a mayor: 0,08 0,008 0,188 1 0,8 [E:4943-4944]
- Compara con >, < o =: a) 0,002 y 0,2 · b) 0,341 y 0,9 · c) 0,900 y 0,009 [E:4996-5004]
- Ordena de mayor a menor: a) 0,17 0,117 0,177 · b) 1 0,1 0,011 [E:5006-5012]
- Santillana, «Escribe >, < o =»: 3,7 y 3,07 · 2,08 y 2,008 · 9,99 y 9,990 · 574,024 y 574,240 [S:5044-5051]

## 4b. Ejemplos resueltos [EJEMPLO PROPIO, revisión humana pendiente; el ejemplo 1 usa el completar con ceros de Santillana S:5015]
Estos ejemplos no vienen del libro. Siguen la regla del libro: comparar posición por posición, desde la de mayor valor.

**Ejemplo 1: comparar 0,45 y 0,5**
1. Completamos con ceros: 0,45 y 0,50.
2. Unidades: 0 y 0, son iguales.
3. Décimos: 4 y 5. Aquí hay diferencia.
4. Como 4 < 5, entonces 0,45 < 0,5.

**Ejemplo 2: ordenar de menor a mayor 3,145 ; 3,15 ; 3,098**
1. Completamos con ceros: 3,145 ; 3,150 ; 3,098.
2. Unidades: las tres son 3.
3. Décimos: 1 ; 1 ; 0. El menor es 3,098.
4. Entre 3,145 y 3,150 los décimos son iguales. Centésimos: 4 y 5, entonces 3,145 < 3,150.
5. Orden: 3,098 < 3,145 < 3,15.

**Ejemplo 3: comparar 0,125 y 0,9**
Décimos: 1 y 9. Como 1 < 9, entonces 0,125 < 0,9, aunque 0,125 tenga más cifras.

## 5. Errores frecuentes
El libro advierte que se tiende a creer que «se considera mayor el que tiene más dígitos». [G:5653] FALSO, como muestra 0,9 > 0,009.

[EJEMPLO PROPIO] Otro error: leer 0,25 como «veinticinco» y 0,3 como «tres», y concluir que 0,25 > 0,3. FALSO: en los décimos, 2 < 3, entonces 0,25 < 0,3.
[EJEMPLO PROPIO] Los ceros al final no cambian el valor: 0,4 = 0,40 = 0,400.

## Medición
Sección 2, 3 y 5: citas literales de E/G. Sección 4: enunciados literales del libro. Texto propio, marcado: sección 1, sección 4b (ejemplos) y los dos errores marcados en la sección 5.
