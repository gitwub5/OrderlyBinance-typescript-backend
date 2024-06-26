import axios from "axios";
import { binanceAccountInfo, BINANCE_API_URL } from '../utils';
import { createBinanceSignature } from "./binanceCreateSign";

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

        //Quesetion: USDT 가져와야하는지 USDC 가져와야하는지??
        const usdtInfo = response.data.find((account: any) => account.asset === 'USDT');
        console.log('USDT Balance:', usdtInfo.balance);
        return parseFloat(usdtInfo.balance);
      } catch (error) {
          console.error('Error checking account info:', error);
          return 0;
      }
  }