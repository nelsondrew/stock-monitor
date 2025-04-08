import styles from "./page.module.css";
import StockList from './components/StockList';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Stocks with 1-4% Gains</h1>
        <StockList />
      </main>
    </div>
  );
}
