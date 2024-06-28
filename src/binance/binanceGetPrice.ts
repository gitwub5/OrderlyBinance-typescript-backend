import {symbol, binanceAxios, binanceSymbol } from '../utils';

export async function getBinancePrice() {
    const marketData = await binanceAxios.get(`/fapi/v1/ticker/price?symbol=${symbol.replace('/', '')}`);
    const price = marketData.data.price;

    console.log(`Binance ${binanceSymbol} price: `,price);
    return parseFloat(price);
}

//getBinancePrice();