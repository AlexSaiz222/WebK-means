# El proyecto sección por sección

Este documento describe el recorrido de la página y, para cada parte, qué se
muestra y qué se puede tocar. Es el guion. La teoría exacta de cada algoritmo
está en `ALGORITMOS.md`; aquí nos centramos en la experiencia.

El recorrido es una sola página con scroll vertical y un menú lateral fijo
(con scroll-spy) para saltar entre secciones. Cada sección ocupa idealmente
una pantalla y encadena con la siguiente sin costuras.

---

## 0. Apertura

**Objetivo:** enganchar en tres segundos y dar el tono (calma, cuidado, curiosidad).

- Portada limpísima, mucho espacio en blanco.
- Una única animación de fondo, discreta: puntos que viajan hasta agruparse,
  se dispersan y se reagrupan en bucle lento, esquivando la columna del texto.
- Titular: *"Un algoritmo, cinco personalidades."* (la palabra "cinco" lleva
  los colores de los clústeres).
- Subtítulo con la pregunta que vertebra la página y un indicador sutil de
  "desliza para empezar". Nada más.

## 1. La esencia de K-Means

**Objetivo:** asentar el contexto y el vocabulario (aprendizaje no supervisado,
centroide, asignación, actualización, convergencia, sensibilidad a la
inicialización) antes de hablar de variantes.

- Texto editorial con el contexto teórico y un **diagrama estático de tres
  paneles** que muestra una vuelta del ciclo: inicialización (puntos grises,
  centroides arbitrarios), asignación (colores + líneas al centroide más
  cercano) y actualización (los centroides se desplazan a la media, con la
  posición anterior en claro).
- El diagrama está **calculado de verdad** (asignaciones y medias reales), no
  dibujado a ojo.
- Sin laboratorio aquí: el primer lab interactivo es la sala de Lloyd, y el
  texto lo anuncia.

## 2. Las cinco salas

El núcleo. Una sección por variante. Todas comparten el mismo instrumento
(panel con selector de muestras, k ajustable, línea de tiempo con reproducir /
flechas / barra arrastrable, recuadro de narración por fase y métricas), y cada
una añade la interacción que aísla su diferencia. Además, las métricas de cada
panel incluyen la **curva de inercia**: un sparkline del historial con marcador
en el paso actual — la comprobación "la SSE nunca empeora" hecha visible.

### 2.1 Lloyd: actualización por lotes
- La ejecución se recorre por **fases**: reasignación en bloque (los puntos que
  cambian de clúster quedan marcados con un aro) y actualización de centroides.
- Los centroides arrancan en posiciones aleatorias para que el recorrido hasta
  converger sea visible; se pueden **arrastrar puntos y centroides** y la
  ejecución se recalcula desde esa configuración.
- Un conmutador discreto dentro del lienzo activa las **fronteras (Voronoi)**:
  las celdas del centroide más cercano bajo los puntos, calculadas en el
  espacio de datos y animadas con los centroides. Hace visible qué significa
  "el más cercano" y por qué K-Means solo forma grupos convexos (activarlas
  sobre lunas o anillos lo demuestra).
- Mensaje: la formulación clásica; la referencia del resto.

### 2.2 MacQueen: K-Means secuencial
- Reproducción **punto a punto**: se ve cada asignación individual y el
  centroide afectado desplazándose al instante (media incremental).
- **Detalle estrella:** el conmutador "barajar orden" rehace la ejecución con
  los mismos datos y la misma inicialización en otro orden, y el veredicto
  ("mismo resultado / resultado distinto") evidencia la sensibilidad al orden,
  que Lloyd no tiene.
- Mensaje: ideal para datos que llegan en flujo continuo.

### 2.3 Hartigan-Wong: reasignación por mejora de la inercia
- Al señalar un punto, la interfaz muestra la **ganancia por salir** de su
  clúster frente al **coste de entrar** en el mejor candidato (líneas continua
  y discontinua), y el veredicto: se queda o se trasladaría.
- Mensaje: al no limitarse al centroide más cercano, escapa mejor de los
  mínimos locales.

### 2.4 Elkan: aceleración por la desigualdad triangular
- Como da **el mismo resultado** que Lloyd, su historia está en la eficiencia:
  dos lienzos en paralelo (Lloyd / Elkan) con contadores de distancias y el
  porcentaje de ahorro en vivo, más la comprobación "mismas etiquetas".
- Una ilustración geométrica de la **desigualdad triangular** explica por qué
  puede descartar un centroide sin medir la distancia.
- Mensaje: misma respuesta, mucho menos trabajo; brilla en datos grandes.

### 2.5 Fuzzy K-Means: pertenencias graduales
- Los puntos no tienen color sólido: llevan la **mezcla** de sus pertenencias.
- Deslizador para la borrosidad `m` (endurece hacia el K-Means clásico o
  difumina las fronteras) y lectura de porcentajes al señalar un punto.
- Arranca sobre la muestra de grupos **solapados**, su terreno natural.
- Mensaje: útil cuando los límites entre grupos no están claros.

## 3. ¿Y cómo se elige k?

**Objetivo:** responder la pregunta que las salas dejan abierta — allí k se
mueve a mano; en un problema real hay que elegirlo. Es una coda, no una sala
más.

- Curvas de **codo** (inercia frente a k) y **silueta media** (versión
  simplificada por centros, ver `ALGORITMOS.md`: `a` = distancia al propio
  centro, `b` = al segundo mejor, `s = (b − a) / max(a, b)`) para k = 1..8,
  sobre las mismas seis muestras. Cada punto de la curva es una ejecución completa de
  Lloyd con varias semillas (se queda la mejor, el `n_init` de la práctica).
- **Clic en un k** (o flechas del teclado) muestra ese agrupamiento en un
  lienzo lateral; la narración lee la curva con datos reales (caída porcentual
  de la inercia, máximo de la silueta). Un aro marca el k que sugiere cada
  método. En el lienzo lateral los **centroides se arrastran**: Lloyd se
  reejecuta desde esa configuración y la curva se actualiza (un mal arranque
  se ve subir el punto).
- La **estadística de brecha** se menciona en el texto (el tercer método
  clásico) pero no tiene lab: bootstrap costoso y valor marginal sobre los
  otros dos.
- Con lunas y anillos ninguna curva da un buen k: el cierre natural de la
  historia ("el fallo no está en k sino en la forma de los grupos").

## 4. Guía de decisión

**Objetivo:** convertir lo explorado en una conclusión útil.

- **Tabla comparativa** basada en el resumen de `ALGORITMOS.md`: variante,
  actualización de centroides, fortaleza, a cambio, y cuándo elegirla.
- Cada variante enlaza de vuelta a su sala.

> Nota: la "arena comparativa" (las cinco variantes corriendo en paralelo) se
> construyó y después se retiró por decisión de producto; la comparación vive
> ahora en esta tabla y en la sala de Elkan (única comparación en paralelo).

## 5. Cierre

- Créditos discretos y una línea sobre la asignatura / contexto. Nada recargado.

---

## Muestras de datos

Definidas en `src/lib/data/datasets.ts`, elegidas para que las variantes
**discrepen**. Todas disponibles en el selector de cada sala, con "otra
muestra" para regenerar (los generadores varían centros y orientación con la
semilla):

- **redondos**: blobs separados (caso fácil, todas coinciden).
- **solapados**: tres grupos que se mezclan (fronteras ambiguas; Fuzzy brilla).
- **alargados**: blobs estirados y rotados (anisotrópicos).
- **desiguales**: un grupo enorme y disperso y dos pequeños y densos.
- **lunas**: dos medias lunas entrelazadas (K-Means falla).
- **anillos**: dos círculos concéntricos (el otro fallo clásico: solo grupos
  convexos).

## Caso real opcional como hilo (si da tiempo)

La **compresión de imagen** es la aplicación más vistosa de K-Means: se ve
literalmente cómo cada variante reduce una foto a `N` colores. La sala de
Elkan ya la menciona como contexto; una demo interactiva queda como extra.
