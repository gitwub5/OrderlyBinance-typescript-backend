import { WebSocketManager as OrderlyWs } from '../../orderly/websocket/public';
import { SocketClient as BinanceWs } from '../../binance/websocketStream/socketClient';
import { deleteListenKey, getListenKey, keepListenKey } from '../../binance/websocketStream/listenKey';
import { forceStop, shouldStop } from '../../globals';
import { token } from '../../types/tokenTypes';

export const clients: Record<string, { orderlyClient: OrderlyWs; binanceClient: BinanceWs; binanceClient2: BinanceWs }> = {};

//한 토큰 당 세 개의 웹소켓이 연결된다. 
export async function initClients(token: token) {
  // Initialize Orderly WebSocket
  const orderlyClient = new OrderlyWs();
  orderlyClient.connect();

  // Initialize Binance User Data Stream WebSocket
  const listenKey = await getListenKey();
  const binanceClient = new BinanceWs(`ws/${listenKey}`);

  // Initialize Binance Market Price Stream WebSocket
  const binanceClient2 = new BinanceWs(`ws/${token.binanceSymbol.toLowerCase()}@markPrice@1s`);

  // Store the clients in the dictionary
  clients[token.binanceSymbol] = { orderlyClient, binanceClient, binanceClient2 };

  // Keep listenKey active every hour
  setInterval(async () => {
    await keepListenKey();
  }, 60 * 60 * 1000); // 1 hour

  // Check stop condition periodically
  const checkStop = async () => {
    if (forceStop || shouldStop) {
      orderlyClient.disconnect();
      binanceClient.disconnect();
      binanceClient2.disconnect();
      await deleteListenKey();
    }
  };

  setInterval(checkStop, 5000); // Check every 5 seconds
}

export async function disconnectClients(token : token) {
    const { orderlyClient, binanceClient, binanceClient2 } = clients[token.binanceSymbol];
    orderlyClient.disconnect();
    binanceClient.disconnect();
    binanceClient2.disconnect();
    delete clients[token.binanceSymbol];
}