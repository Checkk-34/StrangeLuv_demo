import { type ReactNode } from 'react';

interface Action {
  label: string;  // 按钮文本
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: ReactNode;
}

interface GameDialogProps {
  /** 是否显示 */
  open: boolean;
  /** 图标区域 (ReactNode) */
  icon?: ReactNode;
  /** 主标题 */
  title: string;
  /** 副标题 / 描述 */
  subtitle?: ReactNode;
  /** 高亮结果文本 (可选) */
  result?: string;
  /** 结果文本颜色 (Tailwind class) */
  resultColor?: string;
  /** 子内容区域 (可选，会显示在 result 下方) */
  children?: ReactNode;
  /** 操作按钮列表 */
  actions: Action[];
  /** 点击遮罩关闭 (默认 false) */
  dismissable?: boolean;
  onDismiss?: () => void;
}

/**
 * GameDialog — 游戏结果/确认弹窗
 * 统一三个游戏的弹窗样式，消除复用代码
 */
export default function GameDialog({
  open,
  icon,
  title,
  subtitle,
  result,
  resultColor = 'text-fish-teal',
  children,
  actions,
  dismissable = false,
  onDismiss,
}: GameDialogProps) {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center px-4"
      onClick={dismissable ? onDismiss : undefined}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.20)] backdrop-blur-sm" />

      {/* 弹窗卡片 */}
      <div
        className="relative bg-card-glass-deep backdrop-blur-2xl rounded-[2rem]
          border border-white/20
          shadow-[0_20px_60px_var(--color-shadow-2xl),inset_0_1px_0_rgba(255,255,255,0.5)]
          px-7 py-7 md:px-8 md:py-8 w-full max-w-sm text-center
          animate-pop-bounce"
        style={{ animationDuration: '0.5s' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 图标 */}
        {icon && <div className="mb-3 flex justify-center">{icon}</div>}

        {/* 标题 */}
        <h3 className="font-zh text-lg md:text-xl font-medium text-text-primary mb-1">
          {title}
        </h3>

        {/* 副标题 */}
        {subtitle && (
          <p className="font-zh text-sm text-text-secondary/60 mb-4">{subtitle}</p>
        )}

        {/* 高亮结果 */}
        {result && (
          <p className={`font-zh text-xl md:text-2xl font-bold mb-5 ${resultColor}`}>
            {result}
          </p>
        )}

        {/* 子内容 */}
        {children && <div className="mb-5">{children}</div>}

        {/* 操作按钮 */}
        <div className="flex flex-col gap-2.5">
          {actions.map((action, i) => {
            const base = 'w-full py-3 rounded-xl font-zh text-sm font-medium transition-all duration-300 active:scale-[0.97]';

            const style =
              action.variant === 'secondary'
                ? `${base} bg-card-soft text-text-primary hover:bg-lily-light/50`
                : action.variant === 'ghost'
                  ? `${base} bg-transparent text-text-tertiary/60 hover:text-text-tertiary/90`
                  : `${base} bg-fish-teal text-white hover:bg-fish-teal-dark hover:shadow-lg`;

            return (
              <button key={i} onClick={action.onClick} className={style}>
                {action.icon && (
                  <span className="inline-block align-middle mr-1.5 [&_svg]:brightness-0 [&_svg]:invert">
                    {action.icon}
                  </span>
                )}
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
