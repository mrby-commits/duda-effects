import React, { useEffect, useRef } from 'react';
import { onVisible, prefersReducedMotion } from './shared.js';

/**
 * CountUp：數字跑動，捲動到畫面時從 from 跑到 to。
 *
 * <div data-rb="CountUp" data-to="1280" data-suffix="+" data-font-size="48px"></div>
 *
 * 參數（data-*）：
 *   to          目標數字（必填；也可以直接把數字寫在標籤裡）
 *   from        起始數字，預設 0
 *   duration    毫秒，預設 2000
 *   decimals    小數位數，預設依 to 自動判斷
 *   separator   千分位符號，預設 ","（不要的話給 "none"）
 *   prefix / suffix  前後文字，例如 "NT$"、"+"、"%"
 *   tag         外層標籤，預設 span
 *   fontSize / color / fontWeight  樣式
 */
export default function CountUp({
  to,
  innerText,
  from = 0,
  duration = 2000,
  decimals,
  separator = ',',
  prefix = '',
  suffix = '',
  tag = 'span',
  fontSize,
  color,
  fontWeight,
}) {
  const ref = useRef(null);
  const target = Number(to ?? String(innerText || '0').replace(/[^\d.-]/g, '')) || 0;
  const dec = decimals ?? ((String(to ?? innerText ?? '').split('.')[1] || '').length);

  const format = (n) => {
    const fixed = Number(n).toFixed(dec);
    if (separator === 'none' || !separator) return prefix + fixed + suffix;
    const [i, d] = fixed.split('.');
    const withSep = i.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return prefix + (d ? `${withSep}.${d}` : withSep) + suffix;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = format(target);
      return;
    }
    el.textContent = format(from);
    let raf = 0;
    const stop = onVisible(el, { threshold: 0.3 }, () => {
      const start = performance.now();
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        el.textContent = format(from + (target - from) * easeOut(p));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    return () => {
      stop();
      cancelAnimationFrame(raf);
    };
  }, [target, from, duration, dec, separator, prefix, suffix]);

  const Tag = tag;
  return (
    <Tag
      ref={ref}
      aria-label={format(target)}
      style={{ fontSize, color, fontWeight, fontVariantNumeric: 'tabular-nums' }}
    >
      {format(target)}
    </Tag>
  );
}
