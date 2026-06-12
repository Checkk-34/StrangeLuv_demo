import { useContext, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { PageContext } from './PageContext';
import { getMovies, pickRandom, type MovieItem } from '../lib/movie-service';

/**
 * 瑞士国际主义风格 · 电影海报页
 * GSAP 驱动入场动画: 左栏序列 + 右侧海报网格 stagger
 */

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

/* ---------- loading skeleton ---------- */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="aspect-[2/3] w-full rounded-sm bg-[#E8E4DE]" />
          <div className="h-3 w-3/4 rounded-sm bg-[#E8E4DE]" />
          <div className="h-2 w-1/2 rounded-sm bg-[#E8E4DE]" />
        </div>
      ))}
    </div>
  );
}

export default function SplitMoviePage() {
  const { pageIndex, activeIndex } = useContext(PageContext);
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const prevActive = useRef(activeIndex);
  const fetched = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {}, { scope: containerRef });

  // 页面进出可见性
  useEffect(() => {
    if (activeIndex === pageIndex) {
      const t = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(t);
    } else if (prevActive.current === pageIndex) {
      setVisible(false);
    }
    prevActive.current = activeIndex;
  }, [activeIndex, pageIndex]);

  // 首次加载 — eager fetch
  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      getMovies().then((data) => {
        setMovies(data);
        setLoading(false);
      });
    }
  }, []);

  // GSAP 入场动画 — visible 变化时触发
  useEffect(() => {
    if (!visible || !containerRef.current) return;

    // 左栏序列：编号 → 标题 → 分隔线+描述 → 底部信息
    const leftEls = leftPanelRef.current?.querySelectorAll('[data-seq]');
    if (leftEls && leftEls.length > 0) {
      gsap.fromTo(
        leftEls,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power2.out', clearProps: 'transform' },
      );
    }

    // 海报网格 stagger
    const posters = gridRef.current?.querySelectorAll('[data-poster]');
    if (posters && posters.length > 0) {
      gsap.fromTo(
        posters,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: 'power2.out', clearProps: 'transform' },
      );
    }
  }, [visible, movies]);

  async function handleRefresh() {
    setRefreshing(true);

    // 旧海报淡出
    const oldPosters = gridRef.current?.querySelectorAll('[data-poster]');
    if (oldPosters && oldPosters.length > 0) {
      await gsap.to(oldPosters, { y: -12, opacity: 0, duration: 0.25, stagger: 0.02, ease: 'power2.in' });
    }

    const data = await pickRandom();
    setMovies(data);
    setRefreshing(false);
  }

  // 数据更新后重新入场动画
  useEffect(() => {
    if (refreshing || loading || movies.length === 0) return;
    const posters = gridRef.current?.querySelectorAll('[data-poster]');
    if (!posters || posters.length === 0) return;
    // 如果 visible 为 false（首次加载），由 visible effect 触发
    if (!visible) return;
    gsap.fromTo(
      posters,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: 'power2.out', clearProps: 'transform' },
    );
  }, [movies, loading, refreshing, visible]);

  const movieCount = movies.length || 8;

  return (
    <div
      ref={containerRef}
      className={cn(
        'h-full w-full grid grid-cols-12 gap-0 p-0 transition-opacity duration-700 ease-out',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      {/* ════════ 左 · 排版面板 ════════ */}
      <div
        ref={leftPanelRef}
        className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col justify-between
          px-6 md:px-8 lg:px-10 py-8 md:py-10 bg-[#FAF8F4] select-none"
      >
        {/* 顶部 */}
        <div>
          {/* 编号 02/05 */}
          <div className="flex items-center gap-3 mb-8" data-seq>
            <span className="font-en text-[11px] font-semibold tracking-[0.15em] text-[#E88350]">
              02
            </span>
            <span className="w-6 h-px bg-[#E88350]/30" />
            <span className="font-en text-[11px] tracking-[0.08em] text-[#8A8580]">
              05
            </span>
          </div>

          {/* 大标题 */}
          <h2 className="font-zh text-[min(10vw,7.5vh)] leading-[0.92] font-light tracking-[-0.04em] text-[#1A1A1A] mb-2" data-seq>
            一起
            <br />
            <span className="text-[#E88350]">看什么</span>
          </h2>

          {/* 分隔线 */}
          <div className="w-10 h-[2px] bg-[#1A1A1A]/10 mt-6 mb-6" data-seq />

          {/* 描述 */}
          <p className="font-zh text-[14px] md:text-[15px] leading-relaxed text-[#8A8580] font-light max-w-[24ch]" data-seq>
            选一部电影，让周末的夜晚有光。
          </p>
        </div>

        {/* 底部 */}
        <div className="space-y-3" data-seq>
          <div className="border-t border-[#1A1A1A]/6 pt-4">
            <span className="font-en text-[10px] tracking-[0.12em] text-[#8A8580]/60">
              {loading ? '...' : `${movieCount} RECOMMENDATIONS`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#8A8580]/40">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="font-en text-[9px] tracking-[0.12em]">上一页</span>
          </div>
        </div>
      </div>

      {/* ════════ 右 · 海报网格 ════════ */}
      <div className="col-span-12 md:col-span-8 lg:col-span-9
        bg-[#F5F3F0] flex flex-col overflow-hidden">
        {/* 顶部操作栏 */}
        <div className="shrink-0 flex items-center justify-between
          px-5 md:px-8 py-4 border-b border-[#1A1A1A]/6">
          <span className="font-en text-[10px] tracking-[0.18em] text-[#8A8580]/70 font-medium uppercase">
            推荐片单
          </span>
          <div className="flex items-center gap-4">
            {!loading && movies.length > 0 && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="group flex items-center gap-1.5 transition-colors duration-200"
              >
                <svg
                  viewBox="0 0 24 24" width="14" height="14" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                  className={cn('text-[#8A8580]/50 group-hover:text-[#E88350] transition-colors',
                    refreshing ? 'animate-spin' : '')}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span className="font-en text-[10px] tracking-[0.08em] text-[#8A8580]/50 group-hover:text-[#E88350] transition-colors">
                  换一批
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 海报网格 — 隐藏滚动条但保留滚动能力 */}
        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 hide-scrollbar">
          {loading ? (
            <SkeletonGrid />
          ) : movies.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-[220px]">
                <p className="font-zh text-sm text-[#8A8580]/70">暂无推荐影片</p>
                <p className="font-zh text-xs text-[#8A8580]/50 mt-2 leading-relaxed">
                  请管理员运行<br />
                  <code className="font-en text-[10px] bg-[#1A1A1A]/6 px-1.5 py-0.5">npm run refresh-movies</code>
                </p>
              </div>
            </div>
          ) : (
            <div ref={gridRef} className="h-full grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 auto-rows-[minmax(0,1fr)] gap-2 md:gap-3">
              {movies.map((m, i) => (
                <div
                  key={m.tmdb_id ?? i}
                  data-poster
                  className="group cursor-pointer flex flex-col min-h-0"
                >
                  <div className="flex-1 min-h-0 rounded-[2px] overflow-hidden bg-[#E8E4DE]
                    shadow-[0_1px_3px_rgba(0,0,0,0.04)]
                    transition-all duration-400 ease-out
                    group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]
                    group-hover:-translate-y-[2px]">
                    {m.poster ? (
                      <img
                        src={m.poster}
                        alt={m.title}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out
                          group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8A8580]/30 text-3xl select-none">
                        🎬
                      </div>
                    )}
                  </div>

                  <div className="mt-1.5 flex items-start gap-1.5 shrink-0">
                    <span className="font-en text-[9px] font-semibold tracking-[-0.02em] text-[#8A8580]/40 shrink-0 mt-0.5 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-zh text-[11px] md:text-[12px] font-medium text-[#1A1A1A] truncate leading-snug
                        group-hover:text-[#E88350] transition-colors duration-200">
                        {m.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-en text-[9px] text-[#8A8580]/60 tracking-[0.02em]">
                          {m.year}
                        </span>
                        <span className="w-[2px] h-[2px] rounded-full bg-[#8A8580]/30" />
                        <span className="font-en text-[9px] text-[#D4A857] font-semibold">
                          ★ {m.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="shrink-0 flex items-center justify-between
          px-5 md:px-8 py-3 border-t border-[#1A1A1A]/6">
          <span className="font-en text-[9px] tracking-[0.08em] text-[#8A8580]/40">
            TMDB · DAILY PICK
          </span>
          <span className="font-en text-[9px] tracking-[0.08em] text-[#E88350]/60 font-medium">
            {loading ? '...' : `${movieCount} 部`}
          </span>
        </div>
      </div>
    </div>
  );
}
