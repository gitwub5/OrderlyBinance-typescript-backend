import {symbol, binanceAxios } from '../utils';

export async function getBinancePrice() {
    const marketData = await binanceAxios.get(`/fapi/v1/ticker/price?symbol=${symbol.replace('/', '')}`);
    return parseFloat(marketData.data.price);
}