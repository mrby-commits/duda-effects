import { useEffect } from 'react';

/**
 * ClickSpark：在頁面任何地方點擊，點擊位置會噴出火花。
 * 放一次就對整頁生效，標籤本身不佔空間。
 *
 * <div data-rb="ClickSpark" data-color="#ffcc00"></div>
 *
 * 參數（data-*）：
 *   color        火花顏色，預設 #ffffff
 *   sparkCount   火花數量，預設 8
 *   sparkSize    火花線段長度 px，預設 10
 *   sparkRadius  飛散距離 px，預設 18
 *   duration     持續毫秒，預設 450
 *   lineWidth    線寬，預設 2
 */
export default function ClickSpark({
  color = '#ffffff',
  sparkCount = 8,
  sparkSize = 10,
  sparkRadius = 18,
  duration = 450,
  lineWidth = 2,
}) {
  useEffect(() => {
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '2147483646',
    });
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let sparks = [];
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const ease = (t) => t * (2 - t);

    const draw = (now) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      sparks = sparks.filter((s) => now - s.start < duration);
      for (const s of sparks) {
        const p = ease((now - s.start) / duration);
        const dist = p * sparkRadius;
        const len = sparkSize * (1 - p);
        const x1 = s.x + dist * Math.cos(s.angle);
        const y1 = s.y + dist * Math.sin(s.angle);
        const x2 = s.x + (dist + len) * Math.cos(s.angle);
        const y2 = s.y + (dist + len) * Math.sin(s.angle);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      raf = sparks.length ? requestAnimationFrame(draw) : 0;
    };

    const onClick = (e) => {
      const now = performance.now();
      for (let i = 0; i < sparkCount; i++) {
        sparks.push({ x: e.clientX, y: e.clientY, angle: (2 * Math.PI * i) / sparkCount, start: now });
      }
      if (!raf) raf = requestAnimationFrame(draw);
    };
    document.addEventListener('click', onClick, true);

    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
      canvas.remove();
    };
  }, [color, sparkCount, sparkSize, sparkRadius, duration, lineWidth]);

  return null;
}
