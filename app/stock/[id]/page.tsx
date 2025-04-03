import { StockResponse, NewsItem } from '@/types/stock';
import styles from './page.module.css';
import Link from 'next/link';

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
};

async function getStockNews(companyName: string): Promise<NewsItem[]> {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(companyName + ' share news')}&tbm=nws`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      next: { revalidate: 300 }
    });

    const html = await response.text();
    
    // Extract all elements with role="heading"
    const headingRegex = /<div[^>]*role="heading"[^>]*>(.*?)<\/div>/g;
    const headings = html.match(headingRegex);
    
    if (headings) {
      // Extract text content and create NewsItem objects
      return headings
        .map(heading => {
          const textMatch = heading.match(/>([^<]*)</);
          const title = textMatch ? textMatch[1] : '';
          if (!title) return null;
          
          return {
            title,
            link: `https://www.google.com/search?q=${encodeURIComponent(title)}&tbm=nws`,
            publishedAt: new Date().toLocaleDateString()
          };
        })
        .filter((item): item is NewsItem => item !== null)
        .slice(0, 5); // Take only first 5 news items
    }

    return [];

  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

async function getStockDetails(id: string) {
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'priority': 'u=1, i',
    'referer': 'https://groww.in/markets/top-gainers?index=GIDXNIFTY500',
    'x-app-id': 'growwWeb',
    'x-device-type': 'desktop',
    'x-platform': 'web',
  };

  const response = await fetch('https://groww.in/v1/api/stocks_data/explore/v2/indices/GIDXNIFTY500/market_trends?discovery_filter_types=TOP_GAINERS&size=100', {
    headers: headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stock details');
  }

  const data: StockResponse = await response.json();
  return data.categoryResponseMap.TOP_GAINERS.items.find(stock => stock.gsin === id);
}

// Mark the component as a Server Component
export const dynamic = 'force-dynamic';

export default async function StockInfo(props: Props) {
  const { id } = props.params;
  const stock = await getStockDetails(id);

  if (!stock) {
    return <div className={styles.error}>Stock not found</div>;
  }

  const news = await getStockNews(stock.company.companyName);
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(stock.company.companyName + ' share news')}&tbm=nws`;

  return (
    <div className={styles.container}>
      <div className={styles.stockInfo}>
        <div className={styles.header}>
          <img 
            src={stock.company.logoUrl} 
            alt={`${stock.company.companyName} logo`}
            width={80}
            height={80}
          />
          <div>
            <h1>{stock.company.companyName}</h1>
            <p className={styles.shortName}>{stock.company.companyShortName}</p>
          </div>
          <a 
            href={googleSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.googleButton}
          >
            Search on Google
          </a>
        </div>

        <div className={styles.priceSection}>
          <h2 className={styles.price}>₹{stock.stats.ltp.toFixed(2)}</h2>
          <p className={styles.change} style={{
            color: stock.stats.dayChangePerc > 0 ? 'green' : 'red'
          }}>
            {stock.stats.dayChangePerc > 0 ? '↑' : '↓'} {Math.abs(stock.stats.dayChangePerc).toFixed(2)}%
          </p>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span>Day High</span>
            <span>₹{stock.stats.high}</span>
          </div>
          <div className={styles.statItem}>
            <span>Day Low</span>
            <span>₹{stock.stats.low}</span>
          </div>
          <div className={styles.statItem}>
            <span>Year High</span>
            <span>₹{stock.stats.yearHighPrice}</span>
          </div>
          <div className={styles.statItem}>
            <span>Year Low</span>
            <span>₹{stock.stats.yearLowPrice}</span>
          </div>
        </div>

        <div className={styles.newsSection}>
          <h2>Recent News</h2>
          {news.length > 0 ? (
            <div className={styles.newsList}>
              {news.map((item, index) => (
                <a 
                  key={index}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.newsItem}
                >
                  <h3>{item.title}</h3>
                  <span className={styles.newsDate}>{item.publishedAt}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className={styles.noNews}>No recent news available</p>
          )}
        </div>
      </div>
    </div>
  );
} 