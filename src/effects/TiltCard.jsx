import React, { useEffect, useRef } from 'react';
import { prefersReducedMotion } from './shared.js';

/**
 * TiltCard：滑鼠移動時卡片 3D 傾斜，附反光。觸控裝置自動停用。
 *
 * 用法一：包住自己的內容
 *   <div data-rb="TiltCard" data-max-tilt="12">
 *     <img src="..." style="width:100%;border-radius:16px">
 *   </div>
 *
 * 用法二：套用到 DUDA 原生元件（例如圖片、欄位）
 *   <div data-rb="TiltCard" data-target=".tilt"></div>
 *
 * 參數（data-*）：
 *   maxTilt     最大傾斜角度，預設 10
 *   scale       滑鼠移上去時放大倍率，預設 1.03
 *   perspective 透視距離 px，預設 900
 *   glare       反光，預設 true
 *   speed       回彈速度毫秒，預設 400
 *   radius      圓角（用法一），預設 16px
 */
function applyTilt(el, { maxTilt, scale, perspective, glare, speed }) {
  const prev = { transition: el.style.transition, transform: el.style.transform, position: el.style.position, overflow: el.style.overflow };
  // 不在掛載時改 transition，避免蓋掉 FadeIn 等其他效果的設定；只在滑鼠互動時設定
  el.style.transformStyle = 'preserve-3d';
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';

  let glareEl = null;
  if (glare) {
    glareEl = document.createElement('div');
    Object.assign(glareEl.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      borderRadius: 'inherit',
      opacity: '0',
      transition: `opacity ${speed}ms ease`,
      zIndex: '2',
    });
    el.appendChild(glareEl);
  }

  const move = (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * 2 * maxTilt;
    const ry = (px - 0.5) * 2 * maxTilt;
    el.style.transition = 'transform 80ms linear';
    el.style.transform = `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
    if (glareEl) {
      glareEl.style.opacity = '1';
      glareEl.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,.35), rgba(255,255,255,0) 60%)`;
    }
  };
  const leave = () => {
    el.style.transition = `transform ${speed}ms cubic-bezier(.2,.8,.2,1)`;
    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
    if (glareEl) glareEl.style.opacity = '0';
  };
  el.addEventListener('mousemove', move);
  el.addEventListener('mouseleave', leave);

  return () => {
    el.removeEventListener('mousemove', move);
    el.removeEventListener('mouseleave', leave);
    if (glareEl) glareEl.remove();
    Object.assign(el.style, prev);
  };
}

export default function TiltCard({
  target,
  maxTilt = 10,
  scale = 1.03,
  perspective = 900,
  glare = true,
  speed = 400,
  radius = '16px',
  innerHtml = '',
}) {
  const ref = useRef(null);

  useEffect(() => {
    const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canHover || prefersReducedMotion()) return;
    const opts = { maxTilt, scale, perspective, glare, speed };
    const els = target ? Array.from(document.querySelectorAll(target)) : ref.current ? [ref.current] : [];
    const cleanups = els.map((el) => applyTilt(el, opts));
    return () => cleanups.forEach((fn) => fn());
  }, [target, maxTilt, scale, perspective, glare, speed]);

  if (target) return <span style={{ display: 'none' }} />;
  return (
    <div
      ref={ref}
      style={{ borderRadius: radius, overflow: 'hidden' }}
      dangerouslySetInnerHTML={{ __html: innerHtml }}
    />
  );
}
