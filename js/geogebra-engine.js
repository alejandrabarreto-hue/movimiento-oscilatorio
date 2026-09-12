/**
 * GEOGEBRA-STYLE CARTESIAN PLANE ENGINE
 * Cuaderno Digital Interactivo de Física III
 * Diseñado por el equipo multidisciplinar de IAs
 */

class GeogebraEngine {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Parámetros de transformación del plano cartesiano
    this.scale = options.scale || 60; // Píxeles por unidad física
    this.scaleY = options.scaleY || this.scale;
    this.origin = { x: 0, y: 0 }; // Se inicializa en centrado
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.activeTool = 'pan'; // 'pan', 'select'
    this.selectedObject = null;

    // Estilos de trazo configurables
    this.activeStyle = {
      color: '#2563eb', // Azul por defecto
      lineWidth: 2.5,
      lineDash: [] // [] para sólida, [6, 4] para discontinua, [2, 4] para puntos
    };

    // Parámetros físicos del M.A.S. a graficar
    this.physics = {
      A: 2.0,       // Amplitud [m]
      omega: 1.57,  // Frecuencia angular [rad/s] (~ pi/2 rad/s -> T = 4s)
      phi: 0.0,     // Fase inicial [rad]
      time: 0.0,    // Tiempo actual para trazado en vivo
      playing: true
    };

    // Visibilidad de curvas
    this.curves = {
      position: { visible: true, color: '#2563eb', name: 'Elongación x(t)', width: 2.5, dash: [] },
      velocity: { visible: true, color: '#16a34a', name: 'Velocidad v(t)', width: 2.5, dash: [6, 4] },
      acceleration: { visible: true, color: '#dc2626', name: 'Aceleración a(t)', width: 2.5, dash: [2, 3] }
    };

    // Soporte táctil
    this.touchDistance = null;

    // Inicialización
    this.initCanvasDPI();
    this.initOrigin();
    this.bindEvents();
    this.startAnimationLoop();
  }

  initCanvasDPI() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 800;
    this.height = rect.height || 480;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  initOrigin() {
    // Eje X a la izquierda (15%) para ver la evolución temporal positiva
    this.origin = {
      x: this.width * 0.15,
      y: this.height * 0.5
    };
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.initCanvasDPI();
      this.render();
    });

    // Eventos de Mouse
    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
    window.addEventListener('mousemove', (e) => this.onPointerMove(e));
    window.addEventListener('mouseup', () => this.onPointerUp());
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Eventos Táctiles (Touch)
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', () => this.onTouchEnd());

    // Botones de la barra de herramientas flotante
    const bindBtn = (id, action) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', action);
    };

    bindBtn('geoZoomIn', () => this.zoom(1.25));
    bindBtn('geoZoomOut', () => this.zoom(0.8));
    bindBtn('geoReset', () => this.resetView());
    bindBtn('geoPan', () => this.setActiveTool('pan'));
    bindBtn('geoSelect', () => this.setActiveTool('select'));

    // Botón de paleta de estilos
    const paletteBtn = document.getElementById('geoPalette');
    const paletteMenu = document.getElementById('geoPaletteMenu');
    if (paletteBtn && paletteMenu) {
      paletteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        paletteMenu.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!paletteMenu.contains(e.target) && e.target !== paletteBtn) {
          paletteMenu.classList.remove('show');
        }
      });
    }

    // Swatches de color
    document.querySelectorAll('.swatch').forEach(s => {
      s.addEventListener('click', (e) => {
        document.querySelectorAll('.swatch').forEach(x => x.classList.remove('selected'));
        e.target.classList.add('selected');
        this.activeStyle.color = e.target.getAttribute('data-color');
        if (this.curves.position.visible) this.curves.position.color = this.activeStyle.color;
        this.render();
      });
    });

    // Grosor de línea
    const widthSelect = document.getElementById('geoLineWidth');
    if (widthSelect) {
      widthSelect.addEventListener('change', (e) => {
        this.activeStyle.lineWidth = parseFloat(e.target.value);
        this.render();
      });
    }

    // Estilo de línea
    const dashSelect = document.getElementById('geoLineDash');
    if (dashSelect) {
      dashSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'solid') this.activeStyle.lineDash = [];
        else if (val === 'dashed') this.activeStyle.lineDash = [6, 4];
        else if (val === 'dotted') this.activeStyle.lineDash = [2, 4];
        this.render();
      });
    }

    // Checkboxes de visibilidad de curvas
    const bindCheck = (id, key) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          this.curves[key].visible = e.target.checked;
          this.render();
        });
      }
    };
    bindCheck('chkShowX', 'position');
    bindCheck('chkShowV', 'velocity');
    bindCheck('chkShowA', 'acceleration');
  }

  setActiveTool(tool) {
    this.activeTool = tool;
    document.querySelectorAll('.geo-btn-tool').forEach(btn => btn.classList.remove('active'));
    const target = document.getElementById(tool === 'pan' ? 'geoPan' : 'geoSelect');
    if (target) target.classList.add('active');

    if (tool === 'pan') {
      this.canvas.style.cursor = 'grab';
    } else {
      this.canvas.style.cursor = 'crosshair';
    }
  }

  // Conversión de coordenadas
  toScreenX(xMath) {
    return this.origin.x + xMath * this.scale;
  }

  toScreenY(yMath) {
    return this.origin.y - yMath * this.scaleY;
  }

  toMathX(xScreen) {
    return (xScreen - this.origin.x) / this.scale;
  }

  toMathY(yScreen) {
    return (this.origin.y - yScreen) / this.scaleY;
  }

  onPointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (this.activeTool === 'pan' || e.button === 1 || e.altKey) {
      this.isDragging = true;
      this.dragStart = { x: px - this.origin.x, y: py - this.origin.y };
      this.canvas.style.cursor = 'grabbing';
    } else if (this.activeTool === 'select') {
      this.inspectPointAt(px, py);
    }
  }

  onPointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Actualizar HUD de coordenadas
    const mathX = this.toMathX(px);
    const mathY = this.toMathY(py);
    const hud = document.getElementById('canvasCoordHud');
    if (hud) {
      hud.innerText = `t = ${mathX.toFixed(2)} s | y = ${mathY.toFixed(2)}`;
    }

    if (this.isDragging) {
      this.origin.x = px - this.dragStart.x;
      this.origin.y = py - this.dragStart.y;
      this.render();
    } else if (this.activeTool === 'select') {
      this.inspectPointAt(px, py);
      this.render();
    }
  }

  onPointerUp() {
    this.isDragging = false;
    this.canvas.style.cursor = this.activeTool === 'pan' ? 'grab' : 'crosshair';
  }

  onWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom centrado en el puntero
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    this.zoomAtPoint(mouseX, mouseY, zoomFactor);
  }

  zoomAtPoint(screenX, screenY, factor) {
    const mathX = this.toMathX(screenX);
    const mathY = this.toMathY(screenY);

    const newScale = Math.min(Math.max(this.scale * factor, 15), 350);
    this.scale = newScale;
    this.scaleY = newScale;

    this.origin.x = screenX - mathX * this.scale;
    this.origin.y = screenY + mathY * this.scaleY;

    this.render();
  }

  zoom(factor) {
    this.zoomAtPoint(this.width / 2, this.height / 2, factor);
  }

  resetView() {
    this.scale = 60;
    this.scaleY = 60;
    this.initOrigin();
    this.selectedObject = null;
    this.render();
  }

  // Soporte Táctil
  onTouchStart(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const px = e.touches[0].clientX - rect.left;
      const py = e.touches[0].clientY - rect.top;
      this.isDragging = true;
      this.dragStart = { x: px - this.origin.x, y: py - this.origin.y };
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.touchDistance = Math.hypot(dx, dy);
    }
  }

  onTouchMove(e) {
    if (e.touches.length === 1 && this.isDragging) {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const px = e.touches[0].clientX - rect.left;
      const py = e.touches[0].clientY - rect.top;
      this.origin.x = px - this.dragStart.x;
      this.origin.y = py - this.dragStart.y;
      this.render();
    } else if (e.touches.length === 2 && this.touchDistance) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / this.touchDistance;
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const rect = this.canvas.getBoundingClientRect();
      this.zoomAtPoint(midX - rect.left, midY - rect.top, factor > 1 ? 1.05 : 0.95);
      this.touchDistance = dist;
    }
  }

  onTouchEnd() {
    this.isDragging = false;
    this.touchDistance = null;
  }

  inspectPointAt(px, py) {
    const t = this.toMathX(px);
    if (t < 0) {
      this.selectedObject = null;
      return;
    }

    const { A, omega, phi } = this.physics;
    const xVal = A * Math.cos(omega * t + phi);
    const vVal = -omega * A * Math.sin(omega * t + phi);
    const aVal = -Math.pow(omega, 2) * A * Math.cos(omega * t + phi);

    this.selectedObject = {
      t,
      x: xVal,
      v: vVal,
      a: aVal,
      screenX: px
    };
  }

  // Bucle de animación suave
  startAnimationLoop() {
    let lastTimestamp = performance.now();
    const loop = (currentTimestamp) => {
      const dt = (currentTimestamp - lastTimestamp) / 1000;
      lastTimestamp = currentTimestamp;

      if (this.physics.playing) {
        this.physics.time += dt * 0.9;
        // Ciclo cada 12 segundos para demostración
        if (this.physics.time > 12) {
          this.physics.time = 0;
        }
      }

      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // RENDERIZADO DEL PLANO ESTILO GEOGEBRA
  render() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    this.drawMillimeterGrid();
    this.drawAxesWithRulesAndTicks();
    this.drawKinematicCurves();
    this.drawDynamicTimeMarker();
    if (this.selectedObject) {
      this.drawInspectionOverlay();
    }
  }

  // Cuadrícula Estilo GeoGebra con Papel Milimetrado
  drawMillimeterGrid() {
    const { ctx, width, height, scale, origin } = this;

    // Calcular paso de cuadrícula dinámico según el nivel de zoom
    let majorStep = 1; // 1 segundo / unidad
    if (scale < 30) majorStep = 2;
    if (scale < 18) majorStep = 5;
    if (scale > 120) majorStep = 0.5;
    if (scale > 220) majorStep = 0.2;

    const minorStep = majorStep / 5; // 5 subdivisiones milimétricas

    const minX = -origin.x / scale;
    const maxX = (width - origin.x) / scale;
    const minY = (origin.y - height) / this.scaleY;
    const maxY = origin.y / this.scaleY;

    // 1. Cuadrícula Menor (Estilo Papel Milimetrado fino)
    ctx.beginPath();
    ctx.strokeStyle = '#f1f5f9'; // Muy sutil
    ctx.lineWidth = 1;

    const startMinorX = Math.floor(minX / minorStep) * minorStep;
    for (let x = startMinorX; x <= maxX; x += minorStep) {
      const sx = Math.round(this.toScreenX(x)) + 0.5;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
    }

    const startMinorY = Math.floor(minY / minorStep) * minorStep;
    for (let y = startMinorY; y <= maxY; y += minorStep) {
      const sy = Math.round(this.toScreenY(y)) + 0.5;
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
    }
    ctx.stroke();

    // 2. Cuadrícula Mayor
    ctx.beginPath();
    ctx.strokeStyle = '#e2e8f0'; // Líneas primarias
    ctx.lineWidth = 1.2;

    const startMajorX = Math.floor(minX / majorStep) * majorStep;
    for (let x = startMajorX; x <= maxX; x += majorStep) {
      const sx = Math.round(this.toScreenX(x)) + 0.5;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
    }

    const startMajorY = Math.floor(minY / majorStep) * majorStep;
    for (let y = startMajorY; y <= maxY; y += majorStep) {
      const sy = Math.round(this.toScreenY(y)) + 0.5;
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
    }
    ctx.stroke();
  }

  // Ejes cartesianos con reglas, marcas graduadas (ticks) y números
  drawAxesWithRulesAndTicks() {
    const { ctx, width, height, scale, origin } = this;

    const axisX = Math.round(origin.x) + 0.5;
    const axisY = Math.round(origin.y) + 0.5;

    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Eje X (Horizontal - Tiempo [s])
    if (axisY >= 0 && axisY <= height) {
      ctx.beginPath();
      ctx.moveTo(0, axisY);
      ctx.lineTo(width, axisY);
      ctx.stroke();

      // Flecha del eje X
      ctx.beginPath();
      ctx.moveTo(width - 10, axisY - 5);
      ctx.lineTo(width, axisY);
      ctx.lineTo(width - 10, axisY + 5);
      ctx.fillStyle = '#334155';
      ctx.fill();

      // Rótulo del eje X
      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.fillText('Tiempo t (s)', width - 48, axisY - 14);
    }

    // Eje Y (Vertical - Amplitud / Magnitud)
    if (axisX >= 0 && axisX <= width) {
      ctx.beginPath();
      ctx.moveTo(axisX, 0);
      ctx.lineTo(axisX, height);
      ctx.stroke();

      // Flecha del eje Y
      ctx.beginPath();
      ctx.moveTo(axisX - 5, 10);
      ctx.lineTo(axisX, 0);
      ctx.lineTo(axisX + 5, 10);
      ctx.fillStyle = '#334155';
      ctx.fill();

      // Rótulo del eje Y
      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.fillText('Magnitud (x, v, a)', axisX + 65, 14);
    }

    // Ticks y Regla Graduada sobre los Ejes
    let step = 1;
    if (scale < 30) step = 2;
    if (scale < 18) step = 5;
    if (scale > 120) step = 0.5;

    const minX = Math.floor(-origin.x / scale);
    const maxX = Math.ceil((width - origin.x) / scale);

    // Ticks en Eje X
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#475569';
    for (let x = minX; x <= maxX; x += step) {
      if (Math.abs(x) < 0.001) continue; // Origen se rotula aparte
      const sx = this.toScreenX(x);
      const sy = Math.max(15, Math.min(height - 15, axisY));

      // Tick mayor
      ctx.beginPath();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.moveTo(sx, sy - 5);
      ctx.lineTo(sx, sy + 5);
      ctx.stroke();

      // Sub-ticks menores (regla milimetrada)
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#94a3b8';
      for (let s = 1; s < 5; s++) {
        const subX = sx + (s * step / 5) * scale;
        ctx.beginPath();
        ctx.moveTo(subX, sy - 2.5);
        ctx.lineTo(subX, sy + 2.5);
        ctx.stroke();
      }

      // Número
      ctx.fillText(Number(x.toFixed(2)).toString(), sx, sy + 15);
    }

    // Ticks en Eje Y
    const minY = Math.floor((origin.y - height) / this.scaleY);
    const maxY = Math.ceil(origin.y / this.scaleY);

    ctx.textAlign = 'right';
    for (let y = minY; y <= maxY; y += step) {
      if (Math.abs(y) < 0.001) continue;
      const sy = this.toScreenY(y);
      const sx = Math.max(25, Math.min(width - 25, axisX));

      // Tick mayor
      ctx.beginPath();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.moveTo(sx - 5, sy);
      ctx.lineTo(sx + 5, sy);
      ctx.stroke();

      // Sub-ticks menores
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#94a3b8';
      for (let s = 1; s < 5; s++) {
        const subY = sy - (s * step / 5) * this.scaleY;
        ctx.beginPath();
        ctx.moveTo(sx - 2.5, subY);
        ctx.lineTo(sx + 2.5, subY);
        ctx.stroke();
      }

      // Número
      ctx.fillText(Number(y.toFixed(2)).toString(), sx - 8, sy);
    }

    // Origen (0,0)
    ctx.textAlign = 'right';
    ctx.fillText('0', axisX - 6, axisY + 14);

    ctx.restore();
  }

  // Trazado de Curvas Cinemáticas del M.A.S.
  drawKinematicCurves() {
    const { ctx, width, physics, curves } = this;
    const { A, omega, phi } = physics;

    const minT = Math.max(0, this.toMathX(0));
    const maxT = this.toMathX(width);
    const dt = 0.02; // Paso de integración para curva ultra-suave

    // 1. Curva de Posición x(t) = A * cos(omega * t + phi)
    if (curves.position.visible) {
      this.drawSingleCurve((t) => A * Math.cos(omega * t + phi), minT, maxT, dt, curves.position);
    }

    // 2. Curva de Velocidad v(t) = -omega * A * sin(omega * t + phi)
    if (curves.velocity.visible) {
      this.drawSingleCurve((t) => -omega * A * Math.sin(omega * t + phi), minT, maxT, dt, curves.velocity);
    }

    // 3. Curva de Aceleración a(t) = -omega^2 * A * cos(omega * t + phi)
    if (curves.acceleration.visible) {
      this.drawSingleCurve((t) => -Math.pow(omega, 2) * A * Math.cos(omega * t + phi), minT, maxT, dt, curves.acceleration);
    }
  }

  drawSingleCurve(func, minT, maxT, dt, style) {
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width;
    ctx.setLineDash(style.dash);

    let started = false;
    for (let t = minT; t <= maxT; t += dt) {
      const y = func(t);
      const sx = this.toScreenX(t);
      const sy = this.toScreenY(y);

      if (!started) {
        ctx.moveTo(sx, sy);
        started = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  // Marcador Dinámico de Tiempo que sincroniza las 3 curvas
  drawDynamicTimeMarker() {
    const { ctx, physics, curves, height } = this;
    const { A, omega, phi, time } = physics;

    const sx = this.toScreenX(time);
    if (sx < 0 || sx > this.width) return;

    ctx.save();

    // Línea vertical que corta las 3 curvas en el tiempo t
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(67, 40, 116, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, height);
    ctx.stroke();

    // Puntos móviles sobre cada curva activa
    const points = [];
    if (curves.position.visible) {
      const xVal = A * Math.cos(omega * time + phi);
      points.push({ val: xVal, color: curves.position.color, label: `x=${xVal.toFixed(2)}m` });
    }
    if (curves.velocity.visible) {
      const vVal = -omega * A * Math.sin(omega * time + phi);
      points.push({ val: vVal, color: curves.velocity.color, label: `v=${vVal.toFixed(2)}m/s` });
    }
    if (curves.acceleration.visible) {
      const aVal = -Math.pow(omega, 2) * A * Math.cos(omega * time + phi);
      points.push({ val: aVal, color: curves.acceleration.color, label: `a=${aVal.toFixed(2)}m/s²` });
    }

    points.forEach(pt => {
      const sy = this.toScreenY(pt.val);

      // Círculo con efecto glow
      ctx.beginPath();
      ctx.fillStyle = pt.color;
      ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });

    ctx.restore();
  }

  // Tarjeta de Inspección de Coordenadas
  drawInspectionOverlay() {
    const { ctx, selectedObject } = this;
    const { t, x, v, a, screenX } = selectedObject;

    ctx.save();
    // Línea guía
    ctx.beginPath();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([3, 3]);
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, this.height);
    ctx.stroke();

    // Cuadro flotante
    const boxWidth = 175;
    const boxHeight = 85;
    let boxX = screenX + 12;
    if (boxX + boxWidth > this.width) boxX = screenX - boxWidth - 12;
    const boxY = 20;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(`Punto en t = ${t.toFixed(2)} s:`, boxX + 10, boxY + 18);

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#2563eb';
    ctx.fillText(`x(t) = ${x.toFixed(2)} m`, boxX + 10, boxY + 36);

    ctx.fillStyle = '#16a34a';
    ctx.fillText(`v(t) = ${v.toFixed(2)} m/s`, boxX + 10, boxY + 54);

    ctx.fillStyle = '#dc2626';
    ctx.fillText(`a(t) = ${a.toFixed(2)} m/s²`, boxX + 10, boxY + 72);

    ctx.restore();
  }

  // Actualización de parámetros físicos desde controles externos
  updatePhysics(params) {
    Object.assign(this.physics, params);
    this.render();
  }
}

window.GeogebraEngine = GeogebraEngine;
