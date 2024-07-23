import connection from './config';

export const recordTrade = async (
  tokenName: string,
  initialPriceDifference: number,
  closePriceDifference: number,
  enterPrice: number,
  closePrice: number,
  amount: number
) => {
  const transactionAmount = enterPrice * amount;

  const MakerFee = enterPrice * 0.0002;
  const TakerFee = closePrice * 0.0005;

  let binancePnl: string | number | null = 0;
  let winLossStatus: string | null = 'LOSS';

  if (enterPrice === 0 || closePrice === 0) {
    binancePnl = null;
    winLossStatus = null;
  } else if (initialPriceDifference > 0) {
    binancePnl = ((enterPrice - closePrice) - (MakerFee + TakerFee)) * amount;
  } else if (initialPriceDifference < 0) {
    binancePnl = ((closePrice - enterPrice) - (MakerFee + TakerFee)) * amount;
  }

  if (typeof binancePnl === 'number' && binancePnl > 0) {
    winLossStatus = 'WIN';
  }

  const [result] = await connection.query(
    'INSERT INTO trades (token_name, initial_price_difference, close_price_difference, binance_enter_price, binance_close_price, transaction_amount, win_loss_status, binance_pnl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [tokenName, initialPriceDifference, closePriceDifference, enterPrice, closePrice, transactionAmount, winLossStatus, binancePnl]
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