import BreathingPanel from './components/BreathingPanel';
import PageSlider from './components/PageSlider';
import CountdownView from './components/CountdownView';
import SplitMoviePage from './components/SplitMoviePage';
import PlayPage from './components/PlayPage';

const LABELS = ['倒计时', '影视', '玩法', '留言'];

export default function App() {
  return (
    <div className="relative w-full h-[100dvh] bg-[#FFE4E1] overflow-hidden">
      {/* ===== 持久背景层 ===== */}
      <BreathingPanel color="rgba(200,70,80," speed={0.5} density={0.22} blendMode="multiply" />

      {/* 噪点纹理 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.030] z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      {/* ===== 滑页浮层 ===== */}
      <div className="relative z-10 w-full h-full">
        <PageSlider labels={LABELS} peek={56}>
          {/* 第 1 页 · 倒计时英雄 */}
          <CountdownView />

          {/* 第 2 页 · 分屏影视推荐 */}
          <SplitMoviePage />

          {/* 第 3 页 · 玩法区 */}
          <PlayPage />

          {/* 第 4 页 · 留言占位 */}
          <div className="h-full w-full flex flex-col justify-center px-4 md:px-8">
            <div className="w-full max-w-[720px] mx-auto rounded-[2rem] bg-[rgba(255,250,242,0.82)] backdrop-blur-xl shadow-[0_8px_40px_rgba(80,40,20,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] px-6 py-8 md:px-8 md:py-10">
              <span className="font-en text-[11px] tracking-[0.28em] text-[#A8614E]/50 uppercase">
                · Messages
              </span>
              <h2 className="font-zh text-2xl md:text-3xl font-medium text-[#3D3A36] tracking-[-0.01em] mt-4">
                说点什么
              </h2>
              <p className="text-sm text-[#7A6B62]/70 leading-relaxed mt-2">
                弹幕留言板即将登场
              </p>
            </div>
          </div>
        </PageSlider>
      </div>
    </div>
  );
}
