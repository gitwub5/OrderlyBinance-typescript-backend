import connection from './config';

export const recordTrade = async (
  tokenName: string,
  initialPriceDifference: number,
  closePriceDifference: number,
  buyPrice: number,
  sellPrice: number
) => {
  const [result] = await connection.query(
    'INSERT INTO trades (token_name, initial_price_difference, close_price_difference, buy_price, sell_price) VALUES (?, ?, ?, ?, ?)',
    [tokenName, initialPriceDifference, closePriceDifference, buyPrice, sellPrice]
  );
  return result;
};

export const getTradesByTokenName = async (tokenName: string) => {
  const [rows] = await connection.query(
    'SELECT * FROM trades WHERE token_name = ?',
    [tokenName]
  );
  return rows;
};