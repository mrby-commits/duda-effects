import React, { useEffect, useRef, useState } from 'react';

/**
 * SplitText：文字逐字（或逐詞）淡入上浮。
 *
 * <div data-rb="SplitText" data-tag="h2" data-delay="50">歡迎光臨</div>
 *
 * 參數（data-*）：
 *   text        顯示文字；不給就用標籤裡原本的文字
 *   tag         外層標籤，預設 div（可用 h1/h2/h3/p/span）
 *   splitType   chars（逐字，預設）或 words（逐詞，空白分隔）
 *   delay       每個字之間的間隔毫秒，預設 40
 *   duration    每個字的動畫毫秒，預設 600
 *   distance    起始往下偏移的 px，預設 40
 *   threshold   進入畫面多少比例才開始，預設 0.2
 *   once        是否只播一次，預設 true
 *   align       left / center / right
 *   fontSize, color, fontWeight  直接套用的樣式
 */
export default function SplitText({
  text,
  innerText,
  tag = 'div',
  splitType = 'chars',
  delay = 40,
  duration = 600,
  distance = 40,
  threshold = 0.2,
  once = true,
  align,
  fontSize,
  color,
  fontWeight,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const content = String(text ?? innerText ?? '');

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) io.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [threshold, once]);

  const pieces =
    splitType === 'words'
      ? content.split(/(\s+)/)
      : Array.from(content); // Array.from 正確處理中文與 emoji

  const Tag = tag;
  const style = {
    margin: 0,
    font: 'inherit',
    fontSize,
    color: color ?? 'inherit',
    fontWeight,
    textAlign: align,
    lineHeight: 'inherit',
  };

  let index = 0;
  return (
    <Tag ref={ref} style={style} aria-label={content}>
      {pieces.map((piece, i) => {
        if (/^\s+$/.test(piece)) {
          return <span key={i} aria-hidden="true">{piece.replace(/ /g, ' ')}</span>;
        }
        const d = index++ * delay;
        return (
          <span
            key={i}
            aria-hidden="true"
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : `translateY(${distance}px)`,
              transition: `opacity ${duration}ms ease ${d}ms, transform ${duration}ms cubic-bezier(.2,.8,.2,1) ${d}ms`,
              willChange: 'opacity, transform',
            }}
          >
            {piece}
          </span>
        );
      })}
    </Tag>
  );
}
