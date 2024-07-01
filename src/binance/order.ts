import { binanceSymbol, BINANCE_API_URL, binanceAccountInfo } from '../utils';
import { createBinanceSignature } from './signer';
import axios from 'axios';

export class placeBinanceOrder {
  private static async placeOrder(queryParams: Record<string, string>) {
    const timestamp = Date.now();
    queryParams.timestamp = timestamp.toString();
    queryParams.recvWindow = '5000';

    const queryString = new URLSearchParams(queryParams).toString();
    const signature = await createBinanceSignature(queryString, binanceAccountInfo.secret);
    const finalQueryString = `${queryString}&signature=${signature}`;

    try {
      const response = await axios.post(`${BINANCE_API_URL}/fapi/v1/order?${finalQueryString}`, null, {
        headers: {
          'X-MBX-APIKEY': binanceAccountInfo.apiKey,
        },
      });
      //console.log('Binance Order Response:', response.data);
    } catch (error) {
      console.error('Error placing Binance order:', error);
    }
  }

  public static async limitOrder(side: string, price: number, amount: number) {
    const queryParams: Record<string, string> = {
      symbol: binanceSymbol,
      side: side,
      type: 'LIMIT',
      timeInForce: 'GTC',
      quantity: amount.toString(),
      price: price.toString(),
    };

    await this.placeOrder(queryParams);
  }

  public static async marketOrder( side: string, amount: number) {
    const queryParams: Record<string, string> = {
      symbol: binanceSymbol,
      side: side,
      type: 'MARKET',
      quantity: amount.toString(),
    };

    await this.placeOrder(queryParams);
  }
}

//TODO: cancel order 추가