'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../page.module.css';

interface Stock {
  gsin: string;
  company: {
    companyName: string;
    companyShortName: string;
    logoUrl: string;
  };
  stats: {
    ltp: number;
    dayChangePerc: number;
    high: number;
    low: number;
  };
}

export default function StockList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topGainers, setTopGainers] = useState<Stock[]>([]);
  const [volumeTradedGsins, setVolumeTradedGsins] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchStocks() {
      try {
        const response = await fetch('/api/stocks');
        if (!response.ok) {
          throw new Error('Failed to fetch stocks');
        }

        const { gainersData, volumeData } = await response.json();

        // Get volume traded stock GSINs
        const volumeGsins = new Set(
          volumeData.categoryResponseMap.TRADED_BY_VOLUME.items.map((stock: Stock) => stock.gsin)
        );
        // @ts-ignore
        setVolumeTradedGsins(volumeGsins);

        // Filter and sort stocks
        const filteredStocks = gainersData.categoryResponseMap.TOP_GAINERS.items
          .filter((stock: Stock) => {
            const gainPerc = stock.stats.dayChangePerc;
            return gainPerc >= 1 && gainPerc <= 3;
          })
          .sort((a: Stock, b: Stock) => {
            const aInVolume = volumeGsins.has(a.gsin);
            const bInVolume = volumeGsins.has(b.gsin);
            
            if (aInVolume && !bInVolume) return -1;
            if (!aInVolume && bInVolume) return 1;
            
            return b.stats.dayChangePerc - a.stats.dayChangePerc;
          });

        setTopGainers(filteredStocks);
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setError('Failed to fetch stocks. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchStocks();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading stocks...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <>
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
    </>
  );
} 