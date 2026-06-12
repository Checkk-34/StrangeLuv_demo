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
  /** 自定义字符集 (默认 ASCII 点块) */
  palette?: string;
  /** 启用鼠标交互（扰动 + 涟漪 + 拖尾） */
  interactive?: boolean;
}

const TRAIL_LEN = 6;

/**
 * 呼吸粒子场 — ASCII 字符在面板上缓慢波动
 * 支持鼠标交互：粒子扰动 / 点击涟漪 / 光标拖尾
 */
export default function BreathingPanel({
  color = 'rgba(255,255,255,',
  speed = 0.55,
  density = 0.22,
  blendMode = 'screen',
  palette,
  interactive = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const PALETTE = palette || '   ...:::---+++***◦◦••▢▣';
    const CELL = 20;
    const FONT_SIZE = 13;

    let ctx: CanvasRenderingContext2D | null = null;
    let w = 0, h = 0, dpr = 1;
    let mono = 'JetBrains Mono, monospace';
    let raf = 0;
    let t0 = performance.now();
    let running = true;

    // ---- 鼠标交互状态 ----
    const mouse = { x: -9999, y: -9999 };
    const trails: { x: number; y: number }[] = [];
    const ripples: { x: number; y: number; radius: number; age: number }[] = [];
    const MAX_RIPPLES = 3;

    function handleMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      // 记录拖尾轨迹
      trails.push({ x: mouse.x, y: mouse.y });
      if (trails.length > TRAIL_LEN) trails.shift();
    }

    function handleLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
      trails.length = 0;
    }

    function handleClick(e: MouseEvent) {
      const cx = e.clientX;
      const cy = e.clientY;
      ripples.push({ x: cx, y: cy, radius: 0, age: 0 });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
    }

    if (interactive) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseleave', handleLeave);
      window.addEventListener('click', handleClick);
    }

    // ---- canvas 尺寸 ----
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
      mono = getComputedStyle(document.documentElement)
        .getPropertyValue('--font-en')
        .trim() || 'JetBrains Mono, monospace';
      ctx.font = `500 ${FONT_SIZE}px ${mono}`;
      ctx.textBaseline = 'top';
    }

    // ---- 绘图 ----
    function draw(t: number) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, w, h);

      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);
      const PROX_RADIUS_SQ = 80 * 80; // 鼠标影响半径平方

      // 涟漪更新
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += 4;
        rip.age++;
        if (rip.radius > Math.max(w, h) * 0.8) {
          ripples.splice(i, 1);
        }
      }

      for (let r = 0; r < rows; r++) {
        for (let cc = 0; cc < cols; cc++) {
          const cx = cc * CELL + CELL / 2;
          const cy = r * CELL + CELL / 2;

          // 4 层正弦波叠加
          const n = (
            Math.sin(cc * 0.18 + t) +
            Math.sin(r * 0.24 - t * 0.7) +
            Math.sin((cc + r) * 0.12 + t * 0.45) +
            Math.sin(Math.hypot(cc - cols * 0.5, r - rows * 0.5) * 0.16 - t * 0.55)
          ) / 4;

          let v = (n + 1) / 2; // [0, 1]
          if (v < density) continue;

          // ---- 鼠标交互 ----
          let offsetX = 0, offsetY = 0;
          let extraAlpha = 0;

          if (interactive) {
            const dx = cx - mouse.x;
            const dy = cy - mouse.y;
            const distSq = dx * dx + dy * dy;

            // ① 鼠标接近扰动
            if (distSq < PROX_RADIUS_SQ && distSq > 0) {
              const dist = Math.sqrt(distSq);
              const strength = 1 - dist / 80;
              const push = 16 * strength;
              offsetX = (dx / dist) * push;
              offsetY = (dy / dist) * push;
              extraAlpha = 0.35 * strength;
            }

            // ② 涟漪影响
            for (const rip of ripples) {
              const rd = Math.hypot(cx - rip.x, cy - rip.y);
              const rippling = Math.abs(rd - rip.radius);
              if (rippling < 12) {
                const wave = (1 - rippling / 12) * 0.25;
                const angle = Math.atan2(cy - rip.y, cx - rip.x);
                offsetX += Math.cos(angle) * wave * 20;
                offsetY += Math.sin(angle) * wave * 20;
                extraAlpha = Math.max(extraAlpha, wave);
              }
            }
          }

          const idx = Math.min(PALETTE.length - 1, Math.floor(v * PALETTE.length));
          const ch = PALETTE[idx];
          if (ch === ' ') continue;

          const alpha = Math.min(1, 0.08 + (v - density) * 0.55 + extraAlpha);
          ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
          ctx.fillText(ch, cc * CELL + offsetX, r * CELL + offsetY);
        }
      }

      // ③ 光标拖尾
      if (interactive && trails.length > 1) {
        // 暂存当前字体，拖尾结束后恢复
        const savedFont = ctx.font;
        for (let i = 0; i < trails.length; i++) {
          const p = trails[i];
          const frac = i / trails.length;
          const size = FONT_SIZE * (0.4 + 0.6 * frac);
          ctx.font = `500 ${size}px ${mono}`;
          ctx.fillStyle = `${color}${(0.08 * frac).toFixed(3)})`;
          ctx.fillText(PALETTE[Math.min(PALETTE.length - 1, Math.floor(frac * PALETTE.length))], p.x, p.y);
        }
        ctx.font = savedFont;
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
      if (interactive) {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseleave', handleLeave);
        window.removeEventListener('click', handleClick);
      }
    };
  }, [color, speed, density, palette, interactive]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: blendMode }}
    />
  );
}
