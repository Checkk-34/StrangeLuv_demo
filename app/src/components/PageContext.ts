import { createContext } from 'react';

export interface PageCtx {
  /** 当前页面的固定序号 */
  pageIndex: number;
  /** PageSlider 当前活跃页 */
  activeIndex: number;
}

export const PageContext = createContext<PageCtx>({ pageIndex: 0, activeIndex: 0 });
