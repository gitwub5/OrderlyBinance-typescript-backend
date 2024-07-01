import connection from './config';

export const recordTrade = async (buyPrice: number, sellPrice: number, amount: number, profit: number, arbitrageThreshold: number, closeThreshold: number) => {
    const [result] = await connection.query(
      'INSERT INTO trades (buy_price, sell_price, amount, profit, arbitrage_threshold, close_threshold) VALUES (?, ?, ?, ?, ?, ?)',
      [buyPrice, sellPrice, amount, profit, arbitrageThreshold, closeThreshold]
    );
    return result;
  };