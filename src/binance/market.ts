import { binanceSymbol, symbol } from '../utils';
import { createSignAndRequest } from './signer';

//Latest price for a symbol or symbols.
export async function getBinancePrice() {
    const endpoint = '/fapi/v1/ticker/price';
    const queryParams = {
        symbol: binanceSymbol,
        recvWindow: '5000'
    };

    const data = await createSignAndRequest(endpoint, queryParams, 'GET');
    const price = data.price;
    return parseFloat(price);
}

//Query symbol orderbook (TODO: limit 값 몇으로 설정해야할지)
export async function getBinanceOrderBook(limit: number) {
    if (![5, 10, 20, 50, 100, 500, 1000, 5000].includes(limit)) {
        throw new Error('Invalid limit value. Valid values are 5, 10, 20, 50, 100, 500, 1000, 5000.');
      }

    const endpoint = '/fapi/v1/depth';
    const queryParams = {
        symbol: binanceSymbol,
        limit: limit.toString(),
    };

    const data = await createSignAndRequest(endpoint, queryParams, 'GET');
    //const orderbook = data //데이터 가공해야함
    //return data;
}