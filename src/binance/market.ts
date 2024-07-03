import { binanceSymbol, symbol } from '../utils/utils';
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

//Query symbol orderbook (TODO: limit 값 몇으로 설정해야할지 수정필요)
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

//TODO: 과거 가격 불러오는 함수 구현
//나중에 가격갭찾을때 한달이나 일주일 과거 가격 불러와서 비교해서 찾기