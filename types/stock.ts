export interface StockResponse {
  categoryResponseMap: {
    TOP_GAINERS: {
      items: Stock[];
    };
  };
}

export interface Stock {
  gsin: string;
  company: {
    companyName: string;
    companyShortName: string;
    logoUrl: string;
  };
  stats: {
    ltp: number;
    high: number;
    low: number;
    dayChangePerc: number;
    yearHighPrice: number;
    yearLowPrice: number;
  };
}

export interface NewsItem {
  title: string;
  link: string;
  publishedAt: string;
}

export interface StockWithNews {
  stock: Stock;
  news: NewsItem[];
} 