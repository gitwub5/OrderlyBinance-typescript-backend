import { binanceSymbol, BINANCE_API_URL } from '../utils';
import { BinanceAccount } from '../types';
import { createBinanceSignature } from './binanceCreateSign';
import axios from 'axios';

export class placeBinanceOrder {
  private static async placeOrder(account: BinanceAccount, queryParams: Record<string, string>) {
    const timestamp = Date.now();
    queryParams.timestamp = timestamp.toString();
    queryParams.recvWindow = '5000';

    const queryString = new URLSearchParams(queryParams).toString();
    const signature = await createBinanceSignature(queryString, account.secret);
    const finalQueryString = `${queryString}&signature=${signature}`;

    try {
      const response = await axios.post(`${BINANCE_API_URL}/fapi/v1/order?${finalQueryString}`, null, {
        headers: {
          'X-MBX-APIKEY': account.apiKey,
        },
      });
      console.log('Binance Order Response:', response.data);
    } catch (error) {
      console.error('Error placing Binance order:', error);
    }
  }

  public static async limitOrder(account: BinanceAccount, side: string, price: number, amount: number) {
    const queryParams: Record<string, string> = {
      symbol: binanceSymbol,
      side: side,
      type: 'LIMIT',
      timeInForce: 'GTC',
      quantity: amount.toString(),
      price: price.toString(),
    };

    await this.placeOrder(account, queryParams);
  }

  public static async marketOrder(account: BinanceAccount, side: string, amount: number) {
    const queryParams: Record<string, string> = {
      symbol: binanceSymbol,
      side: side,
      type: 'MARKET',
      quantity: amount.toString(),
    };

    await this.placeOrder(account, queryParams);
  }
}