/**
 * ============================================================================
 * OPTION WHEEL (React Bits Component for Vanilla JS)
 * ============================================================================
 * Curved 3D option picker that spins with scroll, drag, touch, or arrow keys,
 * tilting items away with exponential smoothing physics.
 * 
 * Based on: https://reactbits.dev/components/option-wheel
 * Adapted for: Oficios Ahome - Términos y Privacidad
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OptionWheel = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Inyección de estilos de OptionWheel
  const css = `
    .option-wheel {
      --ow-text-color: rgba(255, 255, 255, 0.45);
      --ow-active-color: #ffffff;
      --ow-font-size: 1.25rem;
      --ow-inset: 20px;

      position: relative;
      width: 100%;
      height: 220px;
      overflow: hidden;
      cursor: grab;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
      outline: none;
      border-radius: 18px;
      background: transparent;
      perspective: 1200px;
      transform-style: preserve-3d;
      -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
      mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
    }

    @media (min-width: 640px) {
      .option-wheel {
        height: 260px;
        --ow-font-size: 1.35rem;
        --ow-inset: 24px;
      }
    }

    @media (min-width: 1536px) {
      .option-wheel {
        height: 520px;
        --ow-font-size: 1.6rem;
        --ow-inset: 32px;
      }
    }

    .dark .option-wheel {
      --ow-text-color: rgba(255, 255, 255, 0.45);
      --ow-active-color: #ffffff;
      background: transparent;
    }

    .option-wheel--dragging {
      cursor: grabbing !important;
    }

    /* Cada opción está centrada verticalmente y desplazada a lo largo del arco */
    .option-wheel__item {
      position: absolute;
      top: 50%;
      left: var(--ow-inset);
      white-space: nowrap;
      font-size: var(--ow-font-size);
      line-height: 1.25;
      font-weight: 500;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      transform-origin: left center;
      cursor: pointer;
      will-change: transform, opacity, filter;
      color: var(--ow-text-color);
      transition: color 0.15s ease, background 0.15s ease;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 22px;
      border-radius: 16px;
    }

    .option-wheel--center .option-wheel__item {
      left: 50%;
      transform-origin: center center;
      text-align: center;
      justify-content: center;
    }

    .option-wheel--left .option-wheel__item {
      left: var(--ow-inset);
      transform-origin: left center;
      text-align: left;
      justify-content: flex-start;
    }

    .option-wheel--right .option-wheel__item {
      left: auto;
      right: var(--ow-inset);
      transform-origin: right center;
    }

    /* Sección seleccionada: letras blancas y 100% de opacidad sin transparencia */
    .option-wheel__item--selected {
      font-weight: 800 !important;
      color: #ffffff !important;
      opacity: 1 !important;
      filter: none !important;
      background: rgba(255, 255, 255, 0.08);
    }
    .dark .option-wheel__item--selected {
      color: #ffffff !important;
      opacity: 1 !important;
      filter: none !important;
      background: rgba(255, 255, 255, 0.12);
    }

    /* Sin línea indicadora ni barras */
    .option-wheel__guide {
      display: none !important;
    }
  `;

  if (typeof document !== 'undefined' && !document.getElementById('option-wheel-css')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'option-wheel-css';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  // Sintetizador Web Audio API de micro-click táctil
  let audioCtx = null;
  function playTickSound(volume = 0.4) {
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
      }
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.025);
      gain.gain.setValueAtTime(volume * 0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.025);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.025);
    } catch (e) {
      // Ignorar fallos de reproducción por políticas de autoplay
    }
  }

  class OptionWheel {
    constructor(container, options = {}) {
      if (!container) throw new Error('OptionWheel: container element is required');

      this.container = container;
      this.items = options.items || [];
      this.defaultSelected = options.defaultSelected || 0;
      this.onChange = options.onChange || null;
      this.textColor = options.textColor || '#71717a';
      this.activeColor = options.activeColor || '#09090b';
      this.side = options.side || 'left';
      this.fontSize = options.fontSize || 1.25;
      this.spacing = options.spacing || 1.6;
      this.curve = typeof options.curve === 'number' ? options.curve : 1.15;
      this.tilt = typeof options.tilt === 'number' ? options.tilt : 10;
      this.blur = typeof options.blur === 'number' ? options.blur : 1.8;
      this.fade = typeof options.fade === 'number' ? options.fade : 0.28;
      this.minOpacity = typeof options.minOpacity === 'number' ? options.minOpacity : 0.08;
      this.smoothing = options.smoothing || 180;
      this.inset = typeof options.inset === 'number' ? options.inset : 32;
      this.loop = !!options.loop;
      this.draggable = options.draggable !== false;
      this.soundEnabled = !!options.soundEnabled;
      this.soundVolume = options.soundVolume || 0.4;
      this.showGuide = !!options.showGuide;
      this.className = options.className || '';

      this.itemRefs = [];
      this.pos = this.defaultSelected;
      this.target = this.defaultSelected;
      this.selectedIndex = this.defaultSelected;
      this.rafId = null;
      this.lastTime = 0;
      this.wheelTimer = null;
      this.drag = null;
      this.dragMoved = false;
      this.lastTickTime = 0;

      this.initDOM();
      this.bindEvents();
      this.applyTarget(this.defaultSelected, true);
    }

    getRemPx() {
      if (typeof window === 'undefined') return 16;
      return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    }

    getConfig() {
      const remPx = this.getRemPx();
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
      const effectiveFontSize = isMobile ? Math.min(this.fontSize, 1.25) : this.fontSize;
      const effectiveSpacing = isMobile ? Math.min(this.spacing, 1.7) : this.spacing;
      const effectiveCurve = isMobile ? this.curve * 0.7 : this.curve;
      return {
        count: this.items.length,
        items: this.items,
        rowH: Math.max(effectiveFontSize * effectiveSpacing * remPx, 1),
        curve: effectiveCurve,
        tilt: isMobile ? Math.min(this.tilt, 6) : this.tilt,
        blur: isMobile ? Math.min(this.blur, 0.8) : this.blur,
        fade: this.fade,
        minOpacity: this.minOpacity,
        side: this.side,
        loop: this.loop,
        smoothing: this.smoothing,
        draggable: this.draggable
      };
    }

    initDOM() {
      this.container.classList.add('option-wheel');
      if (this.side === 'right') this.container.classList.add('option-wheel--right');
      if (this.side === 'center') this.container.classList.add('option-wheel--center');
      if (this.side === 'left') this.container.classList.add('option-wheel--left');
      if (this.className) this.container.classList.add(...this.className.split(' ').filter(Boolean));

      this.container.setAttribute('role', 'listbox');
      this.container.setAttribute('tabindex', '0');
      this.container.setAttribute('aria-label', 'Selector curvo de secciones');

      this.container.style.setProperty('--ow-text-color', this.textColor);
      this.container.style.setProperty('--ow-active-color', this.activeColor);
      this.container.style.setProperty('--ow-font-size', `${this.fontSize}rem`);
      this.container.style.setProperty('--ow-inset', `${this.inset}px`);

      // Guía central opcional (desactivada por defecto)
      if (this.showGuide) {
        const guide = document.createElement('div');
        guide.className = 'option-wheel__guide';
        this.container.appendChild(guide);
      }

      // Elementos de la rueda
      this.itemRefs = [];
      this.items.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'option-wheel__item';
        el.setAttribute('role', 'option');
        el.setAttribute('aria-selected', index === this.defaultSelected ? 'true' : 'false');
        el.textContent = typeof item === 'object' ? item.label : item;

        el.addEventListener('click', () => this.handleItemClick(index));
        this.container.appendChild(el);
        this.itemRefs.push(el);
      });
    }

    runFrame(now) {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      const cfg = this.getConfig();
      const tau = Math.max(cfg.smoothing, 1) / 1000;
      const k = 1 - Math.exp(-dt / tau);

      const target = this.target;
      const cur = this.pos;
      let next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.001;
      if (settled) next = target;
      this.pos = next;

      const els = this.itemRefs;
      const n = cfg.count;
      const isCenter = cfg.side === 'center';
      const mirror = cfg.side === 'right' ? -1 : 1;
      const tiltRad = (cfg.tilt * Math.PI) / 180;
      const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;

      for (let i = 0; i < n; i++) {
        const el = els[i];
        if (!el) continue;
        let d = i - next;
        if (cfg.loop && n > 1) {
          d = ((d % n) + n) % n;
          if (d > n / 2) d -= n;
        }
        const dist = Math.abs(d);
        let x = 0;
        let y = d * cfg.rowH;
        let rot = 0;
        if (R > 0) {
          const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
          y = R * Math.sin(ang);
          if (isCenter) {
            const rotX = (-ang * 180) / Math.PI;
            const z = -Math.abs(R * (1 - Math.cos(ang))) * (cfg.curve || 1.1);
            const scale = Math.max(0.72, 1 - dist * 0.07);
            el.style.transform = `translate(-50%, calc(${y.toFixed(2)}px - 50%)) translateZ(${z.toFixed(2)}px) rotateX(${rotX.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
          } else if (cfg.side === 'left') {
            // Curva 3D suave hacia adentro (positiva en X) para no salirse de la orilla de la pantalla
            const arcX = Math.abs(R * (1 - Math.cos(ang))) * (cfg.curve || 0.65);
            const rotZ = ((ang * 180) / Math.PI) * 0.35;
            const rotX = ((-ang * 180) / Math.PI) * 0.25;
            const scale = Math.max(0.78, 1 - dist * 0.05);
            el.style.transform = `translate(${arcX.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotateZ(${rotZ.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
          } else {
            x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
            rot = (mirror * ang * 180) / Math.PI;
            el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
          }
        } else {
          if (isCenter) {
            el.style.transform = `translate(-50%, calc(${y.toFixed(2)}px - 50%))`;
          } else {
            el.style.transform = `translate(0px, calc(${y.toFixed(2)}px - 50%))`;
          }
        }
        const isCurrent = Math.round(next) === i;
        if (isCurrent) {
          el.style.opacity = '1';
          el.style.filter = 'none';
        } else {
          el.style.opacity = String(Math.max(cfg.minOpacity, 1 - dist * cfg.fade));
          el.style.filter = cfg.blur > 0 ? `blur(${(dist * cfg.blur).toFixed(2)}px)` : 'none';
        }
        el.style.setProperty('--ow-p', Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));

        el.classList.toggle('option-wheel__item--selected', isCurrent);
        el.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      }

      if (!settled) {
        this.rafId = requestAnimationFrame(now => this.runFrame(now));
      } else {
        this.rafId = null;
      }
    }

    startLoop() {
      if (this.rafId != null) {
        cancelAnimationFrame(this.rafId);
      }
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(now => this.runFrame(now));
    }

    playTick() {
      if (!this.soundEnabled) return;
      const now = performance.now();
      if (now - this.lastTickTime < 65) return;
      this.lastTickTime = now;
      playTickSound(this.soundVolume);
    }

    applyTarget(value, snap = false, triggerChange = true) {
      const cfg = this.getConfig();
      let v = value;
      if (!cfg.loop) v = Math.min(Math.max(v, 0), Math.max(cfg.count - 1, 0));
      if (snap) v = Math.round(v);
      this.target = v;
      const idx = ((Math.round(v) % cfg.count) + cfg.count) % cfg.count;

      if (idx !== this.selectedIndex) {
        this.selectedIndex = idx;
        if (triggerChange && typeof this.onChange === 'function') {
          this.onChange(idx, this.items[idx]);
        }
        this.playTick();
      }
      this.startLoop();
    }

    setSelectedIndex(index, smooth = true, triggerChange = false) {
      if (index < 0 || index >= this.items.length) return;
      this.applyTarget(index, smooth, triggerChange);
    }

    handleItemClick(index) {
      if (this.dragMoved) return;
      const cfg = this.getConfig();
      const cur = this.target;
      let d = index - (((cur % cfg.count) + cfg.count) % cfg.count);
      if (cfg.loop && cfg.count > 1) {
        if (d > cfg.count / 2) d -= cfg.count;
        else if (d < -cfg.count / 2) d += cfg.count;
      }
      this.applyTarget(cur + d, true, true);
    }

    bindEvents() {
      const el = this.container;

      // Wheel / touchpad scrolling
      this.onWheel = e => {
        e.preventDefault();
        const cfg = this.getConfig();
        const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
        const step = Math.max(-1, Math.min(1, delta / cfg.rowH));
        this.applyTarget(this.target + step, false, true);

        if (this.wheelTimer) clearTimeout(this.wheelTimer);
        this.wheelTimer = setTimeout(() => this.applyTarget(this.target, true, true), 140);
      };
      el.addEventListener('wheel', this.onWheel, { passive: false });

      // Pointer drag events
      this.onPointerDown = e => {
        if (!this.draggable) return;
        this.drag = { y: e.clientY, start: this.target, id: e.pointerId };
        this.dragMoved = false;
        el.classList.add('option-wheel--dragging');
      };

      this.onPointerMove = e => {
        if (!this.drag) return;
        const dy = e.clientY - this.drag.y;
        if (!this.dragMoved && Math.abs(dy) > 4) {
          this.dragMoved = true;
          try {
            el.setPointerCapture(this.drag.id);
          } catch (err) {}
        }
        if (this.dragMoved) {
          const cfg = this.getConfig();
          this.applyTarget(this.drag.start - dy / cfg.rowH, false, true);
        }
      };

      this.onPointerEnd = () => {
        if (!this.drag) return;
        this.drag = null;
        el.classList.remove('option-wheel--dragging');
        if (this.dragMoved) {
          this.applyTarget(this.target, true, true);
        }
      };

      el.addEventListener('pointerdown', this.onPointerDown);
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerEnd);
      window.addEventListener('pointercancel', this.onPointerEnd);

      // Keyboard arrow navigation
      this.onKeyDown = e => {
        let delta = null;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') delta = -1;
        else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') delta = 1;
        if (delta == null) return;
        e.preventDefault();
        this.applyTarget(Math.round(this.target) + delta, true, true);
      };
      el.addEventListener('keydown', this.onKeyDown);

      // Responsive resize handling
      this.onResize = () => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
        const fontSize = isMobile ? Math.min(this.fontSize, 1.25) : this.fontSize;
        const inset = isMobile ? Math.min(this.inset, 20) : this.inset;
        el.style.setProperty('--ow-font-size', `${fontSize}rem`);
        el.style.setProperty('--ow-inset', `${inset}px`);
        this.startLoop();
      };
      window.addEventListener('resize', this.onResize);
    }

    destroy() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      if (this.wheelTimer) clearTimeout(this.wheelTimer);
      if (this.onResize) window.removeEventListener('resize', this.onResize);
      const el = this.container;
      el.removeEventListener('wheel', this.onWheel);
      el.removeEventListener('pointerdown', this.onPointerDown);
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerEnd);
      window.removeEventListener('pointercancel', this.onPointerEnd);
      el.removeEventListener('keydown', this.onKeyDown);
    }
  }

  return OptionWheel;
});
