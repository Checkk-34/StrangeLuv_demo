import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * 浮页面板 — 毛玻璃卡片，浮在背景之上
 * 瑞士风格：圆角大、内边距慷慨、半透暖白底
 */
export default function FloatingPanel({ children, className = '' }: Props) {
  return (
    <div
      className={`
        w-full max-w-[720px] mx-auto
        rounded-[2rem] md:rounded-[2.5rem]
        bg-[rgba(255,250,242,0.82)]
        backdrop-blur-xl
        shadow-[0_8px_40px_rgba(80,40,20,0.15),inset_0_1px_0_rgba(255,255,255,0.6)]
        px-6 py-8 md:px-10 md:py-10
        ${className}
      `}
    >
      {children}
    </div>
  );
}
