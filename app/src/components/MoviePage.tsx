const MOVIES = [
  { title: '你的名字。', year: '2016', rating: '8.4', poster: 'https://picsum.photos/seed/your-name/300/450' },
  { title: '天气之子', year: '2019', rating: '8.1', poster: 'https://picsum.photos/seed/weathering/300/450' },
  { title: '铃芽之旅', year: '2022', rating: '8.0', poster: 'https://picsum.photos/seed/suzume/300/450' },
  { title: '千与千寻', year: '2001', rating: '9.4', poster: 'https://picsum.photos/seed/spirited-away/300/450' },
  { title: '哈尔的移动城堡', year: '2004', rating: '9.1', poster: 'https://picsum.photos/seed/howls-moving/300/450' },
];

export default function MoviePage() {
  return (
    <div className="h-full w-full flex flex-col justify-center px-4 md:px-8">
      {/* 毛玻璃卡片容器 */}
      <div className="w-full max-w-[720px] mx-auto rounded-[2rem] bg-[rgba(255,250,242,0.82)] backdrop-blur-xl shadow-[0_8px_40px_rgba(80,40,20,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] px-6 py-8 md:px-8 md:py-10">
        {/* 头部 */}
        <div className="flex items-center gap-3 mb-6">
          <span className="w-6 h-px bg-[#A8614E]/30" />
          <span className="font-en text-[11px] tracking-[0.28em] text-[#A8614E]/50 uppercase">
            Cinema
          </span>
          <span className="flex-1 h-px bg-[#A8614E]/15" />
          <span className="font-en text-[11px] tracking-[0.08em] text-[#7A6B62]/40">
            一起看什么
          </span>
        </div>

        {/* 滚动卡片行 */}
        <div
          className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2 snap-x snap-mandatory
            [&::-webkit-scrollbar]:hidden scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
          {MOVIES.map((m, i) => (
            <div
              key={i}
              className="snap-start shrink-0 w-[140px] md:w-[160px] group cursor-pointer"
            >
              {/* 海报 */}
              <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[#A8614E]/10 mb-2.5
                shadow-sm group-hover:shadow-md
                transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                group-hover:-translate-y-1">
                <img
                  src={m.poster}
                  alt={m.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* 片名 */}
              <h3 className="font-zh text-[13px] md:text-[14px] font-medium text-[#3D3A36] truncate leading-tight">
                {m.title}
              </h3>

              {/* 元数据 */}
              <div className="flex items-center gap-2 mt-1">
                <span className="font-en text-[11px] tracking-[0.04em] text-[#7A6B62]/50">
                  {m.year}
                </span>
                <span className="w-[2px] h-[2px] rounded-full bg-[#7A6B62]/30" />
                <span className="font-en text-[11px] font-semibold text-gold-amber">
                  {m.rating}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 底部 — 左右箭头提示 */}
        <div className="flex justify-between items-center mt-5">
          <span className="font-en text-[11px] tracking-[0.12em] text-[#7A6B62]/40">
            ← 滑动浏览
          </span>
          <span className="font-en text-[11px] tracking-[0.08em] text-[#7A6B62]/40">
            {MOVIES.length} 部推荐
          </span>
        </div>
      </div>
    </div>
  );
}
