import React, { useEffect, useRef } from 'react';

/**
 * SpotlightCard：滑鼠在卡片上移動時，跟著游標出現一圈柔光（React Bits 同名元件的輕量版）。
 * 不改卡片結構，直接套用到頁面上已存在的元素。
 *
 * <div data-rb="SpotlightCard" data-target=".my-card" data-color="rgba(217,167,43,.25)"></div>
 *
 * 參數（data-*）：
 *   target   CSS 選擇器（必填）
 *   color    光的顏色，預設 rgba(255,255,255,.25)
 *   size     光圈半徑 px，預設 280
 */
export default function SpotlightCard({ target, color = 'rgba(255,255,255,.25)', size = 280 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!target) return;
    let cleanups = [];
    let tries = 0, timer;
    const apply = (el) => {
      if (el.__rbSpot) return () => {};
      el.__rbSpot = true;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.style.overflow = 'hidden';
      const glow = document.createElement('div');
      glow.setAttribute('aria-hidden', 'true');
      Object.assign(glow.style, {
        position: 'absolute', inset: '0', pointerEvents: 'none', opacity: '0', transition: 'opacity .4s ease', zIndex: '1',
        background: `radial-gradient(${size}px circle at var(--rb-sx,50%) var(--rb-sy,50%), ${color}, transparent 70%)`,
      });
      el.appendChild(glow);
      const move = (e) => {
        const r = el.getBoundingClientRect();
        glow.style.setProperty('--rb-sx', `${e.clientX - r.left}px`);
        glow.style.setProperty('--rb-sy', `${e.clientY - r.top}px`);
      };
      const enter = () => { glow.style.opacity = '1'; };
      const leave = () => { glow.style.opacity = '0'; };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerenter', enter);
      el.addEventListener('pointerleave', leave);
      return () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerenter', enter);
        el.removeEventListener('pointerleave', leave);
        glow.remove();
        el.__rbSpot = false;
      };
    };
    const attempt = () => {
      let els = [];
      try { els = Array.from(document.querySelectorAll(target)); } catch (e) { return; }
      if (!els.length && tries++ < 20) { timer = setTimeout(attempt, 250); return; }
      cleanups = els.map(apply);
    };
    attempt();
    return () => { clearTimeout(timer); cleanups.forEach((c) => c()); };
  }, [target, color, size]);
  return <span ref={ref} style={{ display: 'none' }} />;
}
