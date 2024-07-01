import axios from "axios";
import { binanceAccountInfo, BINANCE_API_URL } from '../utils';
import { createBinanceSignature } from "./binanceCreateSign";
import { BinanceBalance } from "./binanceTypes";

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
          return 0;
      }
  }

  //getBinanceBalance();