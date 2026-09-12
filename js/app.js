/**
 * CUADERNO DIGITAL INTERACTIVO DE FÍSICA III
 * Controlador Principal de la Aplicación SPA Vertical
 * Diseñado por el equipo multidisciplinar de IAs
 */

document.addEventListener('DOMContentLoaded', () => {
  let currentPage = 1;
  const totalPages = 15;
  let isAnimating = false;
  let geogebraInstance = null;
  let simulatorInstance = null;

  // Audio sintetizado Web Audio API para simular el paso de hoja vertical
  let audioCtx = null;
  function playPageTurnSound() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch(e) {
      // Audio no permitido o silenciado
    }
  }

  // Navegación Vertical entre Hojas del Cuaderno
  function goToPage(pageNumber) {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage || isAnimating) return;

    // Si la modal gráfica está abierta, cerrarla limpiamente antes de cambiar de hoja
    if (typeof closeGraphicModal === 'function' && activeModalTarget) {
      closeGraphicModal(false);
    }

    isAnimating = true;
    const isForward = pageNumber > currentPage;
    const currentEl = document.getElementById(`page-${currentPage}`);
    const nextEl = document.getElementById(`page-${pageNumber}`);

    if (!currentEl || !nextEl) {
      isAnimating = false;
      return;
    }

    playPageTurnSound();

    // Clases de animación vertical
    const outClass = isForward ? 'flip-out-up' : 'flip-out-down';
    const inClass = isForward ? 'flip-in-up' : 'flip-in-down';

    // Preparar elemento entrante
    nextEl.classList.remove('active', 'flip-out-up', 'flip-out-down', 'flip-in-up', 'flip-in-down');
    currentEl.classList.remove('flip-out-up', 'flip-out-down', 'flip-in-up', 'flip-in-down');

    currentEl.classList.add(outClass);
    nextEl.classList.add(inClass);

    currentPage = pageNumber;
    updateNavigationControls();

    setTimeout(() => {
      currentEl.classList.remove('active', outClass);
      nextEl.classList.remove(inClass);
      nextEl.classList.add('active');

      const innerScroll = nextEl.querySelector('.page-inner-content');
      if (innerScroll) innerScroll.scrollTop = 0;

      // Renderizar KaTeX en la nueva hoja
      renderMath();

      // Inicializar o redimensionar motores en páginas específicas
      if (currentPage === 11) {
        setTimeout(() => {
          if (!geogebraInstance && window.GeogebraEngine) {
            geogebraInstance = new window.GeogebraEngine('geogebraCanvas');
          } else if (geogebraInstance) {
            geogebraInstance.initCanvasDPI();
            geogebraInstance.render();
          }
        }, 120);
      } else if (currentPage === 12) {
        setTimeout(() => {
          if (!simulatorInstance && window.PhysicsSimulator) {
            simulatorInstance = new window.PhysicsSimulator('simDisplayCanvas');
          } else if (simulatorInstance) {
            simulatorInstance.initCanvasDPI();
            simulatorInstance.render();
          }
        }, 120);
      }

      isAnimating = false;
    }, 420);
  }

  function updateNavigationControls() {
    const prevBtn = document.getElementById('navPrev');
    const nextBtn = document.getElementById('navNext');
    const pageSelect = document.getElementById('navPageSelect');
    const counter = document.getElementById('navCounter');

    if (prevBtn) prevBtn.disabled = (currentPage === 1);
    if (nextBtn) nextBtn.disabled = (currentPage === totalPages);
    if (pageSelect) pageSelect.value = currentPage;
    if (counter) counter.innerText = `Hoja ${currentPage} de ${totalPages}`;
  }

  // Vincular eventos de navegación
  const bindNav = () => {
    const prevBtn = document.getElementById('navPrev');
    const nextBtn = document.getElementById('navNext');
    const homeBtn = document.getElementById('navHome');
    const pageSelect = document.getElementById('navPageSelect');
    const fullscreenBtn = document.getElementById('btnFullscreen');
    const openCoverBtn = document.getElementById('btnOpenCover');
    const page1Cover = document.getElementById('page-1');

    if (prevBtn) prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
    if (homeBtn) homeBtn.addEventListener('click', () => goToPage(1));
    
    // Clic en la portada o su botón inferior abre la página 2
    if (openCoverBtn) {
      openCoverBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        goToPage(2);
      });
    }
    if (page1Cover) {
      page1Cover.addEventListener('click', () => {
        if (currentPage === 1) goToPage(2);
      });
    }

    if (pageSelect) {
      pageSelect.addEventListener('change', (e) => {
        goToPage(parseInt(e.target.value));
      });
    }

    // Atajos de teclado (flechas verticales y horizontales)
    window.addEventListener('keydown', (e) => {
      if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToPage(currentPage + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPage(currentPage - 1);
      } else if (e.key === 'Home') {
        goToPage(1);
      } else if (e.key === 'End') {
        goToPage(totalPages);
      }
    });

    // Pantalla completa
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          fullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i> <span>Salir</span>';
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
          fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i> <span>Pantalla Completa</span>';
        }
      });
    }

    // Enlaces directos desde el índice
    document.querySelectorAll('[data-target-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const p = parseInt(link.getAttribute('data-target-page'));
        if (!isNaN(p)) goToPage(p);
      });
    });
  };

  // Renderizador de matemáticas con KaTeX
  function renderMath() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    }
  }

  // Inicialización del Mapa Mental Interactivo en SVG
  function initMindMap() {
    const svg = document.getElementById('mindmapSvg');
    const infoCard = document.getElementById('mindmapInfoCard');
    const infoTitle = document.getElementById('mindmapInfoTitle');
    const infoDesc = document.getElementById('mindmapInfoDesc');

    if (!svg || !infoCard) return;

    const nodeDetails = {
      'root': {
        title: 'Movimiento Oscilatorio General',
        desc: 'Movimiento periódico en torno a una posición de equilibrio estable bajo una fuerza recuperadora.'
      },
      'mas': {
        title: 'Movimiento Armónico Simple (M.A.S.)',
        desc: 'Modelo fundamental donde la fuerza recuperadora es linealmente proporcional al desplazamiento: F = -kx.'
      },
      'cinematica': {
        title: 'Cinemática del M.A.S.',
        desc: 'Describe posición x(t) = A cos(ωt+φ), velocidad v(t) con desfase de π/2 y aceleración a(t) con desfase de π.'
      },
      'dinamica': {
        title: 'Dinámica & Ley de Hooke',
        desc: 'Segunda ley de Newton aplicada al resorte: m(d²x/dt²) = -kx, determinando ω = √(k/m).'
      },
      'energia': {
        title: 'Conservación de la Energía',
        desc: 'Intercambio continuo entre Energía Cinética (Ec = ½mv²) y Energía Potencial (Ep = ½kx²). Energía Total Em = ½kA² = constante.'
      },
      'aplicaciones': {
        title: 'Sistemas Físicos Reales',
        desc: 'Péndulo simple, péndulo físico, moléculas diatómicas, oscilaciones en circuitos RLC y estructuras sísmicas.'
      }
    };

    svg.querySelectorAll('.mindmap-node').forEach(node => {
      node.addEventListener('click', () => {
        const id = node.getAttribute('data-node-id');
        const data = nodeDetails[id];
        if (data) {
          infoTitle.innerText = data.title;
          infoDesc.innerText = data.desc;
          infoCard.style.display = 'block';
        }
      });
    });
  }

  // Inicialización del Glosario Interactivo con Búsqueda en Vivo
  function initGlossary() {
    const input = document.getElementById('glossarySearch');
    const cards = document.querySelectorAll('.glossary-card');
    if (!input) return;

    input.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      cards.forEach(card => {
        const term = card.querySelector('.glossary-term').innerText.toLowerCase();
        const def = card.querySelector('.glossary-desc').innerText.toLowerCase();
        if (term.includes(q) || def.includes(q)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // Círculo de referencia interactivo en Hoja 8
  function initReferenceCircle() {
    const canvas = document.getElementById('refCircleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let angle = 0;

    function draw() {
      const w = canvas.width = canvas.offsetWidth;
      const h = canvas.height = canvas.offsetHeight;
      if (w === 0 || h === 0) {
        requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.35;
      const cy = h * 0.5;
      const r = Math.min(w * 0.25, h * 0.38);

      // Círculo
      ctx.beginPath();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Ejes del círculo
      ctx.beginPath();
      ctx.strokeStyle = '#e2e8f0';
      ctx.moveTo(cx - r - 15, cy);
      ctx.lineTo(cx + r + 15, cy);
      ctx.moveTo(cx, cy - r - 15);
      ctx.lineTo(cx, cy + r + 15);
      ctx.stroke();

      // Radio vector
      const px = cx + r * Math.cos(angle);
      const py = cy - r * Math.sin(angle);

      ctx.beginPath();
      ctx.strokeStyle = '#432874';
      ctx.lineWidth = 2.5;
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Punto sobre el círculo
      ctx.beginPath();
      ctx.fillStyle = '#6366f1';
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      // Proyección sobre el eje X (M.A.S.)
      ctx.beginPath();
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([3, 3]);
      ctx.moveTo(px, py);
      ctx.lineTo(px, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.fillStyle = '#dc2626';
      ctx.arc(px, cy, 7, 0, Math.PI * 2);
      ctx.fill();

      // Línea de elongación proyectada hacia el gráfico
      const graphStartX = w * 0.7;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.4)';
      ctx.setLineDash([2, 2]);
      ctx.moveTo(px, cy);
      ctx.lineTo(graphStartX, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#dc2626';
      ctx.fillText(`x = A cos(θ)`, px - 25, cy + 18);

      angle += 0.025;
      requestAnimationFrame(draw);
    }
    draw();
  }

  // =========================================================================
  // SISTEMA DE VENTANA MODAL COLAPSABLE GRANDE PARA GRÁFICAS Y SIMULADOR
  // =========================================================================
  let activeModalTarget = null;
  let activePlaceholder = null;
  let isModalCollapsed = false;
  let isModalMaximized = false;

  const modalOverlay = document.getElementById('graphicModalOverlay');
  const modalContainer = document.getElementById('graphicModalContainer');
  const modalBody = document.getElementById('graphicModalBody');
  const modalTitle = document.getElementById('modalHeaderTitle');
  const modalIcon = document.getElementById('modalHeaderIcon');
  const modalCollapsedBar = document.getElementById('modalCollapsedBar');
  const btnModalCollapse = document.getElementById('btnModalCollapse');
  const btnModalMaximize = document.getElementById('btnModalMaximize');
  const btnModalClose = document.getElementById('btnModalClose');
  const btnModalRestore = document.getElementById('btnModalRestore');

  function openGraphicModal(targetId, titleText, iconClass) {
    const targetElement = document.getElementById(targetId);
    if (!targetElement || !modalOverlay || !modalBody) return;

    // Si ya había otro elemento en la modal, restaurarlo primero
    if (activeModalTarget && activePlaceholder) {
      closeGraphicModal(false);
    }

    activeModalTarget = targetElement;

    // Crear marcador de posición (placeholder) en la hoja original para recordar la ubicación exacta
    activePlaceholder = document.createElement('div');
    activePlaceholder.className = 'modal-placeholder-box';
    activePlaceholder.style.display = 'none';
    targetElement.parentNode.insertBefore(activePlaceholder, targetElement);

    // Mover elemento interactivo a la modal
    modalBody.appendChild(targetElement);

    // Actualizar título e icono
    if (modalTitle) modalTitle.innerText = titleText;
    if (modalIcon) modalIcon.className = iconClass;

    // Mostrar modal con animación fluida
    modalOverlay.style.display = 'flex';
    void modalOverlay.offsetWidth; // Forzar reflujo
    modalOverlay.classList.add('show');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Resetear estados visuales
    isModalCollapsed = false;
    isModalMaximized = false;
    if (modalContainer) modalContainer.classList.remove('collapsed', 'maximized');
    if (modalCollapsedBar) modalCollapsedBar.style.display = 'none';

    if (btnModalCollapse) {
      btnModalCollapse.innerHTML = '<i class="fa-solid fa-window-minimize"></i>';
      btnModalCollapse.title = 'Minimizar / Colapsar Ventana';
    }
    if (btnModalMaximize) {
      btnModalMaximize.innerHTML = '<i class="fa-solid fa-expand"></i>';
      btnModalMaximize.title = 'Pantalla Completa';
    }

    // Re-adaptar el motor gráfico a las nuevas dimensiones ampliadas
    setTimeout(() => {
      triggerResizeForTarget(targetId);
    }, 120);
  }

  function closeGraphicModal(animate = true) {
    if (!activeModalTarget || !activePlaceholder) {
      if (modalOverlay) {
        modalOverlay.classList.remove('show');
        setTimeout(() => {
          modalOverlay.style.display = 'none';
          modalOverlay.setAttribute('aria-hidden', 'true');
        }, animate ? 280 : 0);
        document.body.style.overflow = '';
      }
      return;
    }

    const targetEl = activeModalTarget;
    const targetId = targetEl.id;

    // Retornar elemento exactamente a su contenedor original en la hoja
    if (activePlaceholder.parentNode) {
      activePlaceholder.parentNode.insertBefore(targetEl, activePlaceholder);
      activePlaceholder.remove();
    }

    activeModalTarget = null;
    activePlaceholder = null;

    if (modalOverlay) {
      modalOverlay.classList.remove('show');
      setTimeout(() => {
        modalOverlay.style.display = 'none';
        modalOverlay.setAttribute('aria-hidden', 'true');
        if (modalContainer) modalContainer.classList.remove('collapsed', 'maximized');
        if (modalCollapsedBar) modalCollapsedBar.style.display = 'none';
        document.body.style.overflow = '';
      }, animate ? 280 : 0);
    }

    // Re-adaptar dimensiones a las del cuaderno
    setTimeout(() => {
      triggerResizeForTarget(targetId);
    }, 120);
  }

  function toggleModalCollapse() {
    if (!modalContainer) return;
    isModalCollapsed = !isModalCollapsed;

    if (isModalCollapsed) {
      modalContainer.classList.add('collapsed');
      if (modalCollapsedBar) modalCollapsedBar.style.display = 'flex';
      if (btnModalCollapse) {
        btnModalCollapse.innerHTML = '<i class="fa-solid fa-window-restore"></i>';
        btnModalCollapse.title = 'Restaurar Ventana';
      }
      document.body.style.overflow = '';
    } else {
      modalContainer.classList.remove('collapsed');
      if (modalCollapsedBar) modalCollapsedBar.style.display = 'none';
      if (btnModalCollapse) {
        btnModalCollapse.innerHTML = '<i class="fa-solid fa-window-minimize"></i>';
        btnModalCollapse.title = 'Minimizar / Colapsar';
      }
      document.body.style.overflow = 'hidden';
      if (activeModalTarget) {
        setTimeout(() => triggerResizeForTarget(activeModalTarget.id), 100);
      }
    }
  }

  function toggleModalMaximize() {
    if (!modalContainer) return;
    isModalMaximized = !isModalMaximized;

    if (isModalMaximized) {
      modalContainer.classList.add('maximized');
      if (btnModalMaximize) {
        btnModalMaximize.innerHTML = '<i class="fa-solid fa-compress"></i>';
        btnModalMaximize.title = 'Restaurar Tamaño';
      }
    } else {
      modalContainer.classList.remove('maximized');
      if (btnModalMaximize) {
        btnModalMaximize.innerHTML = '<i class="fa-solid fa-expand"></i>';
        btnModalMaximize.title = 'Pantalla Completa';
      }
    }

    if (activeModalTarget) {
      setTimeout(() => triggerResizeForTarget(activeModalTarget.id), 100);
    }
  }

  function triggerResizeForTarget(targetId) {
    if (targetId === 'geogebraWrapper') {
      if (geogebraInstance) {
        geogebraInstance.initCanvasDPI();
        geogebraInstance.initOrigin();
        geogebraInstance.render();
      }
    } else if (targetId === 'simulatorWrapper') {
      if (simulatorInstance) {
        simulatorInstance.initCanvasDPI();
      }
    } else if (targetId === 'refCircleBox') {
      const canvas = document.getElementById('refCircleCanvas');
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    }
  }

  function initGraphicModalSystem() {
    // Botón de GeoGebra
    const btnGeo = document.getElementById('btnOpenGeoModal');
    if (btnGeo) {
      btnGeo.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!geogebraInstance && window.GeogebraEngine) {
          geogebraInstance = new window.GeogebraEngine('geogebraCanvas');
        }
        openGraphicModal('geogebraWrapper', 'Plano Cartesiano Interactivo GeoGebra', 'fa-solid fa-compass-drafting');
      });
    }

    // Botón de Simulador
    const btnSim = document.getElementById('btnOpenSimModal');
    if (btnSim) {
      btnSim.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!simulatorInstance && window.PhysicsSimulator) {
          simulatorInstance = new window.PhysicsSimulator('simDisplayCanvas');
        }
        openGraphicModal('simulatorWrapper', 'Laboratorio Virtual de Masa-Resorte y Balance Energético', 'fa-solid fa-sliders');
      });
    }

    // Botón de Círculo de Referencia
    const btnRef = document.getElementById('btnOpenRefModal');
    if (btnRef) {
      btnRef.addEventListener('click', (e) => {
        e.stopPropagation();
        openGraphicModal('refCircleBox', 'Círculo de Referencia M.A.S. - M.C.U.', 'fa-solid fa-circle-notch');
      });
    }

    // Botón de Mapa Mental
    const btnMap = document.getElementById('btnOpenMindmapModal');
    if (btnMap) {
      btnMap.addEventListener('click', (e) => {
        e.stopPropagation();
        openGraphicModal('mindmapWrapper', 'Mapa Mental del Movimiento Oscilatorio', 'fa-solid fa-diagram-project');
      });
    }

    // Botones de control en la barra de la modal
    if (btnModalCollapse) btnModalCollapse.addEventListener('click', toggleModalCollapse);
    if (btnModalRestore) btnModalRestore.addEventListener('click', toggleModalCollapse);
    if (btnModalMaximize) btnModalMaximize.addEventListener('click', toggleModalMaximize);
    if (btnModalClose) btnModalClose.addEventListener('click', () => closeGraphicModal(true));

    // Tecla Escape para salir de la modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeModalTarget) {
        closeGraphicModal(true);
      }
    });

    // Cerrar al hacer clic en el fondo oscuro exterior
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          closeGraphicModal(true);
        }
      });
    }
  }

  // Arranque del sistema
  bindNav();
  initMindMap();
  initGlossary();
  initReferenceCircle();
  initGraphicModalSystem();
  updateNavigationControls();

  // Primer renderizado matemático tras cargar librerías
  setTimeout(() => {
    renderMath();
  }, 300);
});
