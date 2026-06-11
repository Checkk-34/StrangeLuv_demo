import { useEffect, useRef } from 'react';

interface Props {
  /** 字符颜色 (rgba 前缀, 不含 alpha, 如 'rgba(255,255,255,') */
  color?: string;
  /** 动画速度倍率 */
  speed?: number;
  /** 可见阈值: [0,1], 低于此值不绘制 */
  density?: number;
  /** CSS mix-blend-mode */
  blendMode?: React.CSSProperties['mixBlendMode'];
}

/**
 * 呼吸粒子场 — ASCII 字符在面板上缓慢波动
 * 从 PPT 的 canvas.ascii-bg 移植为 React 组件
 */
export default function BreathingPanel({
  color = 'rgba(255,255,255,',
  speed = 0.55,
  density = 0.22,
  blendMode = 'screen',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const PALETTE = '   ...:::---+++***◦◦••▢▣';
    const CELL = 20; // 从 16 → 20，减少 36% 的绘制格子
    const FONT_SIZE = 13;

    let ctx: CanvasRenderingContext2D | null = null;
    let w = 0, h = 0, dpr = 1;
    let raf = 0;
    let t0 = performance.now();
    let running = true;

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return;
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mono = getComputedStyle(document.documentElement)
        .getPropertyValue('--font-en')
        .trim() || 'JetBrains Mono, monospace';
      ctx.font = `500 ${FONT_SIZE}px ${mono}`;
      ctx.textBaseline = 'top';
    }

    function draw(t: number) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, w, h);

      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);

      for (let r = 0; r < rows; r++) {
        for (let cc = 0; cc < cols; cc++) {
          // 4 层正弦波叠加产生“呼吸”感
          const n = (
            Math.sin(cc * 0.18 + t) +
            Math.sin(r * 0.24 - t * 0.7) +
            Math.sin((cc + r) * 0.12 + t * 0.45) +
            Math.sin(Math.hypot(cc - cols * 0.5, r - rows * 0.5) * 0.16 - t * 0.55)
          ) / 4; // [-1, 1]

          const v = (n + 1) / 2; // [0, 1]
          if (v < density) continue;

          const idx = Math.min(PALETTE.length - 1, Math.floor(v * PALETTE.length));
          const ch = PALETTE[idx];
          if (ch === ' ') continue;

          const alpha = 0.08 + (v - density) * 0.55;
          ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
          ctx.fillText(ch, cc * CELL, r * CELL);
        }
      }
    }

    function tick(now: number) {
      if (!running) { raf = 0; return; }
      const t = (now - t0) / 1000 * speed;
      draw(t);
      raf = requestAnimationFrame(tick);
    }

    function start() {
      resize();
      t0 = performance.now();
      running = true;
      raf = requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    // 页面不可见时暂停 RAF，释放 GPU/CPU
    function onVisibility() {
      if (document.hidden) stop();
      else if (!running) start();
    }
    document.addEventListener('visibilitychange', onVisibility);

    const ro = new ResizeObserver(() => { resize(); });
    ro.observe(canvas);

    start();

    return () => {
      stop();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [color, speed, density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: blendMode }}
    />
  );
}
