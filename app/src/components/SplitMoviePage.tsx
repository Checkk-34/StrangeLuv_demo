import { useContext, useEffect, useRef, useState } from 'react';
import { PageContext } from './PageContext';
import { getMovies, pickRandom, type MovieItem } from '../lib/movie-service';

/**
 * 分屏影视页 — 从 Supabase 缓存随机取 8 部电影
 * 数据由 scripts/refresh-movies.js 手动维护（挂 VPN 运行）
 * 左半: 呼吸背景透出（大字标题）
 * 右半: 白底 + 影视条目列表，右上角 🔄 可手动换一批
 */
export default function SplitMoviePage() {
  const { pageIndex, activeIndex } = useContext(PageContext);
  const prevActive = useRef(activeIndex);
  const [anim, setAnim] = useState<'idle' | 'entering' | 'leaving-left' | 'leaving-right'>('idle');
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  // 页面进场动画
  useEffect(() => {
    if (activeIndex === pageIndex) {
      if (anim === 'idle' || anim.startsWith('leaving')) {
        const t = setTimeout(() => setAnim('entering'), 250);
        return () => clearTimeout(t);
      }
    } else if (prevActive.current === pageIndex) {
      const dir = activeIndex > pageIndex ? 'left' : 'right';
      setAnim(dir === 'left' ? 'leaving-left' : 'leaving-right');
    }
    prevActive.current = activeIndex;
  }, [activeIndex, pageIndex, anim]);

  // 首次到达本页时拉取电影数据
  useEffect(() => {
    if (activeIndex === pageIndex && !fetched.current) {
      fetched.current = true;
      setLoading(true);
      getMovies().then((data) => {
        setMovies(data);
        setLoading(false);
      });
    }
  }, [activeIndex, pageIndex]);

  // 手动刷新 — 重新随机取一批
  const [refreshing, setRefreshing] = useState(false);
  async function handleRefresh() {
    setRefreshing(true);
    const data = await pickRandom();
    setMovies(data);
    setRefreshing(false);
    // 触发入场动画
    setAnim('entering');
  }

  const movieCount = movies.length || 8;

  return (
    <div className="h-full w-full flex">
      {/* ═══ 左半 · 呼吸背景透出 ═══ */}
      <div className="flex-1 hidden md:flex flex-col justify-between px-6 py-8 md:px-8 md:py-10 relative overflow-hidden">
        <div>
          <span className="font-en text-[11px] tracking-[0.28em] text-[#A8614E]/40 uppercase">
            Cinema
          </span>
          <div className="mt-2">
            <span className="font-en text-[11px] tracking-[0.08em] text-[#A8614E]/25">
              02 / 05
            </span>
          </div>
        </div>

        <div>
          <h2 className="font-zh font-light text-[min(8vw,9vh)] leading-[0.92] tracking-[-0.03em] text-[#3D3A36]">
            一起<br/>看什么
          </h2>
          <div className="mt-6 max-w-[28ch]">
            <p className="font-zh text-[15px] md:text-[17px] leading-relaxed text-[#7A6B62]/50 font-light">
              选一部电影，让周末的夜晚有光。
            </p>
          </div>
        </div>

        <div className="border-t border-[#E8E0D6] pt-4">
          <span className="font-en text-[11px] tracking-[0.12em] text-[#7A6B62]/30">
            {loading ? '...' : `${movieCount} RECOMMENDATIONS`}
          </span>
        </div>
      </div>

      {/* ═══ 右半 · 白底影视条目 ═══ */}
      <div className="flex-1 flex flex-col bg-[#FFFCF7] px-6 py-8 md:px-10 md:py-10 overflow-y-auto">
        {/* 顶部栏 */}
        <div className="flex justify-between items-start mb-6 md:mb-8">
          <span className="font-en text-[11px] tracking-[0.22em] text-[#7A6B62]/40 uppercase">
            {loading ? 'Loading...' : 'Recommendations'}
          </span>
          <div className="flex items-center gap-3">
            {!loading && movies.length > 0 && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-[#7A6B62]/40 hover:text-fish-teal/70 transition-colors duration-300 disabled:opacity-30"
                aria-label="换一批"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={refreshing ? 'animate-spin' : ''}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            )}
            <span className="font-en text-[11px] tracking-[0.06em] text-[#7A6B62]/30">
              适合一起看
            </span>
          </div>
        </div>

        {/* 影视卡片列表 */}
        <div className="flex flex-col flex-1">
          {loading ? (
            // 加载骨架
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 md:gap-6 py-4 md:py-5 px-1 border-b border-[#E8E0D6] animate-pulse">
                <div className="w-10 md:w-12 shrink-0 h-6 bg-[#E8E0D6] rounded" />
                <div className="w-14 md:w-16 aspect-[2/3] shrink-0 rounded-lg bg-[#E8E0D6]" />
                <div className="flex-1 pt-0.5 space-y-2">
                  <div className="h-4 bg-[#E8E0D6] rounded w-3/4" />
                  <div className="h-3 bg-[#E8E0D6] rounded w-1/3" />
                </div>
              </div>
            ))
          ) : movies.length === 0 ? (
            // 缓存无数据时提示运行刷新脚本
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-[220px]">
                <p className="font-zh text-sm text-text-tertiary/60">暂无推荐影片</p>
                <p className="font-zh text-xs text-text-tertiary/40 mt-2 leading-relaxed">
                  请管理员运行<br/>
                  <code className="font-en text-[10px] bg-[#A8614E]/8 px-1.5 py-0.5 rounded">npm run refresh-movies</code><br/>
                  来初始化电影数据
                </p>
              </div>
            </div>
          ) : (
            movies.map((m, i) => (
              <div
                key={m.tmdb_id ?? i}
                className={`
                  flex items-start gap-4 md:gap-6 py-4 md:py-5 px-1
                  transition-all duration-300
                  ${i === movies.length - 1 ? 'border-b-2 border-[#A8614E]' : 'border-b border-[#E8E0D6]'}
                  hover:bg-[#A8614E]/[0.03] cursor-pointer group
                  ${anim === 'entering' ? 'animate-slide-in-right' : ''}
                  ${anim === 'leaving-left' ? 'animate-slide-out-left' : ''}
                  ${anim === 'leaving-right' ? 'animate-slide-out-right' : ''}
                  ${anim === 'idle' ? 'opacity-0' : ''}
                `}
                style={{
                  animationDelay: anim === 'entering' ? `${i * 0.12}s` : '0s',
                  animationFillMode: 'both',
                }}
              >
                {/* 编号 */}
                <div className="font-en font-extralight text-[min(4vw,3.8vh)] leading-[0.9] text-[#3D3A36] w-10 md:w-12 shrink-0 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* 海报缩略图 */}
                <div className="w-14 md:w-16 aspect-[2/3] shrink-0 rounded-lg overflow-hidden bg-[#A8614E]/8
                  shadow-sm group-hover:shadow-md
                  transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  group-hover:-translate-y-0.5">
                  {m.poster ? (
                    <img
                      src={m.poster}
                      alt={m.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#A8614E]/30 text-2xl">🎬</div>
                  )}
                </div>

                {/* 信息 */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className="font-zh text-[14px] md:text-[16px] font-medium text-[#3D3A36] truncate leading-snug group-hover:text-[#A8614E] transition-colors">
                    {m.title}
                  </h3>
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <span className="font-en text-[12px] tracking-[0.04em] text-[#7A6B62]/45">
                      {m.year}
                    </span>
                    <span className="w-[3px] h-[3px] rounded-full bg-[#7A6B62]/25" />
                    <span className="font-en text-[12px] font-semibold text-gold-amber/80">
                      ★ {m.rating}
                    </span>
                  </div>
                </div>

                {/* 箭头 */}
                <div className="shrink-0 self-center opacity-0 group-hover:opacity-40 transition-opacity duration-300">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#3D3A36" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M5 3l5 5-5 5" />
                  </svg>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部提示 */}
        <div className="flex justify-between items-center pt-4 mt-auto">
          <span className="font-en text-[11px] tracking-[0.08em] text-[#7A6B62]/30">
            ← 上一页
          </span>
          <span className="font-en text-[11px] tracking-[0.08em] text-[#A8614E]/40">
            {loading ? '...' : `${movieCount} 部推荐`}
          </span>
        </div>
      </div>
    </div>
  );
}
