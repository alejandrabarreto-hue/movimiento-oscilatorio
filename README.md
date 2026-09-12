# ⚛️ Cuaderno Digital Interactivo — Física III

> **Movimiento Oscilatorio y Cinemática del Movimiento Armónico Simple (M.A.S.)**  
> Una experiencia educativa inmersiva construida con HTML, CSS y JavaScript puro.

---

## 🌐 Demo en Vivo

> Abre `index.html` directamente en tu navegador — no requiere instalación ni servidor.

---

## 📖 Descripción

**Cuaderno Digital Vertical de Física III** es una Single Page Application (SPA) educativa que simula la experiencia visual y táctil de un cuaderno espiral físico, llevada al entorno digital con animaciones fluidas a 60 FPS, fórmulas matemáticas renderizadas con KaTeX, laboratorios interactivos y un simulador de física en tiempo real.

Diseñado para estudiantes universitarios de Física III, cubre en profundidad los conceptos de **Movimiento Oscilatorio** y **Cinemática del M.A.S.** a través de 15 hojas interactivas con navegación animada.

---

## ✨ Características Principales

| Característica | Descripción |
|---|---|
| 📓 **Cuaderno Vertical** | Diseño tipo cuaderno espiral con encuadernación metálica superior y animaciones de volteo vertical |
| 🔢 **Fórmulas KaTeX** | Renderizado matemático de alta calidad: ecuaciones diferenciales, integrales, derivadas |
| 📊 **Motor GeoGebra-Style** | Plano cartesiano interactivo con papel milimetrado, ticks, zoom centrado y pan |
| ⚙️ **Simulador Masa-Resorte** | Simulación en tiempo real con control de masa, constante de resorte, amplitud y amortiguamiento |
| 🎵 **Web Audio API** | Sonido sintetizado al pasar hojas para mayor inmersión |
| 🗺️ **Mapa Mental SVG** | Mapa mental interactivo clickeable con nodos y conexiones animadas |
| 🔍 **Glosario en Vivo** | Búsqueda en tiempo real sobre términos físicos y matemáticos |
| 📱 **Responsive** | Adaptable a distintos tamaños de pantalla |
| 🖥️ **Modo Pantalla Completa** | Soporte nativo para la Fullscreen API del navegador |

---

## 📂 Estructura del Proyecto

```
FISICA 3/
│
├── index.html              # SPA principal con las 15 hojas del cuaderno
├── README.md               # Este archivo
│
├── css/
│   └── notebook.css        # Sistema de diseño completo: variables, animaciones, componentes
│
├── js/
│   ├── app.js              # Controlador principal: navegación, audio, eventos globales
│   ├── geogebra-engine.js  # Motor gráfico Canvas 2D (zoom, pan, reglas, curvas)
│   └── physics-simulator.js # Simulador M.A.S. con cálculo numérico y energías
│
└── imagenes/
    ├── portada.webp         # Imagen de portada del cuaderno
    └── plantilla_contenido.webp # Plantilla de fondo para páginas internas
```

---

## 📚 Contenido — Las 15 Hojas

| Hoja | Módulo | Contenido |
|:---:|---|---|
| 1 | **Portada** | Portada oficial del cuaderno |
| 2 | **Presentación** | Equipo multidisciplinar de IAs y prólogo editorial |
| 3 | **Índice** | Índice general con navegación directa a cada módulo |
| 4 | **Módulo I** | Mapa Mental Interactivo del Movimiento Oscilatorio |
| 5 | **Módulo II** | Línea de Tiempo y Reseña Histórica (Hooke, Newton, Galileo...) |
| 6 | **Módulo III** | Conceptos y Definiciones Fundamentales |
| 7 | **Módulo IV** | M.A.S. y Dinámica — Ecuación diferencial de 2do orden |
| 8 | **Módulo V** | Cinemática del M.A.S. — Elongación y Posición |
| 9 | **Módulo VI** | Cinemática del M.A.S. — Velocidad y Desfase Temporal |
| 10 | **Módulo VII** | Cinemática del M.A.S. — Aceleración y Resumen |
| 11 | **Laboratorio** | Plano Cartesiano estilo GeoGebra (interactivo) |
| 12 | **Laboratorio** | Simulador Masa-Resorte y Análisis de Energías |
| 13 | **Ejercicios** | Problemas resueltos paso a paso con código de colores |
| 14 | **Glosario** | Glosario científico con búsqueda en vivo |
| 15 | **Bibliografía** | Referencias académicas (Normas APA 7) |

---

## 🚀 Cómo Usar

### Opción 1 — Abrir directo (recomendado)

Simplemente haz doble clic en `index.html` o abre el archivo desde tu navegador. No se necesita ningún servidor ni instalación.

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

### Opción 2 — Servidor local (para evitar restricciones CORS)

```bash
# Con Python
python -m http.server 8080

# Con Node.js / npx
npx serve .

# Luego abre: http://localhost:8080
```

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Uso |
|---|---|
| **HTML5 Semántico** | Estructura de la SPA y 15 páginas del cuaderno |
| **CSS3 / Vanilla CSS** | Sistema de diseño, variables, animaciones 3D, glassmorphism |
| **JavaScript ES6+** | Lógica de navegación, SPA controller, simulaciones |
| **Canvas 2D API** | Motor gráfico GeoGebra-style y simulador de física |
| **Web Audio API** | Sintetizador de sonido para el paso de hojas |
| **KaTeX** | Renderizado de expresiones matemáticas LaTeX |
| **Font Awesome 6** | Iconografía |
| **Fullscreen API** | Modo pantalla completa nativo |

---

## 🎮 Controles de Navegación

| Acción | Control |
|---|---|
| Siguiente hoja | Botón `▼` / Scroll hacia abajo / Clic en portada |
| Hoja anterior | Botón `▲` / Scroll hacia arriba |
| Ir a hoja específica | Clic en el índice (Hoja 3) |
| Pantalla completa | Botón `⤢ Pantalla Completa` en la barra superior |
| Abrir modal gráfico | Botón `Modal Grande` en hojas con gráficos |
| Cerrar modal | Tecla `Escape` o botón `✕` |

---

## 🧮 Fórmulas Clave del M.A.S.

El cuaderno cubre, entre otras, las siguientes ecuaciones:

```
Ecuación diferencial:     ẍ + ω²x = 0
Posición:                 x(t) = A·cos(ωt + φ)
Velocidad:                v(t) = -Aω·sin(ωt + φ)
Aceleración:              a(t) = -Aω²·cos(ωt + φ)
Frecuencia angular:       ω = √(k/m)
Período:                  T = 2π/ω = 2π√(m/k)
Energía cinética:         Ec = ½mv²
Energía potencial:        Ep = ½kx²
Energía total:            E = ½kA²  (constante)
```

---

## 👥 Autores

Trabajo académico desarrollado por:

| Nombre | Rol |
|---|---|
| **Yennifer Alejandra Barreto Camejo** | Integrante del equipo |
| **Camila Rengifo Gutiérrez** | Integrante del equipo |
| **Santiago Peláez** | Integrante del equipo |

---

## 🏛️ Información Académica

| Campo | Detalle |
|---|---|
| **Universidad** | Universidad Tecnológica de Pereira (UTP) |
| **Materia** | Física III |
| **Tema** | Movimiento Oscilatorio y Cinemática del M.A.S. |
| **Tipo** | Trabajo de grado / Tarea académica |
| **Año** | 2026 |

---

## ©️ Derechos de Autor

```
Copyright © 2026
Yennifer Alejandra Barreto Camejo
Camila Rengifo Gutiérrez
Santiago Peláez

Universidad Tecnológica de Pereira — Física III
```

Este proyecto fue elaborado con **fines exclusivamente académicos** como parte de los requisitos de la asignatura **Física III** de la Universidad Tecnológica de Pereira.

- ✅ Se permite la consulta y estudio del código fuente con fines educativos.
- ✅ Se permite la referenciación citando correctamente a los autores y la institución.
- ❌ No se permite la reproducción total o parcial con fines comerciales.
- ❌ No se permite la presentación de este trabajo como propio sin el debido reconocimiento.

---

<div align="center">
  <sub>Construido con ❤️ para la educación científica · Física III · Universidad Tecnológica de Pereira · 2026</sub>
</div>
