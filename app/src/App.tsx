import { useState, useEffect } from 'react';
import { getCurrentUser, logout as logoutAuth, type User } from './lib/auth';
import BreathingPanel from './components/BreathingPanel';
import PageSlider from './components/PageSlider';
import CountdownView from './components/CountdownView';
import SplitMoviePage from './components/SplitMoviePage';
import PlayPage from './components/PlayPage';
import LoginPage from './components/LoginPage';
import BarrageBoard from './components/BarrageBoard';
import { FishIcon, FrogIcon, CloseIcon } from './components/Icons';

const LABELS = ['倒计时', '影视', '玩法', '留言'];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    setReady(true);
  }, []);

  const bgLayer = (
    <>
      <BreathingPanel color="rgba(200,70,80," speed={0.5} density={0.22} blendMode="multiply" interactive />
      {/* 噪点纹理 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.030] z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />
    </>
  );

  // 未登录 → 显示登录页
  if (!ready) return null;
  if (!user) {
    return (
      <div className="relative w-full h-[100dvh] bg-[#FFE4E1] overflow-hidden">
        {bgLayer}
        <div className="relative z-10 w-full h-full">
          <LoginPage onLogin={(u) => setUser(u)} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] bg-[#FFE4E1] overflow-hidden">
      {bgLayer}

      {/* ===== 用户头像 + 登出 ===== */}
      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-card-glass-deep backdrop-blur-xl border border-white/20 shadow-[0_4px_16px_var(--color-shadow-lg)]">
          <span className={user.username === 'fish' ? 'text-fish-teal' : 'text-frog-emerald'}>
            {user.username === 'fish' ? <FishIcon size={20} /> : <FrogIcon size={20} />}
          </span>
          <span className="font-zh text-xs font-medium text-text-primary/70">{user.displayName}</span>
          <button
            onClick={() => { logoutAuth(); setUser(null); }}
            className="ml-1 text-text-tertiary/40 hover:text-heart-rose/70 transition-colors duration-200"
            aria-label="登出"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      </div>

      {/* ===== 滑页浮层 ===== */}
      <div className="relative z-10 w-full h-full">
        <PageSlider labels={LABELS} peek={56}>
          {/* 第 1 页 · 倒计时英雄 */}
          <CountdownView />

          {/* 第 2 页 · 分屏影视推荐 */}
          <SplitMoviePage />

          {/* 第 3 页 · 玩法区 */}
          <PlayPage user={user} />

          {/* 第 4 页 · 弹幕留言板 */}
          <BarrageBoard />
        </PageSlider>
      </div>
    </div>
  );
}
