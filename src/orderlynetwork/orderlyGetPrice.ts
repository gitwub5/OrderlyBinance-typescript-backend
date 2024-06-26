import { symbol,orderlyAxios } from '../utils';

export async function getOrderlyPrice() {
    const marketData = await orderlyAxios.get(`/market/ticker?symbol=${symbol}`);
    return marketData.data.last;
}
