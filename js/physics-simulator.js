/**
 * PREMIUM PHYSICS SIMULATOR - MASS-SPRING & ENERGY ANALYSIS
 * Cuaderno Digital Interactivo de Física III
 * Diseñado por el equipo multidisciplinar de IAs
 */

class PhysicsSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Parámetros del oscilador armónico
    this.mass = 1.0;       // kg
    this.k = 25.0;         // N/m
    this.A = 1.8;          // Amplitud [m]
    this.damping = 0.0;    // Sin amortiguamiento por defecto (M.A.S. ideal)

    // Estado dinámico
    this.x = this.A;       // Elongación inicial en el extremo
    this.v = 0.0;          // Velocidad inicial en reposo
    this.a = 0.0;          // Aceleración inicial
    this.time = 0.0;
    this.isRunning = true;

    // Escala gráfica
    this.pixelsPerMeter = 75;

    this.initCanvasDPI();
    this.bindEvents();
    this.startSimulation();
  }

  initCanvasDPI() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 700;
    this.height = rect.height || 280;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.initCanvasDPI();
    });

    // Controles de sliders
    const setupSlider = (id, pillId, unit, setter) => {
      const slider = document.getElementById(id);
      const pill = document.getElementById(pillId);
      if (slider && pill) {
        slider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          pill.innerText = `${val.toFixed(1)} ${unit}`;
          setter(val);
          this.updateTheoreticalCalculations();
        });
      }
    };

    setupSlider('simMass', 'simMassVal', 'kg', (v) => { this.mass = v; });
    setupSlider('simK', 'simKVal', 'N/m', (v) => { this.k = v; });
    setupSlider('simAmp', 'simAmpVal', 'm', (v) => {
      this.A = v;
      this.x = v;
      this.v = 0;
    });

    // Botones de control
    const playBtn = document.getElementById('simPlayPause');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.isRunning = !this.isRunning;
        playBtn.innerHTML = this.isRunning ? 
          '<i class="fa-solid fa-pause"></i> Pausar' : 
          '<i class="fa-solid fa-play"></i> Reanudar';
      });
    }

    const resetBtn = document.getElementById('simReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.reset();
      });
    }

    const stepBtn = document.getElementById('simStep');
    if (stepBtn) {
      stepBtn.addEventListener('click', () => {
        this.isRunning = false;
        if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Reanudar';
        this.stepPhysics(0.04);
        this.render();
      });
    }

    this.updateTheoreticalCalculations();
  }

  reset() {
    this.x = this.A;
    this.v = 0;
    this.time = 0;
    this.updateTheoreticalCalculations();
  }

  // Cálculos Teóricos del M.A.S.
  updateTheoreticalCalculations() {
    const omega = Math.sqrt(this.k / this.mass);
    const T = (2 * Math.PI) / omega;
    const f = 1 / T;
    const E_total = 0.5 * this.k * Math.pow(this.A, 2);
    const v_max = omega * this.A;
    const a_max = Math.pow(omega, 2) * this.A;

    // Actualizar elementos HUD si existen en el DOM
    const updateEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.innerText = text;
    };

    updateEl('simOmegaVal', `${omega.toFixed(2)} rad/s`);
    updateEl('simPeriodVal', `${T.toFixed(2)} s`);
    updateEl('simFreqVal', `${f.toFixed(2)} Hz`);
    updateEl('simEnergyVal', `${E_total.toFixed(2)} J`);
    updateEl('simVmaxVal', `${v_max.toFixed(2)} m/s`);
    updateEl('simAmaxVal', `${a_max.toFixed(2)} m/s²`);
  }

  // Integración física mediante método Verlet / Euler Cromer para estabilidad absoluta
  stepPhysics(dt) {
    const omegaSq = this.k / this.mass;
    this.a = -omegaSq * this.x - (this.damping * this.v) / this.mass;
    this.v += this.a * dt;
    this.x += this.v * dt;
    this.time += dt;

    // Actualizar barras de energía en tiempo real
    this.updateEnergyBars();
  }

  updateEnergyBars() {
    const Ec = 0.5 * this.mass * Math.pow(this.v, 2);
    const Ep = 0.5 * this.k * Math.pow(this.x, 2);
    const Em = Ec + Ep;
    const maxTheoretical = 0.5 * this.k * Math.pow(this.A, 2) || 1;

    const fillEc = document.getElementById('energyFillEc');
    const fillEp = document.getElementById('energyFillEp');
    const fillEm = document.getElementById('energyFillEm');

    const txtEc = document.getElementById('energyValEc');
    const txtEp = document.getElementById('energyValEp');
    const txtEm = document.getElementById('energyValEm');

    const pctEc = Math.min(100, Math.max(0, (Ec / maxTheoretical) * 100));
    const pctEp = Math.min(100, Math.max(0, (Ep / maxTheoretical) * 100));
    const pctEm = Math.min(100, Math.max(0, (Em / maxTheoretical) * 100));

    if (fillEc) fillEc.style.width = `${pctEc}%`;
    if (fillEp) fillEp.style.width = `${pctEp}%`;
    if (fillEm) fillEm.style.width = `${pctEm}%`;

    if (txtEc) txtEc.innerText = `${Ec.toFixed(2)} J (${pctEc.toFixed(0)}%)`;
    if (txtEp) txtEp.innerText = `${Ep.toFixed(2)} J (${pctEp.toFixed(0)}%)`;
    if (txtEm) txtEm.innerText = `${Em.toFixed(2)} J`;
  }

  startSimulation() {
    let lastTime = performance.now();
    const frame = (currentTime) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      if (this.isRunning) {
        this.stepPhysics(dt);
      }
      this.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  // RENDERIZADO VISUAL DEL SISTEMA MASA-RESORTE Y VECTORES
  render() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    const wallX = 65;
    const groundY = height * 0.72;
    const equilibriumX = width * 0.52;
    const blockWidth = 60;
    const blockHeight = 60;
    const blockX = equilibriumX + this.x * this.pixelsPerMeter - blockWidth / 2;
    const blockY = groundY - blockHeight;

    // 1. Dibujar Pared de Apoyo (Izquierda)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(wallX - 22, 40, 22, groundY - 20);
    // Rayado de fijación de pared
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    for (let y = 50; y < groundY - 20; y += 12) {
      ctx.beginPath();
      ctx.moveTo(wallX - 22, y);
      ctx.lineTo(wallX - 6, y + 10);
      ctx.stroke();
    }

    // 2. Dibujar Suelo Horizontal
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(wallX - 22, groundY, width - wallX + 22, 10);
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(wallX - 22, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // 3. Línea de Equilibrio x = 0 (Referencia)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(67, 40, 116, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(equilibriumX, 40);
    ctx.lineTo(equilibriumX, groundY + 25);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.fillStyle = '#432874';
    ctx.textAlign = 'center';
    ctx.fillText('x = 0 (Equilibrio)', equilibriumX, groundY + 22);

    // 4. Dibujar Resorte Helicoidal Realista
    this.drawHelicalSpring(wallX, blockY + blockHeight / 2, blockX, blockY + blockHeight / 2, 16, 18);

    // 5. Dibujar Bloque de Masa m
    ctx.save();
    // Sombra del bloque
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    const blockGrad = ctx.createLinearGradient(blockX, blockY, blockX + blockWidth, blockY + blockHeight);
    blockGrad.addColorStop(0, '#6366f1');
    blockGrad.addColorStop(1, '#432874');
    ctx.fillStyle = blockGrad;
    ctx.beginPath();
    ctx.roundRect(blockX, blockY, blockWidth, blockHeight, 8);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#311b58';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rótulo de la Masa
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.mass.toFixed(1)} kg`, blockX + blockWidth / 2, blockY + blockHeight / 2);

    // 6. VECTORES EN TIEMPO REAL SUPERPUESTOS
    const blockCenterX = blockX + blockWidth / 2;
    const blockCenterY = blockY + blockHeight / 2;

    // Vector Elongación x (Azul)
    const arrowY = groundY + 45;
    if (Math.abs(this.x) > 0.02) {
      this.drawArrow(equilibriumX, arrowY, blockCenterX, arrowY, '#2563eb', 2.5, `x = ${this.x.toFixed(2)} m`);
    }

    // Vector Velocidad v (Verde Esmeralda)
    if (Math.abs(this.v) > 0.05) {
      const vScale = 25; // Factor de escala para visualización clara
      const vEndX = blockCenterX + this.v * vScale;
      this.drawArrow(blockCenterX, blockCenterY - 40, vEndX, blockCenterY - 40, '#16a34a', 3, `v = ${this.v.toFixed(2)} m/s`);
    }

    // Vector Aceleración / Fuerza Restauradora F = -kx (Rojo Carmesí)
    if (Math.abs(this.a) > 0.1) {
      const aScale = 2.8;
      const aEndX = blockCenterX + this.a * aScale;
      this.drawArrow(blockCenterX, blockCenterY - 65, aEndX, blockCenterY - 65, '#dc2626', 3, `F = ${(this.mass * this.a).toFixed(1)} N`);
    }
  }

  // Trazado de resorte elástico realista
  drawHelicalSpring(x1, y1, x2, y2, coils, radius) {
    const { ctx } = this;
    const dx = x2 - x1;
    const length = Math.max(20, dx);
    const leadIn = 15;
    const activeLength = length - leadIn * 2;
    const step = activeLength / (coils * 2);

    ctx.save();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + leadIn, y1);

    for (let i = 0; i < coils * 2; i++) {
      const cx = x1 + leadIn + (i + 0.5) * step;
      const cy = y1 + (i % 2 === 0 ? -radius : radius);
      ctx.lineTo(cx, cy);
    }

    ctx.lineTo(x2 - leadIn, y1);
    ctx.lineTo(x2, y1);
    ctx.stroke();

    // Brillo metálico
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  // Trazador de flechas vectoriales
  drawArrow(fromX, fromY, toX, toY, color, width, label) {
    const { ctx } = this;
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    // Cuerpo de la flecha
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Punta de la flecha
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Rótulo del vector
    if (label) {
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, (fromX + toX) / 2, Math.min(fromY, toY) - 5);
    }
    ctx.restore();
  }
}

window.PhysicsSimulator = PhysicsSimulator;
