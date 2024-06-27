import axios from "axios";
import { binanceAccountInfo, BINANCE_API_URL, binanceSymbol } from '../utils';
import { createBinanceSignature } from "./binanceCreateSign";

export async function getBinancePositions() {
    const timestamp = Date.now();
      const endpoint = '/fapi/v2/positionRisk';
      const baseUrl = BINANCE_API_URL;
  
      const queryParams = {
          timestamp: timestamp.toString(),
          symbol: binanceSymbol,
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
        const positions = response.data;

        if (Array.isArray(positions) && positions.length > 0) {
          const position = positions[0];
          const markPrice = position.markPrice;
          console.log('User Position:', markPrice);
          return parseFloat(markPrice);
      } else {
          console.error('No positions found in the response.');
          return 0;
      }
      } catch (error) {
          console.error('Error checking position info:', error);
          return 0;
      }
  }