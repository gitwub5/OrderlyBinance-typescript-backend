import { WebSocketManager as OrderlyWs } from '../../orderly/websocket/public';
import { SocketClient as BinanceWs } from '../../binance/websocketStream/socketClient';
import { WebSocketAPIClient as BinanceAPI} from '../../binance/websocketAPI/websocektAPI';
import { deleteListenKey, getListenKey, keepListenKey } from '../../binance/websocketStream/listenKey';
import { forceStop, shouldStop } from '../../globals';
import { token } from '../../types/tokenTypes';

export const clients: Record<
  string,
  {
    orderlyClient: OrderlyWs;
    binanceUserDataStream: BinanceWs;
    binanceMarketStream: BinanceWs;
    binanceAPIws: BinanceAPI;
  }
> = {};

//한 토큰 당 세 개의 웹소켓이 연결됨
export async function initClients(token: token) {
  // Initialize Orderly WebSocket
  const orderlyClient = new OrderlyWs();
  orderlyClient.connect();

  // Initialize Binance User Data Stream WebSocket
  const listenKey = await getListenKey();
  const binanceUserDataStream = new BinanceWs(`ws/${listenKey}`);

  // Initialize Binance Market Price Stream WebSocket
  const binanceMarketStream = new BinanceWs(`ws/${token.binanceSymbol.toLowerCase()}@markPrice@1s`);

   // Initialize Binance Websocket API
   const binanceAPIws = new BinanceAPI();
   await binanceAPIws.connect();
 
  // Store the clients in the dictionary
  clients[token.binanceSymbol] = { orderlyClient, binanceUserDataStream, binanceMarketStream, binanceAPIws };

  // Keep listenKey active every hour
  setInterval(async () => {
    await keepListenKey();
  }, 60 * 60 * 1000); // 1 hour

  // Check stop condition periodically
  const checkStop = async () => {
    if (forceStop || shouldStop) {
      orderlyClient.disconnect();
      binanceUserDataStream.disconnect();
      binanceMarketStream.disconnect();
      await deleteListenKey();
    }
  };

  setInterval(checkStop, 5000); // Check every 5 seconds
}

export async function disconnectClients(token : token) {
    const { orderlyClient, binanceUserDataStream, binanceMarketStream, binanceAPIws } = clients[token.binanceSymbol];
    orderlyClient.disconnect();
    binanceUserDataStream.disconnect();
    binanceMarketStream.disconnect();
    binanceAPIws.disconnect();
    delete clients[token.binanceSymbol];
}