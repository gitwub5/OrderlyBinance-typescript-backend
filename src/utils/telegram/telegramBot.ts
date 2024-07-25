import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { closeAllPositions, cancelAllOrders } from '../../trading/api/closePositions';
import { tokensArray } from '../../trading/stratgy';
import { selectedTokens } from '../../index';
import { disconnectClients } from '../../trading/websocket/websocketManger';

dotenv.config();

// Replace with your Telegram bot token
const botToken = process.env.TELEGRAM_TOKEN as string;
const chatId = process.env.TELEGRAM_CHAT_ID as string; // Replace with the chat ID where you want to send messages

if (!botToken || !chatId) {
    throw new Error('TELEGRAM_TOKEN and TELEGRAM_CHAT_ID must be set in your environment variables');
}

const bot = new TelegramBot(botToken, { polling: true });

bot.on('polling_error', (error) => console.log(`Polling error: ${error.message}`));

export async function sendTelegramMessage(
    tokenName: string,
    amount: number,
    binanceSide: string,
    binanceEnterPrice: number,
    binanceClosePrice: number,
    orderlySide: string,
    orderlyEnterPrice: number,
    orderlyClosePrice: number,
    initDifference: number
  ) {
    const arbitrageEndTime = new Date();
    const transactionAmount = binanceEnterPrice * amount;
  
    const binanceMakerFee = binanceEnterPrice * 0.0002;
    const binanceTakerFee = binanceClosePrice * 0.0005;
  
    const orderlyMakerFee = orderlyEnterPrice * 0.0003;
    const orderlyTakerFee = orderlyClosePrice * 0.0003;
  
    let binancePnl: string | number = 0;
    let orderlyPnl: string | number = 0;
    let totalPnl: string | number = 0;
  
    if (binanceEnterPrice === 0 || binanceClosePrice === 0 || orderlyEnterPrice === 0 || orderlyClosePrice === 0) {
        binancePnl = "Record Error";
        orderlyPnl = "Record Error";
        totalPnl = "Record Error";
      } else {
        // Calculate Binance PnL
        if (binanceSide === 'SELL') {
          binancePnl = ((binanceEnterPrice - binanceClosePrice) - (binanceMakerFee + binanceTakerFee)) * amount;
        } else if (binanceSide === 'BUY') {
          binancePnl = ((binanceClosePrice - binanceEnterPrice) - (binanceMakerFee + binanceTakerFee)) * amount;
        }
    
        // Calculate Orderly PnL
        if (orderlySide === 'SELL') {
          orderlyPnl = ((orderlyEnterPrice - orderlyClosePrice) - (orderlyMakerFee + orderlyTakerFee)) * amount;
        } else if (orderlySide === 'BUY') {
          orderlyPnl = ((orderlyClosePrice - orderlyEnterPrice) - (orderlyMakerFee + orderlyTakerFee)) * amount;
        }
    
        // Calculate Total PnL
        if (typeof binancePnl === 'number' && typeof orderlyPnl === 'number') {
          totalPnl = binancePnl + orderlyPnl;
        }
    }
  
    const message = `
    📊 <b>Arbitrage Event</b> 📊
    ---------------------------------------
    <b>Token:</b> ${tokenName}
    <b>Transaction Amount:</b> ${transactionAmount.toFixed(2)} USD
    <b>Time:</b> ${arbitrageEndTime.toLocaleString('en-GB')}
    <b>Arbitrage Gap:</b> ${initDifference.toFixed(8)}%
    <b>Binance PnL:</b> ${typeof binancePnl === 'number' ? binancePnl.toFixed(8) : binancePnl}
    <b>Orderly PnL:</b> ${typeof orderlyPnl === 'number' ? orderlyPnl.toFixed(8) : orderlyPnl}
    <b>Total PnL:</b> ${typeof totalPnl === 'number' ? totalPnl.toFixed(8) : totalPnl}
    ---------------------------------------
    <b>Details:</b>
    - <b>Binance Enter Price:</b> ${binanceEnterPrice.toFixed(4)}
    - <b>Binance Close Price:</b> ${binanceClosePrice.toFixed(4)}
    - <b>Orderly Enter Price:</b> ${orderlyEnterPrice.toFixed(4)}
    - <b>Orderly Close Price:</b> ${orderlyClosePrice.toFixed(4)}
  `;

  bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
    .then(() => console.log('Message sent successfully'))
    .catch((error) => console.error('Error sending message:', error));
}

// Log all received messages to the console
bot.on('message', (msg: TelegramBot.Message) => {
  console.log(`Received message: ${msg.text}`);
});

bot.onText(/\/start/, (msg) => {
  console.log('Received /start command');
  bot.sendMessage(msg.chat.id, "Welcome! Type 'Bot!' for help.");
});

bot.onText(/Bot!/, (msg) => {
  console.log('Received Bot! command');
  const helpMessage = `
      🤖 <b>Arbitrage Bot Help</b> 🤖
      ---------------------------------
      <b>Available Commands:</b>
      /stop - Stop the bot and close all positions.
      /restart - Restart the bot & Cancel all orders and close all positions.
      ❌/settoken [TOKEN] - Change the token type (e.g., /settoken BTCUSDT). 
      ❌/setquantity [QUANTITY] - Change the quantity (e.g., /setquantity 0.5).
      ❌/setgap [GAP] - Change the arbitrage gap (e.g., /setgap 0.1).
      ---------------------------------
  `;
  bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'HTML' });
});

bot.onText(/\/stop/, async (msg) => {
try {
    console.log('Received /stop command');
    await Promise.all(tokensArray.map(token => closeAllPositions(token)));
    await Promise.all(tokensArray.map(token => cancelAllOrders(token)));
    tokensArray.forEach(token => disconnectClients(token));
    bot.sendMessage(msg.chat.id, "Stop action: All orders cancelled and positions closed.");
} catch (error) {
    bot.sendMessage(msg.chat.id, "Error stopping bot and resetting orders and positions.");
    console.error('Error stopping bot and resetting orders and positions:', error);
}
});

bot.onText(/\/restart/, async (msg) => {
try {
  console.log('Received /restart command');
  await Promise.all(tokensArray.map(token => closeAllPositions(token)));
  await Promise.all(tokensArray.map(token => cancelAllOrders(token)));
  tokensArray.forEach(token => disconnectClients(token));
  bot.sendMessage(msg.chat.id, "All orders cancelled and positions closed. Restarting bot...");
  process.exit(1);
} catch (error) {
    bot.sendMessage(msg.chat.id, "Error restarting bot and resetting orders and positions.");
    console.error('Error restarting bot and resetting orders and positions:', error);
}
});