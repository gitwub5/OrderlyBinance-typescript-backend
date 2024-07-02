import axios from "axios";
import { binanceAccountInfo, BINANCE_API_URL, symbol, binanceSymbol } from '../utils';
import { createBinanceSignature } from "./signer";
import { BinanceBalance } from "./types";

//API Description: Query account balance info
export async function getBinanceBalance() {
    const timestamp = Date.now();
      const endpoint = '/fapi/v2/balance';
      const baseUrl = BINANCE_API_URL;
  
      const queryParams = {
          timestamp: timestamp.toString(),
          recvWindow: '5000'
      };
  
      const queryString = new URLSearchParams(queryParams).toString();
      const signature = await createBinanceSignature(queryString, binanceAccountInfo.secret);
      const finalQueryString = `${queryString}&signature=${signature}`;
  
      try {
        const response = await axios.get(`${baseUrl}${endpoint}?${finalQueryString}`, {
            headers: {
                'X-MBX-APIKEY': binanceAccountInfo.apiKey,
            },
        });

        const balance = response.data.find((account: any) => account.asset === 'USDT') as BinanceBalance;
        //console.log('Binance USDT Balance:', balance);
        return balance;
      } catch (error) {
          console.error('Error checking account info:', error);
          return null;
      }
  }

  //getBinanceBalance();


  //Get all open orders on a symbol.
  export async function getBinanceOpenOrders() {
    const timestamp = Date.now();
      const endpoint = '/fapi/v1/openOrders';
      const baseUrl = BINANCE_API_URL;
  
      const queryParams: Record<string, string> = {
        symbol: binanceSymbol,
        recvWindow: '5000',
        timestamp: timestamp.toString(),
      };
  
      const queryString = new URLSearchParams(queryParams).toString();
      const signature = await createBinanceSignature(queryString, binanceAccountInfo.secret);
      const finalQueryString = `${queryString}&signature=${signature}`;
  
      try {
        const response = await axios.get(`${baseUrl}${endpoint}?${finalQueryString}`, {
            headers: {
                'X-MBX-APIKEY': binanceAccountInfo.apiKey,
            },
        });

        const openOrders = response.data;
        const orderIds = openOrders.map((order: any) => order.orderId);
        //console.log('Binance Open Orders:', orderIds);
        return orderIds;
      } catch (error) {
          console.error('Error:', error);
          return null;
      }
  }