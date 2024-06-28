import axios from "axios";
import { binanceAccountInfo, BINANCE_API_URL, binanceSymbol } from '../utils';
import { createBinanceSignature } from "./binanceCreateSign";

export async function getBinancePositions() : Promise<number | null> {
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
        console.log('Binanace Positions Data:', positions);

        if (Array.isArray(positions) && positions.length > 0) {
          const position = positions[0];
          const positionAmt = position.positionAmt;

          //console.log(`Binanace ${binanceSymbol} PositionAmt:`, parseFloat(positionAmt));
          return position;
      } else {
          console.error('No positions found in the response.');
          return null;
      }
      } catch (error) {
          console.error('Error checking position info:', error);
          return null;
      }
    }

    getBinancePositions();