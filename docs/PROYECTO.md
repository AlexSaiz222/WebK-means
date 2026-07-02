# El proyecto sección por sección

Este documento describe el recorrido de la página y, para cada parte, qué se
muestra y qué se puede tocar. Es el guion. La teoría exacta de cada algoritmo
está en `ALGORITMOS.md`; aquí nos centramos en la experiencia.

El recorrido es una sola página con scroll vertical. Cada sección ocupa
idealmente una pantalla y encadena con la siguiente sin costuras.

---

## 0. Apertura

**Objetivo:** enganchar en tres segundos y dar el tono (calma, cuidado, curiosidad).

- Portada limpísima, mucho espacio en blanco.
- Una única animación de fondo, discreta: unos puntos que se agrupan solos en
  bucle lento.
- Titular: *"Un algoritmo, cinco personalidades."*
- Subtítulo con la pregunta que vertebra la página.
- Un indicador sutil de "desliza para empezar". Nada más.

## 1. El fundamento común

**Objetivo:** asentar el vocabulario (centroide, asignación, convergencia) antes
de hablar de variantes.

- Un primer sandbox con el K-Means base.
- El visitante puede: colocar/mover puntos con el ratón, elegir el número de
  grupos `k`, y pulsar **"paso a paso"** para ver un ciclo completo
  asignar → recalcular, o **"reproducir"** para verlo converger solo.
- Un texto corto nombra cada elemento la primera vez que aparece en pantalla.
- Al final, la idea que abre el resto: "este ciclo básico admite cinco formas
  distintas de ejecutarse. Vamos a verlas."

## 2. Las cinco salas

El núcleo. Una sección por variante, cada una diseñada para **aislar exactamente
la diferencia** que la define. No repiten la misma demo con otro nombre: cada
sala tiene una interacción pensada para su idea.

### 2.1 Lloyd — el ritmo por lotes
- Se visualiza el ciclo en dos tiempos marcados: primero **todos** los puntos se
  reasignan a la vez, y solo entonces los centroides "saltan" a su nueva media.
- Control para avanzar tiempo a tiempo y notar el movimiento en bloque.
- Mensaje: es el más simple; la base de todo lo demás.

### 2.2 MacQueen — el modo online
- El visitante suelta puntos **uno a uno** y ve el centroide afectado desplazarse
  al instante con cada punto (media incremental).
- **Detalle estrella:** un botón "barajar orden" que reordena los datos y
  demuestra que MacQueen puede converger a algo distinto según el orden de
  llegada — algo que a Lloyd no le pasa. Se puede mostrar Lloyd y MacQueen sobre
  los mismos datos para contrastar.
- Mensaje: ideal para datos que llegan en flujo continuo.

### 2.3 Hartigan-Wong — la pregunta inteligente
- Al pasar el ratón sobre un punto, la interfaz muestra si moverlo a otro grupo
  **reduce o no** la función objetivo (SSE total), y solo lo mueve si mejora.
- Se puede resaltar un punto "frontera" y ver el cálculo de ganancia/coste que
  decide su destino.
- Mensaje: al no limitarse al centroide más cercano, escapa mejor de malos
  mínimos locales.

### 2.4 Elkan — el ahorro invisible
- Como da **el mismo resultado** que Lloyd, su historia no está en los grupos
  sino en la eficiencia. Dos contadores en paralelo (Lloyd vs. Elkan) muestran
  cuántos cálculos de distancia lleva hecho cada uno; Elkan se queda muy por
  debajo.
- Una pequeña ilustración geométrica de la **desigualdad triangular** explica
  *por qué* puede descartar un centroide sin medir la distancia.
- Mensaje: misma respuesta, mucho menos trabajo — brilla en datos grandes.
- Este es el momento "ajá" del proyecto; cuídalo.

### 2.5 Fuzzy / Soft — la duda
- Aquí los puntos no tienen color sólido: llevan una **mezcla** según su
  pertenencia a cada grupo.
- Un deslizador para el parámetro de borrosidad `m` deja ver cómo las fronteras
  se endurecen (hacia K-Means clásico) o se difuminan.
- Se pueden señalar puntos que son "70 % de un grupo y 30 % de otro" y ver sus
  porcentajes.
- Mensaje: útil cuando los límites entre grupos no están claros (segmentación de
  imágenes, diagnóstico médico...).

## 3. La arena comparativa

**Objetivo:** el clímax. Ver las cinco a la vez, en igualdad de condiciones.

- El **mismo** conjunto de datos, las cinco variantes corriendo en paralelo en
  una rejilla, convergiendo a la vez.
- Un panel de métricas vivo por variante: iteraciones, cálculos de distancia,
  calidad del agrupamiento (p. ej. silueta o SSE).
- El visitante cambia la **forma de los datos** con un selector: redondos,
  alargados/anisotrópicos, densidades muy desiguales, y las clásicas "lunas".
  Así ve de un vistazo dónde cada algoritmo brilla o se rompe.
- Botón de "misma semilla" para comparar de forma justa y otro para "rebarajar".

## 4. La guía de decisión

**Objetivo:** convertir lo explorado en una conclusión útil. Tu valor añadido.

- Un resumen interactivo tipo "si tus datos son X → usa Y, porque Z".
- Puede ser un pequeño árbol o unas tarjetas: el visitante indica su situación
  (tamaño de datos, si llegan en flujo, si las fronteras son difusas, si el
  dataset es grande) y la guía recomienda la variante y explica el porqué,
  enlazando de vuelta a la sala correspondiente.

## 5. Cierre

- Créditos discretos, enlace al repositorio, y una línea sobre la asignatura /
  contexto. Nada recargado.

---

## Datasets que deben existir

Definidos en `src/lib/data/`. Elegidos para que las variantes **discrepen**:

- **blobs** redondos y separados (caso fácil, todas coinciden).
- **anisotrópico** (blobs estirados y rotados).
- **densidades desiguales** (un grupo enorme y otros pequeños).
- **lunas** (dos medias lunas entrelazadas: K-Means falla, buen recordatorio de
  sus límites).

## Caso real opcional como hilo (recomendado si da tiempo)

La **compresión de imagen** es la aplicación más vistosa del temario: se ve
literalmente cómo cada variante reduce una foto a `N` colores. Puede vivir como
una sección extra tras la arena comparativa, o como "modo avanzado". No es
imprescindible para la primera versión, pero da una narrativa con final.
