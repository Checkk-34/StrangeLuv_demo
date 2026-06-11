/** 🐟🐸 品牌图标 — 池塘奇遇视觉系统 */

interface IconProps {
  size?: number;
  className?: string;
}

/** 小鱼 — 湖水蓝鱼形（针对暖色背景优化） */
export function FishIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-label="小鱼"
    >
      <defs>
        <linearGradient id="fish-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E88350" />
          <stop offset="100%" stopColor="#D07242" />
        </linearGradient>
      </defs>
      <path d="M3 12c0-4 6-8 12-8 3 0 6 2 6 2s-3 2-6 2c-6 0-12-4-12 4z" fill="url(#fish-grad)" opacity="0.15" />
      <path d="M3 12c2-3 8-6 12-6 3 0 5.5 2 5.5 2s-2.5 2-5.5 2c-4 0-10-3-12 2z" fill="url(#fish-grad)" opacity="0.40" />
      <path d="M4 12c1.5-2 7-5 11-5 2.5 0 4.5 1.5 4.5 1.5S17 10 15 10c-4 0-9.5-2-11 2z" fill="url(#fish-grad)" />
      <path d="M15 10l5-4v8l-5-4z" fill="url(#fish-grad)" opacity="0.55" />
      <circle cx="7" cy="11.5" r="1.2" fill="#FFF" opacity="0.95" />
      <circle cx="7" cy="11.5" r="0.6" fill="#1A3A45" />
    </svg>
  );
}

/** 蛙蛙 — 翡翠色简约蛙形 */
export function FrogIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-label="蛙蛙"
    >
      <defs>
        <linearGradient id="frog-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6DB87C" />
          <stop offset="100%" stopColor="#58A368" />
        </linearGradient>
      </defs>
      <ellipse cx="12" cy="14" rx="7.5" ry="6" fill="url(#frog-grad)" />
      <ellipse cx="9" cy="9.5" rx="3.5" ry="3" fill="url(#frog-grad)" opacity="0.85" />
      <ellipse cx="15" cy="9.5" rx="3.5" ry="3" fill="url(#frog-grad)" opacity="0.85" />
      <circle cx="9" cy="9" r="1.8" fill="#FFF" />
      <circle cx="15" cy="9" r="1.8" fill="#FFF" />
      <circle cx="9.5" cy="9" r="1" fill="#3D5A4C" />
      <circle cx="15.5" cy="9" r="1" fill="#3D5A4C" />
      <circle cx="9.8" cy="8.5" r="0.4" fill="#FFF" opacity="0.7" />
      <circle cx="15.8" cy="8.5" r="0.4" fill="#FFF" opacity="0.7" />
      <path d="M5 16l-2.5-1.5" stroke="url(#frog-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 16l2.5-1.5" stroke="url(#frog-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.5 19l-1.5 2.5" stroke="url(#frog-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17.5 19l1.5 2.5" stroke="url(#frog-grad)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ==============================================
   🎨 全套品牌 UI 图标
   风格：极简几何 · 2px 圆角描边 · 品牌色系
   ============================================== */

const TEAL = '#E88350';
const EMERALD = '#6DB87C';
const ROSE = '#FF6B8A';
const GOLD = '#D4A857';
const DARK = '#3D5A4C';
const LINE_W = 1.8;

/** 🎯 转盘 — 靶心图标 */
export function WheelIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" aria-label="转盘">
      <circle cx="12" cy="12" r="9" stroke={TEAL} strokeWidth={LINE_W} />
      <circle cx="12" cy="12" r="6" stroke={TEAL} strokeWidth={LINE_W} opacity="0.5" />
      <circle cx="12" cy="12" r="2.5" fill={TEAL} />
      {/* 十字瞄准线 */}
      <line x1="12" y1="1" x2="12" y2="4" stroke={TEAL} strokeWidth={LINE_W} strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="23" stroke={TEAL} strokeWidth={LINE_W} strokeLinecap="round" />
      <line x1="1" y1="12" x2="4" y2="12" stroke={TEAL} strokeWidth={LINE_W} strokeLinecap="round" />
      <line x1="20" y1="12" x2="23" y2="12" stroke={TEAL} strokeWidth={LINE_W} strokeLinecap="round" />
    </svg>
  );
}

/** 🎰 老虎机 — 三列卷轴图标 */
export function SlotIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" aria-label="老虎机">
      {/* 机箱 */}
      <rect x="2" y="4" width="20" height="16" rx="3" stroke={EMERALD} strokeWidth={LINE_W} />
      {/* 三个窗口 */}
      <rect x="4.5" y="7.5" width="4.5" height="6" rx="1.2" stroke={EMERALD} strokeWidth={1.4} opacity="0.55" />
      <rect x="9.75" y="7.5" width="4.5" height="6" rx="1.2" stroke={EMERALD} strokeWidth={1.4} opacity="0.55" />
      <rect x="15" y="7.5" width="4.5" height="6" rx="1.2" stroke={EMERALD} strokeWidth={1.4} opacity="0.55" />
      {/* 拉杆 */}
      <line x1="20" y1="4" x2="20" y2="1" stroke={EMERALD} strokeWidth={LINE_W} strokeLinecap="round" />
      <circle cx="20" cy="1.5" r="1.2" fill={EMERALD} />
    </svg>
  );
}

/** 💞 默契问卷 — 双心涟漪图标 */
export function HeartIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" aria-label="默契问卷">
      <path d="M12 20s-7-4.5-9-7.5a4.5 4.5 0 0 1 1-6.2 4.5 4.5 0 0 1 5.3-.3L12 9l2.7-3a4.5 4.5 0 0 1 5.3.3 4.5 4.5 0 0 1 1 6.2c-2 3-9 7.5-9 7.5z"
        stroke={ROSE} strokeWidth={LINE_W} strokeLinejoin="round" fill={ROSE} fillOpacity="0.12" />
      <path d="M8.5 10l3.5 4 4-4" stroke={ROSE} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 🎉 庆祝 — 星芒散花图标 */
export function SparkleIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" aria-label="庆祝">
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" fill={GOLD} opacity="0.3" />
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" stroke={GOLD} strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx="8" cy="18" r="1.2" fill={GOLD} opacity="0.5" />
      <circle cx="17" cy="17" r="0.9" fill={GOLD} opacity="0.4" />
      <circle cx="13" cy="20" r="1" fill={GOLD} opacity="0.35" />
    </svg>
  );
}

/** ✅ 勾选 — 圆形勾号 */
export function CheckCircleIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" aria-label="已确认">
      <circle cx="12" cy="12" r="9.5" stroke={EMERALD} strokeWidth={LINE_W} opacity="0.3" />
      <circle cx="12" cy="12" r="9.5" stroke={EMERALD} strokeWidth={LINE_W} strokeDasharray="2 3" opacity="0.4" />
      <path d="M8 12.5l2.5 2.5 5-5.5" stroke={EMERALD} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 📋 添加 — 剪贴板加号图标 */
export function ClipboardIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" aria-label="添加到安排">
      <rect x="5" y="4" width="14" height="17" rx="2.5" stroke={DARK} strokeWidth={LINE_W} opacity="0.25" />
      <rect x="5" y="4" width="14" height="17" rx="2.5" stroke={DARK} strokeWidth={LINE_W} />
      {/* 三条内容线 */}
      <line x1="8.5" y1="10" x2="15.5" y2="10" stroke={DARK} strokeWidth={1.5} strokeLinecap="round" opacity="0.4" />
      <line x1="8.5" y1="13" x2="15.5" y2="13" stroke={DARK} strokeWidth={1.5} strokeLinecap="round" opacity="0.4" />
      <line x1="8.5" y1="16" x2="12.5" y2="16" stroke={DARK} strokeWidth={1.5} strokeLinecap="round" opacity="0.4" />
      {/* 加号 */}
      <line x1="17" y1="7" x2="17" y2="11" stroke={TEAL} strokeWidth={2} strokeLinecap="round" />
      <line x1="15" y1="9" x2="19" y2="9" stroke={TEAL} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

/** 🔄 重试 — 循环箭头图标 */
export function RefreshIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" aria-label="重试">
      <path d="M17 4a9 9 0 1 1-3 16.5" stroke={DARK} strokeWidth={LINE_W} strokeLinecap="round" opacity="0.25" />
      <path d="M17 4a9 9 0 1 1-3 16.5" stroke={DARK} strokeWidth={LINE_W} strokeLinecap="round" strokeDasharray="2 6" opacity="0.35" />
      <path d="M15 4l4-3v6l-4-3z" fill={DARK} />
    </svg>
  );
}

/** 📝 手动 — 便签笔图标 */
export function NoteIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" aria-label="手动添加">
      <rect x="4" y="3" width="16" height="18" rx="2.5" stroke={TEAL} strokeWidth={LINE_W} />
      <path d="M7 8l10-1" stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" opacity="0.4" />
      <path d="M7 12l10-1" stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" opacity="0.4" />
      <path d="M7 16l5-0.5" stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/** 📌 默认 — 图钉图标 */
export function PinIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" aria-label="待办">
      <path d="M12 4v10" stroke={DARK} strokeWidth={LINE_W} strokeLinecap="round" opacity="0.4" />
      <path d="M8 8l-2 6h12l-2-6V4H8v4z" stroke={DARK} strokeWidth={LINE_W} strokeLinejoin="round" />
      <circle cx="12" cy="18" r="2" stroke={DARK} strokeWidth={1.6} opacity="0.5" />
    </svg>
  );
}

/** ✕ 关闭 — 叉号图标 */
export function CloseIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" aria-label="关闭">
      <circle cx="12" cy="12" r="9" stroke={DARK} strokeWidth={1.4} opacity="0.15" />
      <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke={DARK} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}
