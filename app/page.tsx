// @ts-nocheck
import { StockResponse } from '@/types/stock';
import styles from "./page.module.css";
import Link from 'next/link';

async function getStocks() {
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'priority': 'u=1, i',
    'referer': 'https://groww.in/markets/top-gainers?index=GIDXNIFTY500',
    'x-app-id': 'growwWeb',
    'x-device-type': 'desktop',
    'x-platform': 'web',
  };

  // Fetch both top gainers and volume traded stocks
  const [gainersResponse, volumeResponse] = await Promise.all([
    fetch('https://groww.in/v1/api/stocks_data/explore/v2/indices/GIDXNIFTY500/market_trends?discovery_filter_types=TOP_GAINERS&size=100', {
      headers: headers,
    }),
    fetch('https://groww.in/v1/api/stocks_data/explore/v2/indices/GIDXNIFTY500/market_trends?discovery_filter_types=TRADED_BY_VOLUME&size=20', {
      headers: headers,
    })
  ]);

  if (!gainersResponse.ok || !volumeResponse.ok) {
    throw new Error('Failed to fetch stocks');
  }

  const [gainersData, volumeData] = await Promise.all([
    gainersResponse.json(),
    volumeResponse.json()
  ]);

  return { gainersData, volumeData };
}

export default async function Home() {
  const { gainersData, volumeData } = await getStocks();
  
  // Get volume traded stock GSINs for quick lookup
  const volumeTradedGsins = new Set(
    volumeData.categoryResponseMap.TRADED_BY_VOLUME.items.map(stock => stock.gsin)
  );

  // Filter and sort stocks
  const topGainers = gainersData.categoryResponseMap.TOP_GAINERS.items
    .filter(stock => {
      const gainPerc = stock.stats.dayChangePerc;
      return gainPerc >= 1 && gainPerc <= 3;
    })
    .sort((a, b) => {
      // First sort by whether they're in volume traded list
      const aInVolume = volumeTradedGsins.has(a.gsin);
      const bInVolume = volumeTradedGsins.has(b.gsin);
      
      if (aInVolume && !bInVolume) return -1;
      if (!aInVolume && bInVolume) return 1;
      
      // If both are in volume list or both aren't, sort by gain percentage
      return b.stats.dayChangePerc - a.stats.dayChangePerc;
    });

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Stocks with 1-3% Gains</h1>
        {topGainers.length === 0 ? (
          <p className={styles.noStocks}>No stocks found with gains between 1-3% today</p>
        ) : (
          <div className={styles.stockGrid}>
            {topGainers.map((stock) => (
              <Link 
                href={`/stock/${stock.gsin}`} 
                key={stock.gsin} 
                className={`${styles.stockCard} ${volumeTradedGsins.has(stock.gsin) ? styles.highVolume : ''}`}
              >
                <div className={styles.stockHeader}>
                  <img 
                    src={stock.company.logoUrl} 
                    alt={`${stock.company.companyName} logo`}
                    width={40}
                    height={40}
                  />
                  <h2>{stock.company.companyShortName}</h2>
                  {volumeTradedGsins.has(stock.gsin) && (
                    <span className={styles.volumeBadge}>High Volume</span>
                  )}
                </div>
                <div className={styles.stockDetails}>
                  <p className={styles.price}>₹{stock.stats.ltp.toFixed(2)}</p>
                  <p className={styles.change} style={{
                    color: stock.stats.dayChangePerc > 0 ? 'green' : 'red'
                  }}>
                    {stock.stats.dayChangePerc > 0 ? '↑' : '↓'} {Math.abs(stock.stats.dayChangePerc).toFixed(2)}%
                  </p>
                  <div className={styles.minMax}>
                    <p>Day High: ₹{stock.stats.high}</p>
                    <p>Day Low: ₹{stock.stats.low}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
