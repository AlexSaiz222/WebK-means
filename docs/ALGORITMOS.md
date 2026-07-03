# Referencia de algoritmos (fiel al Tema 3)

**Fuente de verdad del proyecto.** Cada simulación debe comportarse como se
describe aquí. Si una implementación "queda bonita" pero contradice esta
referencia, la implementación está mal. Basado en el Tema 3 de la asignatura
*Aprendizaje Automático No Supervisado* (UNIR); el temario original está en
`docs/Tema3.pdf` por si surge una duda que este documento no resuelva.

Notación:
- `X` = conjunto de puntos, cada `x` un vector.
- `k` = número de clústeres. `c_j` = centroide del clúster `j`. `n_j` = nº de
  puntos asignados al clúster `j`.
- Distancia euclídea salvo que se diga otra cosa.
- **Inercia** común a las variantes duras: suma de distancias al
  cuadrado de cada punto a su centroide asignado. Es la métrica comparable entre
  todas (en Fuzzy se calcula con la etiqueta dura = argmax de pertenencia).

---

## Base común: K-Means

Ciclo genérico del que parten todas las variantes:

1. Inicializar los `k` centroides.
2. Repetir hasta convergencia (o máximo de iteraciones):
   a. Asignar cada punto al centroide más cercano.
   b. Recalcular los centroides.
   c. Comprobar si los centroides han cambiado significativamente.
3. Termina cuando los centroides dejan de moverse por encima de una tolerancia.

**Inicialización:** usa **k-means++** compartido para todas las variantes duras,
salvo donde el temario indique otra cosa (Hartigan-Wong, ver su apartado). Una
buena inicialización reduce el riesgo de caer en malos mínimos locales — un
problema que el temario señala como el gran talón de Aquiles del K-Means.

**Para el proyecto:** la inicialización debe ser reproducible con una semilla,
para poder comparar variantes en igualdad de condiciones en la arena.

---

## 1. Lloyd

El K-Means "de libro". Actualización **por lotes**.

- En cada iteración se asignan **todos** los puntos y solo después se recalculan
  **todos** los centroides como la media de sus puntos.
- Es el más simple y eficiente por iteración (una sola actualización por ciclo),
  pero puede necesitar más iteraciones para converger porque los centroides dan
  "saltos" grandes.

**Comportamiento a visualizar:** el ciclo en dos tiempos nítidos —reasignación
masiva, luego salto de centroides—. El movimiento en bloque es su seña.

**Cálculos de distancia:** cada iteración calcula `n · k` distancias
(punto × centroide). Sirve de línea base para comparar con Elkan.

---

## 2. MacQueen

K-Means **online / secuencial**. Corrige un problema de Lloyd: mientras Lloyd
reasigna todos los puntos sin actualizar los centroides, un punto puede quedar
asignado a un centroide "desactualizado".

- Misma inicialización que Lloyd.
- Se **itera sobre los puntos uno a uno**; en cuanto un punto se asigna a un
  clúster, ese centroide **se recalcula al instante** como la media de sus puntos
  (media incremental).
- Se repiten pasadas hasta que ningún punto cambie de grupo (convergencia).

Actualización incremental al añadir un punto `x` al clúster `j` (tamaño actual
`n_j`):

```
n_j   ← n_j + 1
c_j   ← c_j + (x − c_j) / n_j
```

Y la operación espejo al retirar el punto de su clúster anterior.

- **Más coste de cálculo** que Lloyd (recalcula continuamente), pero **converge
  en menos iteraciones** porque los centroides se ajustan sobre la marcha.
- Se comporta mejor que Lloyd cuando los datos llegan en **flujo continuo**.
- **Sensible al orden** de los datos: distinto orden puede llevar a distinto
  resultado. Esto NO le pasa a Lloyd.

**Comportamiento a visualizar:** puntos que entran de uno en uno y el centroide
moviéndose con cada uno. Un botón "barajar orden" que evidencie la sensibilidad
al orden.

---

## 3. Hartigan-Wong

Va un paso más allá de "asignar al más cercano": reasigna un punto a otro grupo
**solo si eso reduce la función objetivo**, mejorando la calidad global del
agrupamiento.

Tal como lo describe el temario:
- Inicialización: se asignan los puntos a los centroides **de forma aleatoria** y
  luego cada centroide se calcula como la **media** de sus puntos asignados. Esto
  deja los centroides inicialmente en posiciones parecidas, lo que —según el
  temario— reduce la probabilidad de converger a un mínimo local.
- En consecuencia, un punto puede acabar asignado a un centroide que **no es el
  más cercano**, si con ello disminuye la función objetivo.
- Se repite hasta convergencia o máximo de iteraciones.

Criterio de movimiento (esencia "optimal transfer"): al considerar mover el
punto `x` de su clúster actual `i` (tamaño `n_i`) a otro `j` (tamaño `n_j`), el
cambio exacto en SSE tiene en cuenta que mover el punto **desplaza ambos
centroides**:

```
ganancia_por_salir_de_i = n_i / (n_i − 1) · ‖x − c_i‖²
coste_por_entrar_en_j   = n_j / (n_j + 1) · ‖x − c_j‖²
```

Se mueve el punto al `j` con menor coste **solo si** `coste < ganancia` (mejora
estricta). Tras cada movimiento se actualizan centroides y tamaños. Nunca vaciar
un clúster (no mover si el origen quedaría vacío).

- Frente a Lloyd: hace actualizaciones **más frecuentes y locales** (reubica
  puntos individuales), puede **necesitar menos iteraciones**, pero es **más
  complejo de implementar**.

**Comportamiento a visualizar:** al pasar sobre un punto frontera, mostrar si
moverlo baja o no la función objetivo, y mover solo cuando mejora.

---

## 4. Elkan

Variante pensada para **acelerar** el K-Means reduciendo el número de cálculos de
distancia. **Produce exactamente el mismo resultado que Lloyd**; su ventaja está
en la eficiencia, no en el agrupamiento.

Principios (del temario):
- **Reducción de cálculos** mediante **límites superior e inferior** de las
  distancias de cada punto a los centroides. Si sabemos que un punto está cerca
  de un centroide, podemos evitar medir su distancia a centroides lejanos.
- **Desigualdad triangular:** para todo triángulo, la suma de dos lados es ≥ el
  tercero. Se aprovecha para descartar centroides sin medir distancias.
- **Actualización eficiente:** cada vez que los centroides se mueven, se
  actualizan también los límites, minimizando cálculos futuros.

Esquema:
1. Inicializar centroides.
2. Mantener por cada punto un **límite superior** `u(x)` a su centroide asignado
   y **límites inferiores** `l(x, c)` a los demás.
3. Usar los límites para decidir el clúster más cercano **sin** calcular todas
   las distancias (regla clave: si `u(x) ≤ ½ · dist(c_asignado, c_otro)`, ese
   otro centroide no puede estar más cerca → se descarta).
4. Asignar; recalcular centroides.
5. Al mover un centroide una distancia `δ`, **relajar** los límites: los
   inferiores bajan `δ`, el superior sube `δ`.
6. Repetir hasta convergencia.

Ventajas: eficiencia y **escalabilidad** en datasets grandes. Limitaciones: más
**complejo** de implementar y, como todo K-Means, **sensible a la
inicialización**.

**Comportamiento a visualizar (lo importante del proyecto):** un contador de
cálculos de distancia de Elkan frente al de Lloyd sobre los mismos datos y misma
semilla → mismas etiquetas, muchísimos menos cálculos. Cuenta cada distancia
punto-centroide individual que el algoritmo realmente computa (no las que evita).

---

## 5. Soft K-Means / Fuzzy K-Means

Rompe la asignación rígida: cada punto tiene un **grado de pertenencia** a cada
clúster, entre 0 y 1, y la suma de sus pertenencias es 1. Un punto puede ser
70 % de un grupo y 30 % de otro. El parámetro de **borrosidad** `m` (normalmente
2) controla cuán difusas son las fronteras.

Algoritmo:
1. Inicializar las pertenencias al azar (cada fila suma 1).
2. **Centroide** de cada clúster `j` = media ponderada por `pertenencia^m`:

```
c_j = Σ_i (u_ij^m · x_i) / Σ_i (u_ij^m)
```

3. Calcular la distancia de cada punto a cada centroide.
4. **Actualizar pertenencias**:

```
u_ij = 1 / Σ_l ( d_ij / d_il )^(2/(m−1))
```

   (donde `d_ij` es la distancia del punto `i` al centroide `j`).
5. Repetir 2–4 hasta que las pertenencias apenas cambien (tolerancia).
6. **Desfuzzificar** si se quiere etiqueta dura: `label_i = argmax_j u_ij`.

Ventajas: **flexibilidad** (permite agrupaciones solapadas, útil cuando las
fronteras son ambiguas), **robustez** ante ruido y atípicos (transición gradual),
e **interpretabilidad** más rica. Desventajas: computacionalmente **más costoso**
(calcula el grado de pertenencia a cada grupo) y elegir bien `k` y las funciones
de pertenencia es difícil.

Aplicaciones que cita el temario: segmentación de imágenes, marketing,
diagnóstico médico, monitoreo ambiental, análisis de tráfico, evaluación de
riesgo.

**Comportamiento a visualizar:** puntos coloreados por **mezcla** de pertenencias
(no color sólido), un deslizador para `m` que endurece o difumina las fronteras,
y la posibilidad de inspeccionar los porcentajes de un punto concreto.

---

## Tabla resumen (para la guía de decisión de la sección 4)

| Variante        | Actualiza centroides        | Fortaleza                                   | Cuándo elegirla                                  |
|-----------------|-----------------------------|---------------------------------------------|--------------------------------------------------|
| Lloyd           | Por lotes (todo el bloque)  | Simplicidad                                 | Caso general, datos estáticos                     |
| MacQueen        | Tras cada punto             | Convergencia rápida, flujo continuo         | Datos en streaming / que llegan de uno en uno     |
| Hartigan-Wong   | Local, por punto, si mejora SSE | Escapa mejor de malos mínimos locales   | Cuando la calidad del agrupamiento es prioritaria |
| Elkan           | Por lotes (= Lloyd)         | Muchos menos cálculos de distancia          | Datasets grandes donde el coste importa           |
| Fuzzy / Soft    | Ponderado por pertenencia   | Fronteras difusas, robustez al ruido        | Cuando los límites entre grupos no están claros   |

## Comprobaciones de fidelidad (úsalas como tests)

- **Elkan == Lloyd:** con la misma semilla y datos, las etiquetas finales de
  Elkan y Lloyd deben coincidir; el contador de distancias de Elkan debe ser
  claramente menor.
- **MacQueen sensible al orden:** barajar el orden de los puntos puede cambiar el
  resultado de MacQueen, pero no el de Lloyd.
- **Fuzzy suave:** con `m` alto las pertenencias tienden a repartirse (fronteras
  difusas); con `m → 1⁺` se acercan a una asignación dura.
- **Todas** deben reducir (o mantener) la función objetivo iteración a iteración;
  nunca empeorarla de forma sostenida.
