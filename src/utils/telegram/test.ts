import { sendTelegramMessage } from './telegramBot';

// Test the function with sample data
sendTelegramMessage('BTCUSDT', 0.1, 50000, 50500, 1.0); // Positive initial difference
sendTelegramMessage('ETHUSDT', 0.5, 2000, 1950, -1.0); // Negative initial difference
sendTelegramMessage('LTCUSDT', 1, 150, 150, 0); // Zero initial difference (should not send)