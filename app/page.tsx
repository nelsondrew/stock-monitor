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

  const response = await fetch('https://groww.in/v1/api/stocks_data/explore/v2/indices/GIDXNIFTY500/market_trends?discovery_filter_types=TOP_GAINERS&size=100', {
    headers: headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stocks');
  }

  return response.json();
}

export default async function Home() {
  const stockData: StockResponse = await getStocks();
  const stocks = stockData.categoryResponseMap.TOP_GAINERS.items
    .filter(stock => {
      const gainPerc = stock.stats.dayChangePerc;
      return gainPerc >= 1 && gainPerc <= 3;
    })
    .sort((a, b) => b.stats.dayChangePerc - a.stats.dayChangePerc); // Sort by highest to lowest gain

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Stocks with 1-3% Gains</h1>
        {stocks.length === 0 ? (
          <p className={styles.noStocks}>No stocks found with gains between 1-3% today</p>
        ) : (
          <div className={styles.stockGrid}>
            {stocks.map((stock) => (
              <Link 
                href={`/stock/${stock.gsin}`} 
                key={stock.gsin} 
                className={styles.stockCard}
              >
                <div className={styles.stockHeader}>
                  <img 
                    src={stock.company.logoUrl} 
                    alt={`${stock.company.companyName} logo`}
                    width={40}
                    height={40}
                  />
                  <h2>{stock.company.companyShortName}</h2>
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
