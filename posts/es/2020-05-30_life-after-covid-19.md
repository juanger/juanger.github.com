---
layout: post
title: "La vida después de la COVID-19"
date: 2020-05-30 12:00
comments: true
status: scored
reviewed: 2026-10
status_note: >
  Calificado en octubre de 2026. Dejé el texto de 2020 tal cual y marqué cada
  predicción en el margen, con el conteo al final. Más aciertos que errores, y el
  error fue ser demasiado optimista sobre cuánto tiempo el mundo mantendría la
  guardia.
categories:
  - opinion
  - COVID-19
---

La COVID-19 está aquí para quedarse, incluso si la erradicamos,[^2026m-stays] sus efectos permanecerán en nuestro mundo y en nuestras mentes durante años.

[^2026m-stays]: held: Nunca se erradicó. Ahora es endémica, con vacunas anuales como la influenza, y sus efectos sí duraron años.

Voy a enumerar algunas frases que hemos escuchado durante estos meses con mis opiniones acerca de ellas.

### "La gripe mata a más personas, ¿por qué el pánico?"

Creo que es muy evidente ahora que COVID-19 es una enfermedad con alta mortalidad, solo falta ver las noticias alarmantes del 2018 sobre 80 mil muertes por influenza durante el invierno y compararlas con los números de la COVID-19 durante la primavera,[^flu-deaths][^2026-excess] pero creo que la parte más importante de esto, y por qué mucha gente en el gobierno y la clase alta entró en pánico, es que puede matar a cualquiera.

[^flu-deaths]: CNN: https://www.cnn.com/2018/09/26/health/flu-deaths-2017--2018-cdc-bn/index.html

[^2026-excess]: Los números finales fueron mucho peores de lo que podía ver en mayo de 2020. La OMS estimó cerca de 14.9 millones de muertes en exceso en el mundo solo en 2020 y 2021.

:::pullquote
Las personas ricas pueden sobrevivir a muchas cosas que cobran muchas vidas todos los días en todo el mundo, pero esta es una enfermedad nueva y no pueden pagar por inmunidad (aún).
:::

### "El gobierno del país X está muy mal"

Cualquier respuesta de los gobiernos fue un experimento y algunos podrían haber funcionado mejor, pero reemplaza X con cualquier país y será cierto para casi el 95% de los países.

La epidemia de influenza en 2009 tuvo una respuesta más rápida de los Estados Unidos porque comenzó muy cerca, en México.[^cruise] Creo que el mundo asumió que era un problema solo de China y que la distancia nos protegía a todos.

[^cruise]: Incluso las compañías de cruceros comenzaron a tomar precauciones muy rápido en 2009. [Web Archive (en inglés)](https://web.archive.org/web/20090630144402/http://www.sdbj.com/industry_article.asp?aID=47999878.5516779.1777724.4325329.569692.256&aID2=136739)

Esta crisis es algo para lo que nadie podría haber estado preparado[^2026-prepared] (porque requiere mucho dinero y planificación), pero es muy importante descubrir cuál es el mejor plan para cuando llegue una nueva enfermedad contagiosa en el futuro.

[^2026-prepared]: Hoy lo diría con más cuidado. Taiwán y Corea del Sur tenían planes desde el SARS y el MERS y les fue mucho mejor al principio, y mi propio ejemplo de 2009 justo arriba apunta a lo mismo.

Vendrán más enfermedades pero tenemos que estar preparados.[^2026m-morediseases]

[^2026m-morediseases]: held: La viruela símica se declaró emergencia global en 2022 y otra vez en 2024, y la gripe aviar H5N1 llegó a las vacas lecheras de Estados Unidos en 2024.

## "¡Aplanamos la curva!"

Como podemos ver en la siguiente figura, el comportamiento de la curva es muy parecido en todos los países, algunos han podido ralentizarlo y en otros las muertes siguen al alza. Las medidas de "quédate en casa" no han tenido el mismo efecto en todos los países por diferencias socioeconómicas pero estamos en el mismo barco y no podemos asumir que podemos regresar a la normalidad porque nuestro país, estado o municipio ya está mejor. Tendremos que esperar hasta que la tasa de mortalidad sea cercana a cero.[^2026m-deathrate]

[^2026m-deathrate]: missed: La mayoría de los países quitaron sus restricciones en 2021 y 2022, mucho antes de que las vacunas llegaran a todos. La OMS terminó la emergencia en mayo de 2023 con gente que seguía muriendo.

Eso no significa que el mundo se deba detener hasta que se resuelva, pero tendremos que seguir ciertas medidas por un tiempo hasta que una vacuna sea accesible para todos.

:::figure main #fig-deaths
```chart
type: line
data: 2020-05-30/covid-deaths.csv
x: day
y: deaths
scale: log
xUnit: day
series: country
focus: [Brazil, India, Chile, Colombia]
highlight: Mexico
# China's 17 Apr 2020 revision added 1,290 deaths in one day and draws a 7-day box at day 83-89.
exclude: [China]
yTicks: [10, 100, 1000]
xTickStep: 20
yTitle: muertes por día · promedio de 7 días · escala log
xTitle: días desde las primeras 5 muertes diarias
note: ya pasaron su pico: US, UK, France, Italy, Spain …
alt: Muertes diarias confirmadas por COVID-19 por país en escala logarítmica: Brazil, Mexico, India, Chile y Colombia seguían subiendo hacia el día 50–66, mientras que US, UK, France, Italy, Spain y casi toda Europa ya habían pasado su pico.
```

Muertes diarias confirmadas por COVID-19, alineadas por el día en que cada país reportó cinco por primera vez. Mexico, Brazil, India, Chile y Colombia parecen estar en la misma situación, muertes al alza sin un pico aparente.

Fuente: European CDC vía Our World in Data, datos al 30 de mayo de 2020, CC BY.
:::

## "La economía está colapsando, tenemos que volver a la normalidad"

Cualquier persona está en riesgo de contraer el virus, y algunos le dirán que ya no es "normal".

Traduzco eso como: la confianza ya no es un hecho. Cuando se da la mano, compra una comida, sube a un avión o tren, comparte un automóvil, etc., ¿confía en que las otras personas no tengan una enfermedad contagiosa?

:::pullquote
Con el tiempo, si conseguimos una cura, no pensaremos tanto en ello, pero una vez que llegue una nueva enfermedad, la confianza será la primera víctima global.[^2026m-trust]
:::

[^2026m-trust]: held: Pew encontró que la proporción de estadounidenses con mucha confianza en los científicos cayó de 39% a finales de 2020 a 23% en 2023.

La economía también sufrirá problemas de confianza porque las personas comenzarán a pensar dos veces antes de adquirir algo,[^2026m-thinktwice] ya sea por miedo o porque necesitan ese dinero para atención médica.

[^2026m-thinktwice]: partly: Cierto por unos meses, cuando el ahorro en Estados Unidos subió en 2020. Después la gente volvió a gastar, y en 2021 y 2022 la preocupación pasó a ser la inflación.

### "Pero necesito trabajar"

Quedarse en casa es un privilegio, algunos de nosotros tenemos la suerte de poder trabajar desde casa, pero no todos pueden hacerlo, y es precisamente por eso que tenemos que presionar al gobierno para que brinde soluciones para todos.

Necesitas trabajar para obtener dinero, necesitas dinero para alimentos, vivienda y servicios públicos. Las tiendas, los caseros y las corporaciones necesitan tu dinero para seguir existiendo, pagar a sus empleados, pagar impuestos, etc. La cadena continúa hasta que alguien pueda brindar asistencia perdonando los cargos.

El colapso económico no es algo que solo tú tienes que sufrir, es algo que los gobiernos tendrán que planificar y contar con procedimientos sobre cómo ayudar a los necesitados en situaciones como esta.

Lamentablemente, como dije antes, nadie estaba preparado para esto e incluso más triste: la gente morirá por la falta de procedimientos claros en una crisis como esta.

Ve a trabajar, pero toma precauciones. Si perdiste tu trabajo, la tendrás mucho más difícil, pero no desesperes ni pongas en riesgo a tus seres queridos. Su vida y la tuya valen más que todo lo demás.

## Suposiciones

- El verano ya está aquí, pero el turismo no será el mismo, mucha gente no viajará por miedo y muchos países sufrirán, económica y socialmente.[^2026m-tourism]

- Se necesita un mejor diseño de máscara cubrebocas, veremos nuevos diseños para uso prolongado.[^2026m-masks]

- Algunos modelos[^models] muestran que sin una cura y un distanciamiento social permanente, COVID-19 vendrá en oleadas o al menos que vendrá una nueva ola al quitar restricciones. Temo que tengamos una mala mutación en un país donde las restricciones no puedan seguirse y que volvamos al pánico.[^2026m-mutation]

  :::figure margin #fig-rt
  ```chart
  type: line
  data: 2020-05-30/ca-rt.csv
  x: date
  y: rt
  scale: linear
  xUnit: date
  # 11-13 Feb are model warm-up spikes (R_t 37, 13, 6), not estimates.
  xFrom: 2020-02-15
  yMin: 0
  yMax: 4
  yTicks: [1, 2, 3]
  band: [p10, p90]
  split: 2020-05-16
  markerAt: 2020-05-20
  markerLabel: reapertura
  ref: 1
  refLabel: R = 1
  peak: true
  yTitle: R_t
  alt: Número reproductivo modelado para California: cerca de 1.1 durante mayo, y luego un rebote proyectado hasta un pico de 2.4 tras la reapertura en junio bajo el escenario de regreso a la normalidad.
  ```
  El R<sub>t</sub> modelado de California bajo el escenario de "regreso a la normalidad", según la proyección del 16 de mayo de 2020. La banda es el rango del 10 al 90 % del modelo.

  Fuente: Modeling COVID, modelingcovid.com (corrida del 16 de mayo de 2020; la captura original del texto venía de una corrida un poco posterior).
  :::

[^2026m-tourism]: partly: Cierto ese verano y el siguiente. Para 2024, ONU Turismo contó las llegadas internacionales de vuelta al 99% de 2019.

[^2026m-masks]: partly: Los mejores cubrebocas sí se volvieron comunes (N95, KN95), pero eran diseños viejos que solo se volvieron más fáciles de conseguir. No vi que se impusiera un diseño nuevo.

[^2026m-mutation]: held: Llegaron olas después de las reaperturas, y Delta (2021) y Ómicron (finales de 2021) regresaron el pánico. Las variantes aparecieron donde el virus se propagó mucho, no solo donde no se seguían las reglas.

[^models]: "Modeling COVID" <https://modelingcovid.com/state/CA>

- Las personas ricas valorarán más el aislamiento, las empresas que ofrezcan productos utilizados de esa forma van a recibir fondos de capital.[^2026m-vcs]

[^2026m-vcs]: held: Peloton, Zoom y las apps de entrega crecieron mucho en 2020 y 2021, y Peloton después perdió casi todo su valor.

Todo esto son solo mis opiniones, pero creo que el mayor distanciamiento social no serán los 2 metros de distancia a otras personas, sino la división entre las clases sociales con los pobres falleciendo más y los ricos tratando de alejarse más del contacto riesgoso con potenciales portadores.[^2026m-kshape]

[^2026m-kshape]: held: "Recuperación en K" fue el nombre que le pusieron. El Banco Mundial estimó que cerca de 70 millones de personas cayeron en pobreza extrema en 2020, el mayor salto en un año desde que empezó a contar en 1990.

Sé que en libros como "Factfulness" se presentan estadísticas sobre cómo las cosas han ido mejorando. Pero para mí, eso es solo un síntoma de la globalización.[^2026-globalization]

[^2026-globalization]: Las dos cosas resultaron ciertas. La pobreza extrema venía bajando por décadas, y en 2020 subió por primera vez en una generación.

Los números de todos los países son más parecidos a los del primer mundo, los promedios hacen que parezca que los países pobres son cada vez menos con el tiempo, pero la diferencia entre los pobres y los ricos sigue siendo grande y una crisis como esta agrava esa brecha y la hace más aparente.

La vida sigue, y es corta. Espero que salgamos de este problema en un futuro cercano y que comencemos a arreglar tantas cosas que están mal en nuestro mundo.

---

:::scorecard

## Predicciones, calificadas en 2026

| Lo que dije en mayo de 2020 | Veredicto | Lo que pasó |
|---|---|---|
| La COVID-19 llegó para quedarse | held | Endémica, vacunas anuales |
| Vendrán más enfermedades | held | Emergencias de viruela símica 2022 y 2024, H5N1 en ganado 2024 |
| Esperar a que la mortalidad mundial sea casi cero | missed | Restricciones fuera en 2021 y 2022, emergencia de la OMS terminó en mayo de 2023 |
| La confianza será la primera víctima | held | Pew: "mucha" confianza en los científicos 39% a 23% (2020 a 2023) |
| La gente lo pensará dos veces antes de comprar | partly | Breve pico de ahorro, luego auge del gasto e inflación |
| El turismo no será el mismo | partly | Dos años a la baja, 99% de 2019 para 2024 |
| Se necesitan mejores cubrebocas | partly | N95 y KN95 se volvieron comunes, sin diseño nuevo |
| Olas y una mala mutación | held | Delta, Ómicron |
| Los fondos respaldarán productos de aislamiento | held | Auge de Peloton y Zoom, luego caída |
| Los pobres morirán más | held | Recuperación en K, unos 70M en pobreza extrema en 2020 |

Fuentes: OMS muertes en exceso (mayo 2022), Pew Research (nov 2023), ONU Turismo (ene 2025), Banco Mundial Poverty and Shared Prosperity 2022.

:::
