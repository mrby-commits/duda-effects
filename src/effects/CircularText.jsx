import React, { useEffect, useMemo, useRef } from 'react';
import { prefersReducedMotion, screenWatcher } from './shared.js';

/**
 * CircularText：文字排成圓形並持續旋轉（React Bits 同名元件的輕量版），適合做印章／徽章。
 *
 * <div data-rb="CircularText" data-text="100% PURE CORN SILK ✦ NO CAFFEINE ✦ " data-size="160">
 *   <img src="icon.svg">   ← 標籤裡的內容會放在圓心
 * </div>
 *
 * 參數（data-*）：
 *   text        環狀文字（必填）
 *   size        直徑 px，預設 160
 *   duration    轉一圈的秒數，預設 20
 *   direction   cw（順時針，預設）/ ccw
 *   hoverSpeed  滑鼠移上去時的轉速倍率，預設 3（1 = 不變，0 = 停止）
 *   fontSize    字級 px，預設 size 的 9%
 *   color / fontWeight / letterSpacing
 */
let styleInjected = false;
function injectStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const s = document.createElement('style');
  s.textContent = `
.rb-ct { position:relative; display:inline-grid; place-items:center; border-radius:50%; }
.rb-ct-ring { position:absolute; inset:0; will-change:transform; }
.rb-ct-ring span { position:absolute; left:50%; top:0; transform-origin:0 var(--rb-ct-r); line-height:1; white-space:pre; }
.rb-ct-center { position:relative; display:grid; place-items:center; }
`;
  document.head.appendChild(s);
}

export default function CircularText({
  text = '',
  innerHtml = '',
  size = 160,
  duration = 20,
  direction = 'cw',
  hoverSpeed = 3,
  fontSize,
  color,
  fontWeight = 600,
  letterSpacing,
}) {
  injectStyle();
  const chars = useMemo(() => Array.from(String(text)), [text]);
  const r = size / 2;
  const fs = fontSize || Math.round(size * 0.09);
  const ringRef = useRef(null);
  const hoverRef = useRef(false);

  // 用 rAF 轉動，滑鼠移入時平順加速／減速（改 CSS 動畫時間會跳格）
  useEffect(() => {
    const ring = ringRef.current;
    if (!ring || prefersReducedMotion()) return;
    const watch = screenWatcher(ring);
    const dir = direction === 'ccw' ? -1 : 1;
    let angle = 0, mul = 1, last = performance.now(), raf;
    const loop = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const want = hoverRef.current ? hoverSpeed : 1;
      mul += (want - mul) * Math.min(1, dt * 4);
      if (watch.visible()) {
        angle = (angle + dir * mul * (360 / Math.max(0.1, duration)) * dt) % 360;
        ring.style.transform = `rotate(${angle}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); watch.dispose(); };
  }, [duration, direction, hoverSpeed]);

  return (
    <div
      className="rb-ct"
      style={{ width: size, height: size, color, fontWeight, fontSize: fs, letterSpacing }}
      onMouseEnter={() => { hoverRef.current = true; }}
      onMouseLeave={() => { hoverRef.current = false; }}
    >
      <div
        className="rb-ct-ring"
        ref={ringRef}
        aria-hidden="true"
        style={{ '--rb-ct-r': `${r}px` }}
      >
        {chars.map((c, i) => (
          <span key={i} style={{ transform: `translateX(-50%) rotate(${(360 / chars.length) * i}deg)` }}>
            {c}
          </span>
        ))}
      </div>
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{text}</span>
      {innerHtml ? <div className="rb-ct-center" dangerouslySetInnerHTML={{ __html: innerHtml }} /> : null}
    </div>
  );
}
