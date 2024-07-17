import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

// Replace with your Telegram bot token
const botToken = process.env.TELEGRAM_TOKEN as string;
const chatId = process.env.TELEGRAM_CHAT_ID as string; // Replace with the chat ID where you want to send messages

if (!botToken || !chatId) {
    throw new Error('TELEGRAM_TOKEN and TELEGRAM_CHAT_ID must be set in your environment variables');
}

const bot = new TelegramBot(botToken, { polling: true });

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
        📊 <b>Arbitrage Event</b> 📊
        ---------------------------------
        <b>Token:</b> ${tokenName}
        <b>Transaction Amount:</b> ${transactionAmount}
        <b>Time:</b> ${arbitrageEndTime.toISOString()}
        <b>Arbitrage Gap:</b> ${initDifference.toFixed(8)}%
        <b>Binance PnL:</b> ${binancePnl.toFixed(8)}
        ---------------------------------


        <test>
        enter price: ${enterPrice}
        close prcie: ${closePrice}
    `;

  bot.sendMessage(chatId, message)
    .then(() => console.log('Message sent successfully'))
    .catch((error) => console.error('Error sending message:', error));
}
