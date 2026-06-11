import { useState, useEffect, useRef } from 'react';
import { WheelIcon, SparkleIcon, ClipboardIcon, RefreshIcon, CheckCircleIcon } from './Icons';
import GameDialog from './GameDialog';

const WHEEL_ITEMS = ['看电影', '吃火锅', '逛公园', '打游戏', '宅家刷剧', '运动健身'];
const WHEEL_COLORS = ['#FF9A6B', '#98D8A8', '#FFD4C4', '#B8D8E8', '#FFE4C4', '#D4C4F0'];

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

  // 绘制转盘
  function draw(angle: number) {
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

    for (let i = 0; i < slices; i++) {
      const start = angle + i * arc;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i];
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(size * 0.045)}px "Zen Maru Gothic", sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 2;
      ctx.fillText(WHEEL_ITEMS[i], r * 0.6, 4);
      ctx.restore();
    }

    // 中心圆
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.14, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 初始绘制
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
    const duration = 3500;
    const startAngle = angleRef.current;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      angleRef.current = startAngle + totalSpin * eased;
      draw(angleRef.current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        spinningRef.current = false;
        // 计算结果
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

  const size = Math.min(window.innerWidth * 0.7, 320);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 select-none">
      {/* 指针 — 改用三角形 SVG 代替 emoji */}
      <div className="text-text-primary/50 drop-shadow-sm" style={{ marginTop: '-12px' }}>
        <svg width="24" height="18" viewBox="0 0 24 18" fill="currentColor">
          <polygon points="12,18 0,0 24,0" />
        </svg>
      </div>

      {/* Canvas 转盘 */}
      <div
        className="rounded-full shadow-[0_8px_40px_var(--color-shadow-xl)] ring-2 ring-white/30"
        style={{ width: size, height: size }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ width: size, height: size }}
        />
      </div>

      {/* 旋转按钮 */}
      {phase !== 'spinning' && phase !== 'result' && (
        <button
          onClick={spin}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-sunset-coral to-[#E88350] text-white font-zh text-base font-medium
            shadow-[0_4px_16px_var(--color-shadow-lg)] hover:shadow-[0_8px_24px_var(--color-shadow-xl)]
            hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.97]"
        >
          <WheelIcon size={22} className="-mt-0.5 align-middle mr-1.5 inline-block brightness-0 invert" />
          转一下！
        </button>
      )}

      {phase === 'spinning' && (
        <span className="font-en text-[13px] tracking-[0.2em] text-text-tertiary/50 animate-pulse">
          Spinning
        </span>
      )}

      {/* ===== 结果弹窗 ===== */}
      <GameDialog
        open={phase === 'result' && !showDialog}
        icon={<SparkleIcon size={40} />}
        title="抽中了"
        result={result}
        resultColor="text-sunset-coral"
        actions={[
          { label: '添加该事件', onClick: () => handleChoice('add'), icon: <ClipboardIcon size={20} /> },
          { label: '不满意！再转', onClick: () => handleChoice('retry'), variant: 'secondary', icon: <RefreshIcon size={20} /> },
          { label: '结束游戏', onClick: () => handleChoice('end'), variant: 'ghost' },
        ]}
      />

      {/* ===== 次级确认弹窗 ===== */}
      <GameDialog
        open={showDialog}
        icon={<CheckCircleIcon size={36} />}
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
