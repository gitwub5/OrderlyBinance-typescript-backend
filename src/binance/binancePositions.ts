import axios from "axios";
import { binanceAccountInfo, BINANCE_API_URL, binanceSymbol } from '../utils';
import { createBinanceSignature } from "./binanceCreateSign";
import { BinancePosition } from './binanceTypes';

// 현재 포지션의 데이터를 반환해줌
export async function getBinancePositions(): Promise<BinancePosition | null> {
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
    console.log(positions);

    if (Array.isArray(positions) && positions.length > 0) {
      const position = positions[0] as BinancePosition;
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


getBinancePositions().then(position => {
  if (position) {
    console.log('Binance Position:', position);
  } else {
    console.log('No position data available.');
  }
});