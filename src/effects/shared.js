// 各效果共用的小工具

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 元素進入畫面時呼叫 onEnter；once=false 時離開畫面會呼叫 onLeave。回傳清除函式。 */
export function onVisible(el, { threshold = 0.15, once = true, rootMargin = '0px 0px -5% 0px' } = {}, onEnter, onLeave) {
  if (!('IntersectionObserver' in window)) {
    onEnter();
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          onEnter(entry.target);
          if (once) io.unobserve(entry.target);
        } else if (!once && onLeave) {
          onLeave(entry.target);
        }
      }
    },
    { threshold, rootMargin }
  );
  (Array.isArray(el) ? el : [el]).forEach((n) => io.observe(n));
  return () => io.disconnect();
}

/** 把 "a,b,c" 或陣列轉成陣列 */
export const toList = (v, sep = ',') =>
  Array.isArray(v) ? v : String(v ?? '').split(sep).map((s) => s.trim()).filter(Boolean);

export function hexToRgb(hex) {
  let h = String(hex).trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
