/**
 * ============================================================================
 * JELLY RADIO (React Bits Component for Vanilla JS)
 * ============================================================================
 * Radio group of chips where the chosen one swells and fluidly pushes or
 * "barges" its neighbours outward with spring physics.
 * 
 * Based on: https://reactbits.dev/micro-interactions/jelly-radio
 * Ported for: Oficios Ahome - Mobile Navigation
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JellyRadio = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SIZES = {
    xs: [28, 10.5, 5], // [height, fontSize, paddingX]
    sm: [30, 11, 6],
    md: [36, 13, 16],
    lg: [44, 14, 20]
  };

  const DEFAULT_ITEMS = ['Off', 'Low', 'Medium', 'High', 'Max'];

  // Inyección de estilos de JellyRadio
  const css = `
    :root {
      --jr-chip-bg: #e4e4e7;
      --jr-active-bg: #18181b;
      --jr-text-color: #3f3f46;
      --jr-active-text-color: #ffffff;
    }
    .dark {
      --jr-chip-bg: #27272a;
      --jr-active-bg: #f5f5f5;
      --jr-text-color: #f5f5f5;
      --jr-active-text-color: #18181b;
    }

    .jelly-radio-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      gap: var(--jr-gap, 4px);
      padding: var(--jr-pad-y, 4px) var(--jr-pad-x, 4px);
      position: relative;
    }

    .jelly-radio-container[data-disabled="true"] {
      pointer-events: none;
      opacity: 0.5;
    }

    .jelly-radio__chip {
      position: relative;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      outline: none;
      font: inherit;
      cursor: pointer;
      touch-action: manipulation;
      transform-origin: center center;
      -webkit-tap-highlight-color: transparent;
      will-change: transform;
      flex-shrink: 0;
    }

    .jelly-radio__chip[data-on="true"] {
      cursor: default;
    }

    .jelly-radio__chip:disabled {
      cursor: default;
      opacity: 0.4;
    }

    .jelly-radio__content {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45em;
      overflow: hidden;
      border-radius: var(--jr-radius, 18px);
      background-color: var(--jr-chip, #27272a);
      color: var(--jr-text, #f5f5f5);
      height: var(--jr-h, 36px);
      padding: 0 var(--jr-px, 16px);
      font-size: var(--jr-font, 13px);
      font-weight: 600;
      line-height: 1;
      white-space: nowrap;
      transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1),
                  background-color 220ms ease,
                  color 220ms ease,
                  box-shadow 220ms ease;
    }

    .dark .jelly-radio__content {
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
    }

    .jelly-radio__chip:active:not(:disabled) .jelly-radio__content {
      transform: scale(0.97);
    }

    .jelly-radio__chip[data-on="true"] .jelly-radio__content {
      background-color: var(--jr-active, #f5f5f5);
      color: var(--jr-active-text, #18181b);
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    /* Efecto hover suave */
    .jelly-radio__content::before {
      content: '';
      position: absolute;
      inset: 0;
      background-color: var(--jr-text, #f5f5f5);
      opacity: 0;
      transition: opacity 160ms ease;
      pointer-events: none;
      border-radius: inherit;
    }

    @media (hover: hover) and (pointer: fine) {
      .jelly-radio__chip:hover:not(:disabled)[data-on="false"] .jelly-radio__content::before {
        opacity: 0.12;
      }
    }

    @media (min-width: 640px) {
      .jelly-radio-container {
        --jr-gap: 8px !important;
        --jr-pad-y: 6px !important;
        --jr-pad-x: 12px !important;
      }
      .jelly-radio__content {
        --jr-h: 38px !important;
        --jr-font: 13px !important;
        --jr-px: 15px !important;
        --jr-radius: 16px !important;
        gap: 0.5em !important;
      }
    }

    .jelly-radio__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15em;
      line-height: 1;
    }

    .jelly-radio__label {
      display: inline-block;
      line-height: 1;
    }
  `;

  if (typeof document !== 'undefined') {
    const styleId = 'jelly-radio-styles';
    if (!document.getElementById(styleId)) {
      const tag = document.createElement('style');
      tag.id = styleId;
      tag.textContent = css;
      document.head.appendChild(tag);
    }
  }

  // Resorte analítico estable (Harmonic Oscillator)
  class Spring {
    constructor(val = 0) {
      this.current = val;
      this.target = val;
      this.vel = 0;
    }

    jump(val) {
      this.current = val;
      this.target = val;
      this.vel = 0;
    }

    setTarget(target) {
      this.target = target;
    }

    step(dt, k, bounce, mass = 0.9) {
      const c = 2 * Math.sqrt(k * mass) * (1 - bounce);
      // F = -k * (x - target) - c * v
      const force = -k * (this.current - this.target) - c * this.vel;
      const acc = force / mass;
      this.vel += acc * dt;
      this.current += this.vel * dt;

      // Condición de reposo
      if (Math.abs(this.current - this.target) < 0.001 && Math.abs(this.vel) < 0.005) {
        this.current = this.target;
        this.vel = 0;
        return true; // reposo alcanzado
      }
      return false;
    }
  }

  class JellyRadio {
    constructor(container, options = {}) {
      if (!container) throw new Error('JellyRadio requires a container element.');
      this.container = typeof container === 'string' ? document.querySelector(container) : container;

      this.items = options.items || DEFAULT_ITEMS;
      this.list = this.items.map(it => (typeof it === 'string' ? { value: it, label: it } : it));
      this.defaultValue = options.defaultValue !== undefined ? options.defaultValue : this.list[0]?.value;
      this.value = options.value !== undefined ? options.value : this.defaultValue;
      this.onChange = options.onChange || null;

      // Opciones de estilo y física
      this.chipColor = options.chipColor || '#27272a';
      this.activeColor = options.activeColor || '#f5f5f5';
      this.textColor = options.textColor || '#f5f5f5';
      this.activeTextColor = options.activeTextColor || '#18181b';
      this.size = options.size || 'md';
      this.gap = typeof options.gap === 'number' ? options.gap : 8;
      this.radius = typeof options.radius === 'number' ? options.radius : 18;
      this.swell = typeof options.swell === 'number' ? options.swell : 0.2;
      this.barge = typeof options.barge === 'number' ? options.barge : 6;
      this.shrink = typeof options.shrink === 'number' ? options.shrink : 0.05;
      this.jelly = typeof options.jelly === 'number' ? options.jelly : 1;
      this.bounce = typeof options.bounce === 'number' ? options.bounce : 0.25;
      this.stagger = typeof options.stagger === 'number' ? options.stagger : 22;
      this.stiffness = typeof options.stiffness === 'number' ? options.stiffness : 580;
      this.disabled = !!options.disabled;
      this.ariaLabel = options.ariaLabel || 'Options';
      this.className = options.className || '';

      this.chips = [];
      this.springs = [];
      this.widths = [];
      this.rafId = null;
      this.lastTime = 0;
      this.delays = [];

      this.initDOM();
      this.measure();
      this.apply(this.getSelectedIndex(), true);
    }

    getSelectedIndex() {
      const idx = this.list.findIndex(it => it.value === this.value);
      return idx >= 0 ? idx : 0;
    }

    initDOM() {
      this.container.innerHTML = '';
      this.container.className = `jelly-radio-container ${this.className}`.trim();
      this.container.setAttribute('role', 'radiogroup');
      this.container.setAttribute('aria-label', this.ariaLabel);
      if (this.disabled) this.container.setAttribute('data-disabled', 'true');

      const [h, font, px] = SIZES[this.size] || SIZES.md;
      this.container.style.setProperty('--jr-chip', this.chipColor);
      this.container.style.setProperty('--jr-active', this.activeColor);
      this.container.style.setProperty('--jr-text', this.textColor);
      this.container.style.setProperty('--jr-active-text', this.activeTextColor);
      this.container.style.setProperty('--jr-gap', `${this.gap}px`);
      this.container.style.setProperty('--jr-radius', `${this.radius}px`);
      this.container.style.setProperty('--jr-h', `${h}px`);
      this.container.style.setProperty('--jr-font', `${font}px`);
      this.container.style.setProperty('--jr-px', `${px}px`);

      this.chips = [];
      this.springs = [];
      this.delays = [];

      this.list.forEach((item, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.role = 'radio';
        btn.className = 'jelly-radio__chip';
        btn.setAttribute('aria-checked', 'false');
        btn.tabIndex = -1;
        if (this.disabled || item.disabled) btn.disabled = true;

        const content = document.createElement('span');
        content.className = 'jelly-radio__content';

        if (item.icon) {
          const iconSpan = document.createElement('span');
          iconSpan.className = 'jelly-radio__icon';
          if (typeof item.icon === 'string') {
            iconSpan.textContent = item.icon;
          } else if (item.icon instanceof Node) {
            iconSpan.appendChild(item.icon);
          }
          content.appendChild(iconSpan);
        }

        const labelSpan = document.createElement('span');
        labelSpan.className = 'jelly-radio__label';
        labelSpan.textContent = typeof item.label === 'string' ? item.label : item.value;
        content.appendChild(labelSpan);

        btn.appendChild(content);

        btn.addEventListener('click', () => {
          this.commit(i);
        });

        btn.addEventListener('keydown', e => {
          this.onKeyDown(e, i);
        });

        this.container.appendChild(btn);
        this.chips.push(btn);
        this.springs.push({
          x: new Spring(0),
          sx: new Spring(1),
          sy: new Spring(1)
        });
        this.delays.push(0);
      });

      // ResizeObserver para medir anchos dinámicos
      this.ro = new ResizeObserver(() => {
        this.measure();
        this.apply(this.getSelectedIndex(), true);
      });
      this.ro.observe(this.container);
    }

    measure() {
      this.widths = this.chips.map(btn => btn.offsetWidth || 0);
      const chipH = this.chips[0]?.offsetHeight || 30;
      const maxW = Math.max(0, ...this.widths);
      const isCompact = typeof window !== 'undefined' && window.innerWidth < 768;
      const padX = isCompact
        ? Math.min(4, Math.ceil((maxW * this.swell) / 2 + this.barge))
        : Math.ceil((maxW * this.swell * 1.3) / 2 + this.barge) + 2;
      const padY = Math.ceil((chipH * this.swell) / 2) + 2;
      this.container.style.setProperty('--jr-pad-x', `${padX}px`);
      this.container.style.setProperty('--jr-pad-y', `${padY}px`);
    }

    apply(sel, instant = false) {
      const count = this.list.length;
      const rtl = getComputedStyle(this.container).direction === 'rtl';
      const selWidth = this.widths[sel] || 0;
      const isTabletOrDesktop = typeof window !== 'undefined' && window.innerWidth >= 640;
      const effectiveSwell = isTabletOrDesktop ? Math.max(this.swell, 0.16) : this.swell;
      const effectiveBarge = isTabletOrDesktop ? Math.max(this.barge, 5) : this.barge;
      const effectiveShrink = isTabletOrDesktop ? Math.max(this.shrink, 0.04) : this.shrink;
      const push = (selWidth * effectiveSwell) / 2 + effectiveBarge;

      for (let i = 0; i < count; i++) {
        const on = i === sel;
        const far = Math.abs(i - sel);
        const dir = Math.sign(i - sel) * (rtl ? -1 : 1);
        const targetX = dir * push;
        const targetS = on ? 1 + effectiveSwell : 1 - effectiveShrink;

        const sp = this.springs[i];
        if (instant) {
          sp.x.jump(targetX);
          sp.sx.jump(targetS);
          sp.sy.jump(targetS);
          this.renderChip(i);
        } else {
          sp.x.setTarget(targetX);
          sp.sx.setTarget(targetS);
          sp.sy.setTarget(targetS);
          this.delays[i] = (far * this.stagger) / 1000;
        }

        const chip = this.chips[i];
        chip.setAttribute('aria-checked', on ? 'true' : 'false');
        chip.setAttribute('data-on', on ? 'true' : 'false');
        chip.tabIndex = on ? 0 : -1;
      }

      if (!instant) {
        this.startLoop();
      }
    }

    renderChip(i) {
      const chip = this.chips[i];
      if (!chip) return;
      const sp = this.springs[i];
      chip.style.transform = `translateX(${sp.x.current.toFixed(2)}px) scale(${sp.sx.current.toFixed(3)}, ${sp.sy.current.toFixed(3)})`;
    }

    startLoop() {
      if (this.rafId != null) cancelAnimationFrame(this.rafId);
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(now => this.loop(now));
    }

    loop(now) {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05) || 0.016;
      this.lastTime = now;
      let allSettled = true;

      const sel = this.getSelectedIndex();
      for (let i = 0; i < this.chips.length; i++) {
        if (this.delays[i] > 0) {
          this.delays[i] -= dt;
          allSettled = false;
          continue;
        }

        const far = Math.abs(i - sel);
        const k = this.stiffness * (1 - 0.12 * Math.min(far, 3));
        const j = this.jelly;

        const settledX = this.springs[i].x.step(dt, k, this.bounce, 0.9);
        const settledSx = this.springs[i].sx.step(
          dt,
          k * (1 + 0.24 * j),
          Math.min(0.85, this.bounce + 0.3 * j),
          0.9 - 0.1 * j
        );
        const settledSy = this.springs[i].sy.step(
          dt,
          k * (1 - 0.14 * j),
          this.bounce,
          0.9 + 0.05 * j
        );

        this.renderChip(i);

        if (!settledX || !settledSx || !settledSy) {
          allSettled = false;
        }
      }

      if (!allSettled) {
        this.rafId = requestAnimationFrame(t => this.loop(t));
      } else {
        this.rafId = null;
      }
    }

    commit(index, instant = false) {
      if (this.disabled || !this.list[index] || this.list[index].disabled) return;
      const prev = this.getSelectedIndex();
      if (index === prev) return;

      this.value = this.list[index].value;
      this.apply(index, instant);

      if (typeof this.onChange === 'function') {
        this.onChange(this.value, index);
      }
    }

    setValue(value, instant = false) {
      const idx = this.list.findIndex(it => it.value === value);
      if (idx >= 0) {
        this.commit(idx, instant);
      }
    }

    setIndex(index, instant = false) {
      if (index >= 0 && index < this.list.length) {
        this.commit(index, instant);
      }
    }

    onKeyDown(e, i) {
      const count = this.list.length;
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        next = (i + 1) % count;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        next = (i - 1 + count) % count;
      } else if (e.key === 'Home') {
        next = 0;
      } else if (e.key === 'End') {
        next = count - 1;
      } else if (e.key === ' ' || e.key === 'Enter') {
        next = i;
      }

      if (next !== null) {
        e.preventDefault();
        this.commit(next, false);
        this.chips[next]?.focus();
      }
    }

    destroy() {
      if (this.rafId != null) cancelAnimationFrame(this.rafId);
      if (this.ro) this.ro.disconnect();
      this.container.innerHTML = '';
    }
  }

  return JellyRadio;
});
