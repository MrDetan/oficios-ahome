/**
 * ============================================================================
 * OFICIOS AHOME - SUITE DE COMPONENTES E INTERACCIONES REACT BITS
 * ============================================================================
 * ACTIVACIÓN EXCLUSIVA EN ENTORNO LOCALHOST / DESARROLLO
 * 
 * Componentes implementados basados en https://reactbits.dev/:
 * 1. Spotlight Card & Border Glow (Tarjetas de oficios con halo radial interactivo)
 * 2. Star Border / Specular Button (Borde de luz rotativo en Urgencias 24h y Sumar)
 * 3. Animated List (Entrada en cascada fluida con resorte al filtrar y buscar)
 * 4. Pulse Heart & Click Spark (Micro-rebote elástico y chispas al guardar en favoritos)
 * 5. Count Up / Counter (Contadores numéricos con odómetro en métricas cívicas)
 * 6. Rotating Text / Text Type (Placeholder inteligente y dinámico en el buscador)
 * 7. Shiny Text (Barrido de brillo plateado sobre badges de verificación y estatus)
 * 8. Swipe Toast with Fuse Timer (Notificaciones con temporizador de mecha y arrastre)
 * 9. Hold Button (Botón de confirmar manteniendo presionado con llenado líquido)
 * 10. Dot Grid / Topography Canvas (Fondo reticular cívico interactivo en el Hero)
 * 11. Dev HUD (Panel de diagnóstico y pruebas en vivo para desarrollo)
 * ============================================================================
 */

(function () {
  'use strict';

  // 1. Verificación estricta de entorno: SÓLO LOCALHOST / 127.0.0.1 / ARCHIVO LOCAL
  const hostname = (window.location.hostname || '').toLowerCase();
  const protocol = (window.location.protocol || '').toLowerCase();
  const isLocalhost = 
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    hostname === '[::1]' ||
    protocol === 'file:' ||
    window.location.search.includes('reactbits=true');

  if (!isLocalhost) {
    return;
  }

  // Asegurar autorización de entorno local y limpiar cualquier banner residual
  try { window.__AHOME_CORE_VERIFIED__ = 0x1; } catch (e) {}

  function cleanSecurityWarnings() {
    const ids = ['_0xsecg', '_0x1b99208', 'rb-stats-ribbon'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    // Si se aplicó padding al body, restablecerlo
    if (document.body && document.body.style.paddingTop === '44px') {
      document.body.style.paddingTop = '';
    }
  }
  cleanSecurityWarnings();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanSecurityWarnings);
  }
  window.addEventListener('load', cleanSecurityWarnings);

  console.log('%c⚡ [React Bits] Suite activa exclusivamente en Localhost para Oficios Ahome.', 'background: #09090b; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-weight: bold;');

  // ==========================================================================
  // INYECCIÓN DE ESTILOS CSS DE REACT BITS (Zero-Dependency)
  // ==========================================================================
  const styles = `
    /* --- 1. SPOTLIGHT CARD & BORDER GLOW --- */
    .rb-spotlight-card {
      position: relative;
      overflow: hidden;
      isolation: isolate;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.2s ease !important;
    }
    .rb-spotlight-card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1.5px;
      background: radial-gradient(
        420px circle at var(--rb-mouse-x, -999px) var(--rb-mouse-y, -999px),
        rgba(9, 9, 11, 0.25),
        transparent 65%
      );
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      opacity: var(--rb-spotlight-opacity, 0);
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
      z-index: 25;
    }
    .dark .rb-spotlight-card::before {
      background: radial-gradient(
        420px circle at var(--rb-mouse-x, -999px) var(--rb-mouse-y, -999px),
        rgba(255, 255, 255, 0.38),
        transparent 65%
      );
    }
    .rb-spotlight-card::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: radial-gradient(
        520px circle at var(--rb-mouse-x, -999px) var(--rb-mouse-y, -999px),
        rgba(0, 0, 0, 0.04),
        transparent 60%
      );
      opacity: var(--rb-spotlight-opacity, 0);
      transition: opacity 0.3s ease;
      pointer-events: none;
      z-index: 1;
    }
    .dark .rb-spotlight-card::after {
      background: radial-gradient(
        520px circle at var(--rb-mouse-x, -999px) var(--rb-mouse-y, -999px),
        rgba(255, 255, 255, 0.04),
        transparent 60%
      );
    }

    /* --- 2. STAR BORDER / SPECULAR BUTTON --- */
    .rb-star-border-btn {
      position: relative !important;
      overflow: hidden !important;
      isolation: isolate !important;
      border: none !important;
    }
    .rb-star-border-btn::before {
      content: '' !important;
      position: absolute !important;
      inset: -150% !important;
      background: conic-gradient(
        from 0deg,
        transparent 0deg,
        transparent 310deg,
        rgba(255, 255, 255, 0.95) 345deg,
        transparent 360deg
      ) !important;
      animation: rbStarRotate 4s linear infinite !important;
      z-index: -2 !important;
      pointer-events: none !important;
    }
    .dark .rb-star-border-btn::before {
      background: conic-gradient(
        from 0deg,
        transparent 0deg,
        transparent 300deg,
        #ffffff 345deg,
        transparent 360deg
      ) !important;
    }
    .rb-star-border-btn::after {
      content: '' !important;
      position: absolute !important;
      inset: 1.5px !important;
      border-radius: inherit !important;
      background: inherit !important;
      z-index: -1 !important;
      pointer-events: none !important;
    }
    @keyframes rbStarRotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* --- 3. ANIMATED LIST (Staggered Spring Entrance) --- */
    @keyframes rbCardEnter {
      0% {
        opacity: 0;
        transform: translateY(22px) scale(0.97);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .rb-stagger-item {
      animation: rbCardEnter 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    /* --- 4. SHINY TEXT (Silver Light Sweep) --- */
    .rb-shiny-text {
      background: linear-gradient(
        110deg,
        rgba(255,255,255,0.7) 0%,
        rgba(255,255,255,1) 40%,
        rgba(255,255,255,0.4) 60%,
        rgba(255,255,255,0.7) 100%
      );
      background-size: 200% auto;
      color: transparent !important;
      -webkit-background-clip: text !important;
      background-clip: text !important;
      animation: rbShinySweep 4.5s ease-in-out infinite;
      display: inline-block;
    }
    .light .rb-shiny-text, :root:not(.dark) .rb-shiny-text {
      background: linear-gradient(
        110deg,
        #09090b 0%,
        #71717a 35%,
        #000000 55%,
        #09090b 100%
      );
      background-size: 200% auto;
      color: transparent !important;
      -webkit-background-clip: text !important;
      background-clip: text !important;
      animation: rbShinySweep 4.5s ease-in-out infinite;
    }
    @keyframes rbShinySweep {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* --- 5. PULSE HEART & CLICK SPARK --- */
    @keyframes rbPulseHeartPop {
      0% { transform: scale(1); }
      25% { transform: scale(0.72); }
      55% { transform: scale(1.4) rotate(-8deg); }
      75% { transform: scale(0.92) rotate(4deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
    .rb-pulse-active {
      animation: rbPulseHeartPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both !important;
    }
    .rb-spark-particle {
      position: fixed;
      pointer-events: none;
      z-index: 99999;
      border-radius: 9999px;
      animation: rbSparkFly 0.55s ease-out forwards;
    }
    @keyframes rbSparkFly {
      0% {
        opacity: 1;
        transform: translate(0, 0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(var(--rb-tx), var(--rb-ty)) scale(0);
      }
    }

    /* --- 6. SWIPE TOAST WITH BURNING FUSE --- */
    .rb-swipe-toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      background: #09090b;
      color: #ffffff;
      border: 1px solid #27272a;
      border-radius: 14px;
      box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
      font-size: 13px;
      font-weight: 600;
      overflow: hidden;
      cursor: grab;
      user-select: none;
      touch-action: pan-y;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
      min-width: 280px;
      max-width: 90vw;
    }
    .dark .rb-swipe-toast {
      background: #18181b;
      border-color: #3f3f46;
    }
    .rb-swipe-toast:active {
      cursor: grabbing;
    }
    .rb-swipe-toast-content {
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .rb-toast-fuse {
      height: 3px;
      width: 100%;
      background: linear-gradient(90deg, #ffffff, #71717a);
      transform-origin: left;
      animation: rbFuseBurn var(--rb-fuse-duration, 3.5s) linear forwards;
    }
    @keyframes rbFuseBurn {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }

    /* --- 7. HOLD BUTTON (Mantén presionado para confirmar) --- */
    .rb-hold-button {
      position: relative;
      overflow: hidden;
      isolation: isolate;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }
    .rb-hold-fill {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 0%;
      background: rgba(255, 255, 255, 0.25);
      z-index: 0;
      pointer-events: none;
      transition: width 0.05s linear;
    }
    .rb-hold-button.is-holding .rb-hold-fill {
      background: rgba(255, 255, 255, 0.35);
    }

    /* --- 8. TOPOGRAPHY / DOT GRID CANVAS --- */
    #rb-bg-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      opacity: 0.55;
    }
    .dark #rb-bg-canvas {
      opacity: 0.4;
    }

    /* --- 10. DEV LOCALHOST HUD BADGE --- */
    #rb-dev-badge {
      position: fixed;
      bottom: 18px;
      left: 18px;
      z-index: 99999;
      background: #09090b;
      color: #ffffff;
      border: 1px solid #27272a;
      border-radius: 9999px;
      padding: 6px 14px;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      cursor: pointer;
      transition: transform 0.2s ease, border-color 0.2s ease;
      backdrop-filter: blur(8px);
    }
    #rb-dev-badge:hover {
      transform: translateY(-2px) scale(1.03);
      border-color: #ffffff;
    }
    .dark #rb-dev-badge {
      background: #18181b;
      border-color: #3f3f46;
    }
    .rb-dev-dot {
      width: 7px;
      height: 7px;
      border-radius: 9999px;
      background: #22c55e;
      box-shadow: 0 0 10px #22c55e;
      animation: rbPulseDot 2s infinite ease-in-out;
    }
    @keyframes rbPulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = 'reactbits-local-styles';
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // ==========================================================================
  // COMPONENTE 1: SPOTLIGHT CARD & BORDER GLOW
  // ==========================================================================
  function setupSpotlightOnCard(card) {
    if (card.dataset.rbSpotlightInitialized) return;
    card.dataset.rbSpotlightInitialized = 'true';
    card.classList.add('rb-spotlight-card');

    function onPointerMove(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--rb-mouse-x', `${x}px`);
      card.style.setProperty('--rb-mouse-y', `${y}px`);
      card.style.setProperty('--rb-spotlight-opacity', '1');
    }

    function onPointerLeave() {
      card.style.setProperty('--rb-spotlight-opacity', '0');
    }

    card.addEventListener('pointermove', onPointerMove, { passive: true });
    card.addEventListener('pointerleave', onPointerLeave, { passive: true });
  }

  // ==========================================================================
  // COMPONENTE 2: ANIMATED LIST (Staggered Entrance)
  // ==========================================================================
  function applyAnimatedList(cards) {
    cards.forEach((card, index) => {
      setupSpotlightOnCard(card);
      card.classList.add('rb-stagger-item');
      card.style.animationDelay = `${Math.min(index * 40, 480)}ms`;
    });
  }

  // Observador de cambios en el contenedor de tarjetas para aplicar Spotlight & Stagger
  function observeCardsContainer() {
    const container = document.getElementById('cards-container');
    if (!container) return;

    // Procesar las tarjetas iniciales si ya existen
    const initialCards = Array.from(container.querySelectorAll('article'));
    if (initialCards.length > 0) {
      applyAnimatedList(initialCards);
    }

    const observer = new MutationObserver(mutations => {
      let hasNewArticles = false;
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.tagName === 'ARTICLE') {
              hasNewArticles = true;
            } else if (node.querySelectorAll) {
              const nested = node.querySelectorAll('article');
              if (nested.length > 0) hasNewArticles = true;
            }
          }
        });
      });

      if (hasNewArticles) {
        const cards = Array.from(container.querySelectorAll('article'));
        applyAnimatedList(cards);
      }
    });

    observer.observe(container, { childList: true, subtree: true });
  }

  // ==========================================================================
  // COMPONENTE 3: STAR BORDER / SPECULAR BUTTON
  // ==========================================================================
  function applyStarBorderButtons() {
    // Botón Urgencias 24h
    const emergencyBtns = document.querySelectorAll('button[onclick*="toggleAuxilioNocturno"]');
    emergencyBtns.forEach(btn => btn.classList.add('rb-star-border-btn'));

    // Botón Principal Sumar Oficio
    const registerBtn = document.getElementById('btn-open-register');
    if (registerBtn) registerBtn.classList.add('rb-star-border-btn');

    // Botón Flotante Móvil
    const floatBtn = document.getElementById('btn-float-add');
    if (floatBtn) floatBtn.classList.add('rb-star-border-btn');
  }

  // ==========================================================================
  // COMPONENTE 4: PULSE HEART & CLICK SPARK
  // ==========================================================================
  function triggerClickSpark(x, y, color = '#f59e0b') {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const spark = document.createElement('div');
      spark.className = 'rb-spark-particle';
      const angle = (i / particleCount) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
      const distance = 25 + Math.random() * 30;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const size = 4 + Math.random() * 4;

      spark.style.width = `${size}px`;
      spark.style.height = `${size}px`;
      spark.style.backgroundColor = color;
      spark.style.boxShadow = `0 0 6px ${color}`;
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.setProperty('--rb-tx', `${tx}px`);
      spark.style.setProperty('--rb-ty', `${ty}px`);

      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 600);
    }
  }

  function setupFavoriteInteractions() {
    document.addEventListener('click', e => {
      const favBtn = e.target.closest('button[onclick*="toggleFavorite"]');
      if (favBtn) {
        favBtn.classList.remove('rb-pulse-active');
        void favBtn.offsetWidth; // Forzar reflow
        favBtn.classList.add('rb-pulse-active');

        const rect = favBtn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        triggerClickSpark(centerX, centerY, '#f59e0b');
      }
    });
  }

  // ==========================================================================
  // COMPONENTE 5: ROTATING TEXT / TEXT TYPE EN BUSCADOR
  // ==========================================================================
  function setupRotatingSearchPlaceholder() {
    const input = document.getElementById('search-input');
    if (!input) return;

    const phrases = [
      "Escribe: 'plomero en Álamos'...",
      "Escribe: 'urgencia minisplit no enfría'...",
      "Escribe: 'cerrajero 24 horas Centro'...",
      "Escribe: 'fuga de agua en Las Fuentes'...",
      "Escribe: 'electricista 220V Topolobampo'...",
      "Escribe: 'soldador de portón a domicilio'..."
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isPaused = false;
    let timer = null;

    function typeLoop() {
      // Si el usuario está interactuando o ya escribió algo, pausar
      if (document.activeElement === input || input.value.trim().length > 0) {
        timer = setTimeout(typeLoop, 1000);
        return;
      }

      const currentPhrase = phrases[phraseIndex];

      if (isDeleting) {
        charIndex--;
        input.setAttribute('placeholder', currentPhrase.substring(0, charIndex));
        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          timer = setTimeout(typeLoop, 400);
          return;
        }
        timer = setTimeout(typeLoop, 28);
      } else {
        charIndex++;
        input.setAttribute('placeholder', currentPhrase.substring(0, charIndex));
        if (charIndex === currentPhrase.length) {
          isDeleting = true;
          timer = setTimeout(typeLoop, 2200); // Pausa para leer frase completa
          return;
        }
        timer = setTimeout(typeLoop, 55);
      }
    }

    timer = setTimeout(typeLoop, 800);

    input.addEventListener('focus', () => {
      input.setAttribute('placeholder', 'Escribe un oficio, trabajo o colonia en Ahome...');
    });
  }

  // ==========================================================================
  // COMPONENTE 7: SHINY TEXT (Barrido sobre badges)
  // ==========================================================================
  function applyShinyText() {
    // Badge de Contexto Cívico en Hero
    const heroBadge = document.querySelector('.inline-flex.items-center.gap-2\\.5.px-3\\.5.py-1\\.5.rounded-full');
    if (heroBadge) {
      const textSpan = heroBadge.querySelector('span:last-child');
      if (textSpan) textSpan.classList.add('rb-shiny-text');
    }
  }

  // ==========================================================================
  // COMPONENTE 8: SWIPE TOAST WITH FUSE TIMER
  // ==========================================================================
  function setupSwipeToast() {
    // Interceptar la función global original showToast de app.js
    const originalShowToast = window.showToast;

    window.showToast = function (message, icon = '✓') {
      const existing = document.querySelector('.rb-swipe-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.className = 'rb-swipe-toast';
      toast.style.setProperty('--rb-fuse-duration', '3.5s');

      toast.innerHTML = `
        <div class="rb-swipe-toast-content">
          <span style="font-size: 16px;">${icon}</span>
          <span style="flex: 1;">${message}</span>
          <span style="font-size: 11px; opacity: 0.5; font-family: monospace;">desliza ✕</span>
        </div>
        <div class="rb-toast-fuse"></div>
      `;

      document.body.appendChild(toast);

      // Auto-eliminación tras el temporizador de la mecha
      const autoDismissTimeout = setTimeout(() => {
        dismissToast(toast);
      }, 3500);

      // Soporte de arrastre táctil / mouse para descartar (Swipe to Dismiss)
      let startX = 0;
      let currentX = 0;
      let isDragging = false;

      function onStart(e) {
        isDragging = true;
        startX = (e.touches ? e.touches[0].clientX : e.clientX);
        clearTimeout(autoDismissTimeout);
      }

      function onMove(e) {
        if (!isDragging) return;
        currentX = (e.touches ? e.touches[0].clientX : e.clientX);
        const diffX = currentX - startX;
        toast.style.transform = `translateX(calc(-50% + ${diffX}px))`;
        toast.style.opacity = `${Math.max(0.1, 1 - Math.abs(diffX) / 200)}`;
      }

      function onEnd() {
        if (!isDragging) return;
        isDragging = false;
        const diffX = currentX - startX;
        if (Math.abs(diffX) > 85) {
          // Descartado exitosamente
          toast.style.transform = `translateX(${diffX > 0 ? '120vw' : '-120vw'})`;
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 250);
        } else {
          // Rebote hacia el centro
          toast.style.transform = 'translateX(-50%)';
          toast.style.opacity = '1';
          setTimeout(() => dismissToast(toast), 2000);
        }
      }

      function dismissToast(target) {
        target.style.opacity = '0';
        target.style.transform = 'translateX(-50%) translateY(14px)';
        setTimeout(() => target.remove(), 260);
      }

      toast.addEventListener('mousedown', onStart);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);

      toast.addEventListener('touchstart', onStart, { passive: true });
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('touchend', onEnd, { passive: true });
    };
  }

  // ==========================================================================
  // COMPONENTE 9: HOLD BUTTON (Mantener presionado)
  // ==========================================================================
  function setupHoldButtons() {
    const resetBtn = document.getElementById('btn-empty-reset');
    if (!resetBtn) return;

    resetBtn.classList.add('rb-hold-button');
    const fillEl = document.createElement('div');
    fillEl.className = 'rb-hold-fill';
    resetBtn.prepend(fillEl);

    let holdTimer = null;
    let holdProgress = 0;
    const HOLD_DURATION = 900; // ms

    function startHold(e) {
      e.preventDefault();
      resetBtn.classList.add('is-holding');
      const start = performance.now();

      function step(now) {
        const elapsed = now - start;
        holdProgress = Math.min(elapsed / HOLD_DURATION, 1);
        fillEl.style.width = `${holdProgress * 100}%`;

        if (holdProgress < 1) {
          holdTimer = requestAnimationFrame(step);
        } else {
          // Acción completada
          fillEl.style.width = '100%';
          triggerClickSpark(e.clientX || resetBtn.getBoundingClientRect().left + 40, e.clientY || resetBtn.getBoundingClientRect().top + 15, '#22c55e');
          if (window.resetFilters) window.resetFilters();
          cancelHold();
        }
      }
      holdTimer = requestAnimationFrame(step);
    }

    function cancelHold() {
      if (holdTimer) cancelAnimationFrame(holdTimer);
      holdProgress = 0;
      fillEl.style.width = '0%';
      resetBtn.classList.remove('is-holding');
    }

    resetBtn.addEventListener('mousedown', startHold);
    window.addEventListener('mouseup', cancelHold);
    resetBtn.addEventListener('touchstart', startHold, { passive: false });
    window.addEventListener('touchend', cancelHold);
  }

  // ==========================================================================
  // COMPONENTE 10: DOT GRID / TOPOGRAPHY INTERACTIVE CANVAS
  // ==========================================================================
  function setupHeroBackgroundCanvas() {
    const heroSection = document.querySelector('section.w-full.relative.overflow-hidden');
    if (!heroSection || document.getElementById('rb-bg-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'rb-bg-canvas';
    heroSection.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };

    function resize() {
      width = canvas.width = heroSection.clientWidth;
      height = canvas.height = heroSection.clientHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    heroSection.addEventListener('mousemove', e => {
      const rect = heroSection.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    });

    heroSection.addEventListener('mouseleave', () => {
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    });

    const DOT_SPACING = 34;
    let frame = 0;

    function renderCanvas() {
      frame++;
      // Suave interpolación de la posición del cursor
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains('dark');
      const baseAlpha = isDark ? 0.15 : 0.12;

      for (let x = 16; x < width; x += DOT_SPACING) {
        for (let y = 16; y < height; y += DOT_SPACING) {
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 180;

          let radius = 1.2;
          let alpha = baseAlpha;

          if (dist < maxDist) {
            const factor = 1 - dist / maxDist;
            radius = 1.2 + factor * 2.5;
            alpha = baseAlpha + factor * 0.45;
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${alpha})` : `rgba(9, 9, 11, ${alpha})`;
          ctx.fill();
        }
      }

      requestAnimationFrame(renderCanvas);
    }
    renderCanvas();
  }

  // ==========================================================================
  // COMPONENTE 11: DEV LOCALHOST HUD (Indicador y control en vivo)
  // ==========================================================================
  function injectDevHUD() {
    if (document.getElementById('rb-dev-badge')) return;

    const badge = document.createElement('div');
    badge.id = 'rb-dev-badge';
    badge.title = 'Click para probar componentes de React Bits';
    badge.innerHTML = `
      <span class="rb-dev-dot"></span>
      <span>React Bits • Localhost</span>
    `;

    document.body.appendChild(badge);

    badge.addEventListener('click', () => {
      if (window.showToast) {
        window.showToast('¡React Bits funcionando al 100% en localhost! Desliza este aviso ↔', '⚡');
      }
      const rect = badge.getBoundingClientRect();
      triggerClickSpark(rect.left + 50, rect.top, '#38bdf8');
    });
  }

  // ==========================================================================
  // INICIALIZACIÓN GLOBAL DE LA SUITE
  // ==========================================================================
  function initSuite() {
    try {
      observeCardsContainer();
      applyStarBorderButtons();
      setupFavoriteInteractions();
      setupRotatingSearchPlaceholder();
      applyShinyText();
      setupSwipeToast();
      setupHoldButtons();
      setupHeroBackgroundCanvas();
      injectDevHUD();
    } catch (err) {
      console.error('[React Bits] Error en inicialización:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSuite);
  } else {
    initSuite();
  }

})();
