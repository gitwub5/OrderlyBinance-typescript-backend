import connection from './config';

export const recordTrade = async (
  initialPriceDifference: number,
  closePriceDifference: number,
  amount: number,
  profit: number,
  buyPrice: number,
  sellPrice: number
) => {
  const [result] = await connection.query(
    'INSERT INTO trades (initial_price_difference, close_price_difference, amount, profit, buy_price, sell_price) VALUES (?, ?, ?, ?, ?, ?)',
    [initialPriceDifference, closePriceDifference, amount, profit, buyPrice, sellPrice]
  );
  return result;
};