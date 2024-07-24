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

  // Constants for fee rates
  const binanceMakerFeeRate = 0.0002;
  const binanceTakerFeeRate = 0.0005;
  const orderlyMakerFeeRate = 0.0003;
  const orderlyTakerFeeRate = 0.0003;

  let binancePnl: string | number = 0;
  let orderlyPnl: string | number = 0;
  let totalPnl: string | number = 0;
  let winLossStatus: string | null = null;

  if (binanceEnterPrice === 0 || binanceClosePrice === 0 || orderlyEnterPrice === 0 || orderlyClosePrice === 0) {
    binancePnl = "Record Error: Price cannot be 0";
    orderlyPnl = "Record Error: Price cannot be 0";
    totalPnl = "Record Error: Price cannot be 0";
  } else {
    // Calculate Binance PnL
    if (binanceSide === 'SELL') {
      binancePnl = ((binanceEnterPrice - binanceClosePrice) - (binanceEnterPrice * binanceMakerFeeRate + binanceClosePrice * binanceTakerFeeRate)) * amount;
    } else if (binanceSide === 'BUY') {
      binancePnl = ((binanceClosePrice - binanceEnterPrice) - (binanceEnterPrice * binanceMakerFeeRate + binanceClosePrice * binanceTakerFeeRate)) * amount;
    }

    // Calculate Orderly PnL
    if (orderlySide === 'SELL') {
      orderlyPnl = ((orderlyEnterPrice - orderlyClosePrice) - (orderlyEnterPrice * orderlyMakerFeeRate + orderlyClosePrice * orderlyTakerFeeRate)) * amount;
    } else if (orderlySide === 'BUY') {
      orderlyPnl = ((orderlyClosePrice - orderlyEnterPrice) - (orderlyEnterPrice * orderlyMakerFeeRate + orderlyClosePrice * orderlyTakerFeeRate)) * amount;
    }

    // Calculate Total PnL and determine win/loss status
    if (typeof binancePnl === 'number' && typeof orderlyPnl === 'number') {
      totalPnl = binancePnl + orderlyPnl;
      winLossStatus = totalPnl > 0 ? 'WIN' : 'LOSS';
    }
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