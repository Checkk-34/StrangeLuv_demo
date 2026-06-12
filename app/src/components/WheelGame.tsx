import { useState, useEffect, useRef } from 'react';
import { SparkleIcon, ClipboardIcon, RefreshIcon, CheckCircleIcon } from './Icons';
import GameDialog from './GameDialog';

const WHEEL_ITEMS = ['看电影', '吃火锅', '逛公园', '打游戏', '宅家刷剧', '运动健身'];

/* 嘉年华配色 — 明亮有活力 */
const WHEEL_COLORS = ['#FF7E5F', '#FF6B8A', '#5DB87C', '#A68BDB', '#5B9BD5', '#F4B942'];

/* ---------- canvas 画小图标（无 emoji） ---------- */
function drawIcon(ctx: CanvasRenderingContext2D, idx: number, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(1.5, s * 0.08);

  const hs = s * 0.4; // half-size

  switch (idx) {
    case 0: // 看电影 — ▶ 三角形
      ctx.beginPath();
      ctx.moveTo(-hs * 0.6, -hs);
      ctx.lineTo(-hs * 0.6, hs);
      ctx.lineTo(hs, 0);
      ctx.closePath();
      ctx.fill();
      break;
    case 1: // 吃火锅 — ≈ 波浪线（气泡感）
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = Math.max(2, s * 0.1);
      for (let row = -1; row <= 1; row += 1) {
        ctx.beginPath();
        for (let x = -hs; x <= hs; x += 2) {
          const y = row * hs * 0.4 + Math.sin(x * 0.35) * hs * 0.25;
          x === -hs ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    case 2: // 逛公园 — 树/叶子
      // 树干
      ctx.fillRect(-hs * 0.08, -hs * 0.1, hs * 0.16, hs * 0.8);
      // 树冠 — 圆形
      ctx.beginPath();
      ctx.arc(0, -hs * 0.25, hs * 0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 3: // 打游戏 — ✚ 十字（方向键）
      ctx.lineWidth = Math.max(2.5, s * 0.14);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      // 水平
      ctx.beginPath(); ctx.moveTo(-hs, 0); ctx.lineTo(hs, 0); ctx.stroke();
      // 垂直
      ctx.beginPath(); ctx.moveTo(0, -hs); ctx.lineTo(0, hs); ctx.stroke();
      break;
    case 4: // 宅家刷剧 — ⌂ 房子
      ctx.lineWidth = Math.max(1.8, s * 0.09);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      // 屋顶
      ctx.beginPath(); ctx.moveTo(-hs, hs * 0.05); ctx.lineTo(0, -hs * 0.7); ctx.lineTo(hs, hs * 0.05); ctx.closePath(); ctx.stroke();
      // 墙壁
      ctx.strokeRect(-hs * 0.6, hs * 0.05, hs * 1.2, hs * 0.6);
      break;
    case 5: // 运动健身 — ★ 星形
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      const spikes = 5;
      const outerR = hs;
      const innerR = hs * 0.4;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i * Math.PI) / spikes - Math.PI / 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      break;
  }
  ctx.restore();
}

/* ---------- canvas 画嘉年华彩带装饰 ---------- */
function drawConfetti(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number) {
  for (let i = 0; i < 8; i++) {
    const a = t * 0.5 + (i * Math.PI * 2) / 8;
    const dist = r + 6 + Math.sin(t * 1.2 + i) * 4;
    const x = cx + Math.cos(a) * dist;
    const y = cy + Math.sin(a) * dist;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t + i);
    ctx.fillStyle = `hsla(${(i * 45 + t * 30) % 360}, 80%, 65%, 0.3)`;
    ctx.fillRect(-3, -2, 6, 4);
    ctx.restore();
  }
}

interface Props {
  onAddItem: (text: string) => void;
  onEnd: () => void;
}

type Phase = 'idle' | 'spinning' | 'result' | 'subdialog';

export default function WheelGame({ onAddItem, onEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState('');
  const [_resultIdx, setResultIdx] = useState(-1);
  const [showDialog, setShowDialog] = useState(false);
  const angleRef = useRef(0);
  const spinningRef = useRef(false);
  const confettiRef = useRef(0);

  function draw(angle: number, t = 0) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.min(canvas.clientWidth, canvas.clientHeight);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2, cy = size / 2, r = size / 2 - 10;
    const slices = WHEEL_ITEMS.length;
    const arc = (2 * Math.PI) / slices;

    ctx.clearRect(0, 0, size, size);

    // 外圈辉光晕
    const glow = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r + 8);
    glow.addColorStop(0, 'transparent');
    glow.addColorStop(0.7, 'rgba(255,200,150,0.08)');
    glow.addColorStop(1, 'rgba(255,200,150,0.15)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < slices; i++) {
      const start = angle + i * arc;
      const end = start + arc;

      // 扇形
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();

      // 分割线 (白线)
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 文字标签
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = `600 ${Math.round(size * 0.045)}px "M PLUS Rounded 1c", "Zen Maru Gothic", sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 2;
      ctx.fillText(WHEEL_ITEMS[i], r * 0.58, 3);
      ctx.restore();

      // 小图标（在文字上方）
      const iconAngle = start + arc / 2;
      const iconDist = r * 0.32;
      const ix = cx + Math.cos(iconAngle) * iconDist;
      const iy = cy + Math.sin(iconAngle) * iconDist;
      const iconSize = size * 0.065;
      drawIcon(ctx, i, ix, iy, iconSize);
    }

    // 外圈
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 嘉年华彩带（匀速旋转装饰）
    if (phase === 'spinning') {
      drawConfetti(ctx, cx, cy, r, t);
    }

    // 中奖高亮
    if (phase === 'result' && _resultIdx >= 0) {
      const winStart = angle + _resultIdx * arc;
      const winEnd = winStart + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, winStart, winEnd);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();
      // 脉动外圈
      const pulseSize = r + 4 + Math.sin(t * 3) * 3;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${0.15 + Math.sin(t * 3) * 0.1})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 中心圆 — 纯白 + "GO"
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#FAF8F4';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.font = `700 ${Math.round(size * 0.055)}px "M PLUS Rounded 1c", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GO', cx, cy);
  }

  // 动画循环（仅在 spinning / result 时驱动 confetti + pulse）
  useEffect(() => {
    if (phase !== 'spinning' && phase !== 'result') {
      if (confettiRef.current) { cancelAnimationFrame(confettiRef.current); confettiRef.current = 0; }
      return;
    }
    let t0 = performance.now();
    function loop(now: number) {
      const t = (now - t0) / 1000;
      draw(angleRef.current, t);
      confettiRef.current = requestAnimationFrame(loop);
    }
    confettiRef.current = requestAnimationFrame(loop);
    return () => { if (confettiRef.current) cancelAnimationFrame(confettiRef.current); };
  }, [phase]);

  useEffect(() => {
    draw(angleRef.current);
    const onResize = () => draw(angleRef.current);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function spin() {
    if (spinningRef.current) return;
    spinningRef.current = true;
    setPhase('spinning');

    const totalSpin = (2 * Math.PI * 6) + Math.random() * 2 * Math.PI;
    const duration = 3500 + Math.random() * 500;
    const startAngle = angleRef.current;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      angleRef.current = startAngle + totalSpin * eased;
      draw(angleRef.current, (now - startTime) / 1000);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        spinningRef.current = false;
        // 结果
        const normalized = ((1.5 * Math.PI - (angleRef.current % (2 * Math.PI))) + 2 * Math.PI) % (2 * Math.PI);
        const idx = Math.floor(normalized / ((2 * Math.PI) / WHEEL_ITEMS.length)) % WHEEL_ITEMS.length;
        setResultIdx(idx);
        setResult(WHEEL_ITEMS[idx]);
        setPhase('result');
      }
    }
    requestAnimationFrame(animate);
  }

  function handleChoice(choice: 'add' | 'retry' | 'end') {
    if (choice === 'retry') {
      setPhase('idle');
      setResult('');
      setResultIdx(-1);
    } else if (choice === 'add') {
      onAddItem(result);
      setShowDialog(true);
    } else if (choice === 'end') {
      onEnd();
    }
  }

  const size = Math.min(window.innerWidth * 0.78, 400);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 select-none">
      {/* 指针 — 金色细长箭头 */}
      <div className="text-[#E88350]" style={{ marginTop: '-6px' }}>
        <svg width="18" height="22" viewBox="0 0 18 22" fill="currentColor">
          <polygon points="9,22 0,4 4,0 9,3 14,0 18,4" />
        </svg>
      </div>

      {/* 转盘 */}
      <div
        className="rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.10)]"
        style={{ width: size, height: size }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ width: size, height: size }}
        />
      </div>

      {/* 按钮 */}
      {phase !== 'spinning' && phase !== 'result' && (
        <button
          onClick={spin}
          className="px-8 py-3 rounded-full bg-[#E88350] text-white text-[14px] font-zh font-medium
            shadow-[0_4px_16px_rgba(232,131,80,0.30)]
            hover:shadow-[0_8px_24px_rgba(232,131,80,0.40)]
            hover:-translate-y-0.5
            transition-all duration-300 active:scale-[0.97]"
        >
          转一下！
        </button>
      )}

      {phase === 'spinning' && (
        <span className="font-en text-[12px] tracking-[0.2em] text-[#8A8580]/50 animate-pulse">
          Spinning
        </span>
      )}

      {/* 结果弹窗 */}
      <GameDialog
        open={phase === 'result' && !showDialog}
        icon={<SparkleIcon size={36} />}
        title="抽中了"
        result={result}
        resultColor="text-[#E88350]"
        actions={[
          { label: '添加该事件', onClick: () => handleChoice('add'), icon: <ClipboardIcon size={20} /> },
          { label: '再转一次', onClick: () => handleChoice('retry'), variant: 'secondary', icon: <RefreshIcon size={20} /> },
          { label: '结束游戏', onClick: () => handleChoice('end'), variant: 'ghost' },
        ]}
      />

      {/* 次级确认弹窗 */}
      <GameDialog
        open={showDialog}
        icon={<CheckCircleIcon size={32} />}
        title="已添加到今日安排"
        subtitle="还要继续转转盘吗？"
        actions={[
          { label: '继续', onClick: () => { setShowDialog(false); setPhase('idle'); setResult(''); } },
          { label: '结束', onClick: () => { setShowDialog(false); onEnd(); }, variant: 'secondary' },
        ]}
      />
    </div>
  );
}
