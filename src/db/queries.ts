import connection from './config';

export const recordTrade = async (
  tokenName: string,
  initialPriceDifference: number,
  closePriceDifference: number,
  enterPrice: number,
  closePrice: number
) => {
  const [result] = await connection.query(
    'INSERT INTO trades (token_name, initial_price_difference, close_price_difference, orderly_enter_price, orderly_close_price) VALUES (?, ?, ?, ?, ?)',
    [tokenName, initialPriceDifference, closePriceDifference, enterPrice, closePrice]
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