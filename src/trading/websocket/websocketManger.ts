import { WebSocketManager as OrderlyPublicWs } from '../../orderly/websocket/public';
import { WebSocketManager as OrderlyPrivateWs } from '../../orderly/websocket/private';
import { SocketClient as BinanceWs } from '../../binance/websocketStream/socketClient';
import { WebSocketAPIClient as BinanceAPI} from '../../binance/websocketAPI/websocektAPI';
import { deleteListenKey, getListenKey, keepListenKey } from '../../binance/websocketStream/listenKey';
import { forceStop, shouldStop } from '../../globals';
import { Token } from '../../types/tokenTypes';

export const clients: Record<
  string,
  {
    orderlyPublic: OrderlyPublicWs;
    orderlyPrivate: OrderlyPrivateWs;
    binanceUserDataStream: BinanceWs;
    binanceMarketStream: BinanceWs;
    binanceAPIws: BinanceAPI;
  }
> = {};

//한 토큰 당 5개의 웹소켓이 연결됨
export async function initClients(token: Token) {
  // Initialize Orderly Public WebSocket
  const orderlyPublic = new OrderlyPublicWs();
  orderlyPublic.connect();

  // Initialize Orderly Private WebSocket
  const orderlyPrivate = new OrderlyPrivateWs();
  orderlyPrivate.connectPrivate();

  // Initialize Binance User Data Stream WebSocket
  const listenKey = await getListenKey();
  const binanceUserDataStream = new BinanceWs(`ws/${listenKey}`);

  // Initialize Binance Market Price Stream WebSocket
  const binanceMarketStream = new BinanceWs(`ws/${token.binanceSymbol.toLowerCase()}@markPrice@1s`);

   // Initialize Binance Websocket API
   const binanceAPIws = new BinanceAPI();
   await binanceAPIws.connect();
 
  // Store the clients in the dictionary
  clients[token.symbol] = { orderlyPublic, orderlyPrivate, binanceUserDataStream, binanceMarketStream, binanceAPIws };

  // Keep listenKey active every hour
  setInterval(async () => {
    await keepListenKey();
  }, 30 * 60 * 1000); // 30 min

  // Check stop condition periodically
  const checkStop = async () => {
    if (forceStop || shouldStop) {
      orderlyPublic.disconnect();
      orderlyPrivate.disconnectPrivate();
      binanceUserDataStream.disconnect();
      binanceMarketStream.disconnect();
      await deleteListenKey();
    }
  };

  setInterval(checkStop, 5000); // Check every 5 seconds
}

export async function disconnectClients(token : Token) {
    const { orderlyPublic, orderlyPrivate, binanceUserDataStream, binanceMarketStream, binanceAPIws } = clients[token.symbol];
    orderlyPublic.disconnect();
    orderlyPrivate.disconnectPrivate();
    binanceUserDataStream.disconnect();
    binanceMarketStream.disconnect();
    binanceAPIws.disconnect();
    delete clients[token.symbol];
}