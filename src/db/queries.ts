import connection from './config';

export const recordTrade = async (
  initialPriceDifference: number,
  closePriceDifference: number,
  buyPrice: number,
  sellPrice: number
) => {
  try {
    const [result] = await connection.query(
      'INSERT INTO trades (initial_price_difference, close_price_difference, buy_price, sell_price) VALUES (?, ?, ?, ?)',
      [initialPriceDifference, closePriceDifference, buyPrice, sellPrice]
    );
    return result;
  } catch (error) {
    console.error('Error recording trade:', error);
    throw error;
  }
};