import connection from "./config";

// Main function to record trade
export const recordTrade = async (
  tokenName: string,
  initialPriceDifference: number,
  closePriceDifference: number,
  binanceSide: string,
  binanceEnterPrice: number,
  binanceClosePrice: number,
  orderlySide: string,
  orderlyEnterPrice: number,
  orderlyClosePrice: number,
  amount: number
) => {
  // average entry price * amount = transaction amount
  const transactionAmount = ((binanceEnterPrice + orderlyEnterPrice) / 2) * amount;

  let binancePnl: number | null = null;
  let orderlyPnl: number | null = null;
  let totalPnl: number | null = null;
  let winLossStatus: string | null = null;

  // Calculate Binance PnL
  const binanceMakerFeeRate = 0.0002;
  const binanceTakerFeeRate = 0.0005;

  if (binanceEnterPrice !== 0 && binanceClosePrice !== 0) {
    if (binanceSide === 'SELL') {
      binancePnl = ((binanceEnterPrice - binanceClosePrice) - (binanceEnterPrice * binanceMakerFeeRate + binanceClosePrice * binanceTakerFeeRate)) * amount;
    } else if (binanceSide === 'BUY') {
      binancePnl = ((binanceClosePrice - binanceEnterPrice) - (binanceEnterPrice * binanceMakerFeeRate + binanceClosePrice * binanceTakerFeeRate)) * amount;
    }
  } else {
    console.error('Record Error: Binance Price cannot be 0');
  }

  // Calculate Orderly PnL
  const orderlyMakerFeeRate = 0.0003;
  const orderlyTakerFeeRate = 0.0003;

  if (orderlyEnterPrice !== 0 && orderlyClosePrice !== 0) {
    if (orderlySide === 'SELL') {
      orderlyPnl = ((orderlyEnterPrice - orderlyClosePrice) - (orderlyEnterPrice * orderlyMakerFeeRate + orderlyClosePrice * orderlyTakerFeeRate)) * amount;
    } else if (orderlySide === 'BUY') {
      orderlyPnl = ((orderlyClosePrice - orderlyEnterPrice) - (orderlyEnterPrice * orderlyMakerFeeRate + orderlyClosePrice * orderlyTakerFeeRate)) * amount;
    }
  } else {
    console.error('Record Error: Orderly Price cannot be 0');
  }

  // Calculate Total PnL and determine win/loss status
  if (typeof binancePnl === 'number' && typeof orderlyPnl === 'number') {
    totalPnl = binancePnl + orderlyPnl;
    winLossStatus = totalPnl > 0 ? 'WIN' : 'LOSS';
  } else {
    console.error('Record Error: PnL calculation resulted in null values');
  }

  // Insert records into respective tables
  await connection.execute(
    "INSERT INTO binance_trades (token_name, timestamp, side, enter_price, close_price, binance_pnl) VALUES (?, NOW(), ?, ?, ?, ?)",
    [tokenName, binanceSide, binanceEnterPrice, binanceClosePrice, binancePnl]
  );

  await connection.execute(
    "INSERT INTO orderly_trades (token_name, timestamp, side, enter_price, close_price, orderly_pnl) VALUES (?, NOW(), ?, ?, ?, ?)",
    [tokenName, orderlySide, orderlyEnterPrice, orderlyClosePrice, orderlyPnl]
  );

  await connection.execute(
    "INSERT INTO trades_summary (token_name, timestamp, transaction_amount, initial_price_difference, close_price_difference, binance_pnl, orderly_pnl, total_pnl, win_loss_status) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?)",
    [
      tokenName,
      transactionAmount,
      initialPriceDifference,
      closePriceDifference,
      binancePnl,
      orderlyPnl,
      totalPnl,
      winLossStatus,
    ]
  );

  console.log("Trade recorded successfully.");
};