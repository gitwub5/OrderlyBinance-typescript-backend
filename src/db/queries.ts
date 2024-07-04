import connection from './config';

export const recordTrade = async (
  arbitrageThreshold: number,
  trailingThreshold: number,
  initialPriceDifference: number,
  closePriceDifference: number,
  amount: number,
  profit: number,
  buyPrice: number,
  sellPrice: number
) => {
  const [result] = await connection.query(
    'INSERT INTO trades (arbitrage_threshold, trailing_threshold, initial_price_difference, close_price_difference, amount, profit, buy_price, sell_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [arbitrageThreshold, trailingThreshold, initialPriceDifference, closePriceDifference, amount, profit, buyPrice, sellPrice]
  );
  return result;
};