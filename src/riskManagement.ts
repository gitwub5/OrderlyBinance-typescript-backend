import axios from 'axios';
import { orderlyAccountInfo, binanceAccountInfo, symbol, orderSize, 
  orderlyAxios, binanceAxios, ORDERLY_API_URL
} from './utils';
import { placeOrder as placeOrderlyOrder } from './orderlynetwork/orderlyOrders';
import { signAndSendRequest } from './orderlynetwork/orderlySignRequest'
import { createBinanceSignature } from './binance/binanceCreateSign';
import { placeOrder as placeBinanceOrder } from './binance/binanceOrders';
import { BinanceAccount, OrderlyAccount, BinanceBalance } from './types';

async function getOrderlyPositions() {
  const res = await signAndSendRequest(
    orderlyAccountInfo.accountId,
    orderlyAccountInfo.apiKey,
    `${ORDERLY_API_URL}/v1/client/holding`
  );
  const json = await res.json();
  console.log('getClientHolding:', JSON.stringify(json, undefined, 2));
}

async function getBinancePositions() {
  const timestamp = Date.now();
    const endpoint = '/fapi/v2/balance';
    const baseUrl = 'https://fapi.binance.com';

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
        if (usdtInfo) {
            console.log('USDT Balance:', usdtInfo.balance);
            return usdtInfo.balance;
        } else {
            console.log('USDT Balance: Not found');
        }
    } catch (error) {
        console.error('Error checking account info:', error);
    }
}

async function adjustPosition(account: BinanceAccount | OrderlyAccount, position : number, targetPosition : number , isOrderly : boolean) {
  const marketData = isOrderly 
    ? await orderlyAxios.get(`/market/ticker?symbol=${symbol}`) 
    : await binanceAxios.get(`/fapi/v1/ticker/price?symbol=${symbol.replace('/', '')}`);
  const currentPrice = isOrderly ? marketData.data.last : parseFloat(marketData.data.price);

  if (position > targetPosition) {
      if (isOrderly) {
        await placeOrderlyOrder(account as OrderlyAccount, 'SELL', currentPrice, position - targetPosition);
      } else {
        await placeBinanceOrder(account as BinanceAccount, 'SELL', currentPrice, position - targetPosition);
      }
    } else if (position < targetPosition) {
      if (isOrderly) {
        await placeOrderlyOrder(account as OrderlyAccount, 'BUY', currentPrice, targetPosition - position);
      } else {
        await placeBinanceOrder(account as BinanceAccount, 'BUY', currentPrice, targetPosition - position);
    }
  }
}

export async function manageRisk() {
  const orderlyPosition = await getOrderlyPositions();
  const binancePosition = await getBinancePositions();
  const totalPosition = orderlyPosition - binancePosition;

  const targetPosition = orderSize * 5;

  if (totalPosition > targetPosition) {
    await adjustPosition(binanceAccountInfo, binancePosition, binancePosition + (totalPosition - targetPosition) / 2, false);
  } else if (totalPosition < -targetPosition) {
    await adjustPosition(orderlyAccountInfo, orderlyPosition, orderlyPosition - (targetPosition + totalPosition) / 2, true);
  }
}
