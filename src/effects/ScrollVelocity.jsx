import React, { useEffect, useRef } from 'react';
import { prefersReducedMotion, screenWatcher, toList } from './shared.js';

/**
 * ScrollVelocity：超大字無限橫向捲動，頁面捲動越快、文字跑越快（React Bits 同名元件的輕量版）。
 *
 * <div data-rb="ScrollVelocity" data-texts="Corn Silk Tea ✦|雙笙妹妹 ✦" data-speed="60"></div>
 *
 * 參數（data-*）：
 *   texts       以 | 分隔，每一段是一列；第二列預設反方向
 *   speed       基本速度 px/秒，預設 60
 *   boost       捲動加速倍率，預設 4
 *   fontSize    字級，預設 clamp(48px, 10vw, 160px)
 *   color / fontWeight
 *   outline     true 時文字只有外框（用 color 當框線色），預設 false
 *   gap         重複文字之間的距離，預設 .4em
 */
export default function ScrollVelocity({
  texts = '',
  speed = 60,
  boost = 4,
  fontSize = 'clamp(48px, 10vw, 160px)',
  color = 'currentColor',
  fontWeight = 800,
  outline = false,
  gap = '.4em',
  innerText = '',
}) {
  const rows = toList(texts || innerText, '|');
  const wrapRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const tracks = Array.from(wrap.querySelectorAll('.rb-sv-track'));
    // 複製足夠份數讓畫面填滿
    const fill = () => {
      tracks.forEach((tr) => {
        const first = tr.firstElementChild;
        const w = first.getBoundingClientRect().width;
        if (!w) return;
        const need = Math.ceil(wrap.offsetWidth / w) + 2;
        while (tr.children.length < need) {
          const c = first.cloneNode(true);
          c.setAttribute('aria-hidden', 'true');
          tr.appendChild(c);
        }
        tr.__w = w;
      });
    };
    fill();
    const ro = new ResizeObserver(fill);
    ro.observe(wrap);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fill);
    if (prefersReducedMotion()) return () => ro.disconnect();

    const watch = screenWatcher(wrap);
    const pos = tracks.map(() => 0);
    let lastY = window.scrollY, vel = 0, last = performance.now(), raf;
    const loop = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const y = window.scrollY;
      const target = dt > 0 ? Math.min(3000, Math.abs(y - lastY) / dt) : 0;
      const sign = y >= lastY ? 1 : -1;
      lastY = y;
      vel += (target * sign - vel) * Math.min(1, dt * 6);
      if (watch.visible()) {
        tracks.forEach((tr, i) => {
          const w = tr.__w;
          if (!w) return;
          const dir = i % 2 === 0 ? -1 : 1;
          const factor = 1 + (Math.abs(vel) / 1000) * boost;
          const v = dir * speed * factor * (vel < -5 ? -1 : 1);
          pos[i] = (((pos[i] + v * dt) % w) + w) % w;
          tr.style.transform = `translate3d(${-pos[i]}px,0,0)`;
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); watch.dispose(); };
  }, [texts, speed, boost]);

  const textStyle = outline
    ? { color: 'transparent', WebkitTextStroke: `1.5px ${color}` }
    : { color };

  return (
    <div ref={wrapRef} style={{ overflow: 'hidden', width: '100%', fontSize, fontWeight, lineHeight: 1.1 }}>
      {rows.map((txt, i) => (
        <div key={i} className="rb-sv-track" style={{ display: 'flex', width: 'max-content', willChange: 'transform' }}>
          <span style={{ whiteSpace: 'nowrap', paddingRight: gap, ...textStyle }}>{txt}</span>
        </div>
      ))}
    </div>
  );
}
