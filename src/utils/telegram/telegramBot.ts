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

export async function sendTelegramMessage(tokenName: string, amount: number, enterPrice: number, closePrice: number , initDifference : number) {
    const arbitrageEndTime = new Date();
    const transactionAmount =  enterPrice * amount;

    const MakerFee = enterPrice * 0.0002;
    const TakerFee = closePrice * 0.0005;

    let binancePnl : number = 0;
    if(initDifference > 0){ //양수인 경우 바이낸스 > 오덜리 -> 바이낸스 숏, 오덜리 롱
        binancePnl = ((enterPrice - closePrice) - (MakerFee + TakerFee)) * amount;
    }
    else if(initDifference < 0){ //음수인 경우 오덜리 > 바이낸스 -> 바이낸스 롱, 오덜리 숏
        binancePnl = ((closePrice - enterPrice) - (MakerFee + TakerFee)) * amount;
    }
    else{
        return;
    }
    
    const message = `
        📊 Arbitrage Event 📊
        ------------------------------------------
        Token: ${tokenName}
        Transaction Amount: ${transactionAmount} USD
        Time: ${arbitrageEndTime}
        Arbitrage Gap: ${initDifference.toFixed(8)}%
        Binance PnL: ${binancePnl.toFixed(8)}
        ------------------------------------------
        <Details>
        Enter price: ${enterPrice}
        Close prcie: ${closePrice}
    `;

bot.sendMessage(chatId, message)
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
        /reset - Cancel all orders and close all positions.
        /settoken [TOKEN] - Change the token type (e.g., /settoken BTCUSDT).
        /setquantity [QUANTITY] - Change the quantity (e.g., /setquantity 0.5).
        /setgap [GAP] - Change the arbitrage gap (e.g., /setgap 0.1).
        ---------------------------------
    `;
    bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'HTML' });
});

bot.onText(/\/reset/, async (msg) => {
    try {
        console.log('Received /reset command');
        await Promise.all(tokensArray.map(token => closeAllPositions(token)));
        await Promise.all(tokensArray.map(token => cancelAllOrders(token)));
        tokensArray.forEach(token => disconnectClients(token));
        bot.sendMessage(msg.chat.id, "All orders cancelled and positions closed.");
    } catch (error) {
        bot.sendMessage(msg.chat.id, "Error resetting orders and positions.");
        console.error('Error resetting orders and positions:', error);
    }
});
