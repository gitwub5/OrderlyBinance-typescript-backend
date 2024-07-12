import WebSocket from 'ws';
import { getListenKey } from './listenKey';

interface IMessage {
  stream?: string;
  e?: string;
  [key: string]: any;
}

export class SocketClient {
  private baseUrl: string;
  private _path: string;
  private _ws: WebSocket | null;
  private _handlers: Map<string, Array<(message: IMessage) => void>>;

  constructor(path: string, baseUrl?: string) {
    this.baseUrl = baseUrl || 'wss://fstream.binance.com/';
    this._path = path;
    this._ws = null;
    this._handlers = new Map();
    this._createSocket();
  }

  private _createSocket() {
    console.log(`${this.baseUrl}${this._path}`);
    this._ws = new WebSocket(`${this.baseUrl}${this._path}`);

    this._ws.onopen = () => {
         console.log('Binance WebSocket connection established.');
    };

    this._ws.on('pong', () => {
        console.log('Binance received pong from server');
    });

    this._ws.on('ping', () => {
        console.log('Binance received ping from server');
        this._ws!.pong();
    });

    this._ws.onclose = () => {
        console.log('Binance WebSocket connection closed.');
    };

    this._ws.onerror = (err: WebSocket.ErrorEvent) => {
        console.error('Binance WebSocket connection error:', err.message);
    };

    this._ws.onmessage = (msg: WebSocket.MessageEvent) => {
      try {
        const message: IMessage = JSON.parse(msg.data.toString());
        if (this.isMultiStream(message)) {
          this._handlers.get(message.stream!)!.forEach(cb => cb(message));
        } else if (message.e && this._handlers.has(message.e)) {
          this._handlers.get(message.e)!.forEach(cb => {
            cb(message);
          });
        } else {
          console.log('Binance Unknown method', message);
        }
      } catch (e) {
        console.log('Binance Parse message failed', e);
      }
    };

    this.heartBeat();
  }

  private isMultiStream(message: IMessage): boolean {
    return !!message.stream && this._handlers.has(message.stream);
  }

  private heartBeat() {
    setInterval(() => {
      if (this._ws && this._ws.readyState === WebSocket.OPEN) {
        this._ws.ping();
        console.log("Binance ping server");
      }
    }, 60000);
  }

  public setHandler(method: string, callback: (message: IMessage) => void) {
    if (!this._handlers.has(method)) {
      this._handlers.set(method, []);
    }
    this._handlers.get(method)!.push(callback);
  }

  public disconnect() {
    if (this._ws) {
      this._ws.close();
      this._ws = null;
      console.log('Binance WebSocket connection disconnected.');
    }
  }
}

// async function main() {
//     try {
//       const listenKey = await getListenKey();
//       console.log('ListenKey received:', listenKey);
  
//       const socketClient = new SocketClient(`ws/${listenKey}`);
//       socketClient.setHandler('ORDER_TRADE_UPDATE', (params) => {
//         const orderUpdate = params.o
//         console.log('Order update:', orderUpdate);
//         console.log('Side:', orderUpdate.S);
//         console.log('Order Id:', orderUpdate.i);
//         console.log('Order Status:', orderUpdate.X);

//       });

//       const symbol = "TONUSDT"
//       const interval = '1s'
//       const endpoint =  `@markPrice@${interval}`
//       const socketClient2 = new SocketClient(`ws/${symbol.toLowerCase()}${endpoint}`);
//       socketClient2.setHandler('markPriceUpdate', (params) => {
//         const priceUpdate = params.p;
//         console.log('Mark Price Update:', parseFloat(priceUpdate));
//       });
//     } catch (error) {
//       console.error('Error in createApp:', error);
//     }
//   }
  
//   main();

  // async function main() {
  //   try {
  //       const symbol = "TONUSDT"
  //       const interval = '1s'
  //       const endpoint =  `@markPrice@${interval}`
  //       const socketApi = new SocketClient(`ws/${symbol.toLowerCase()}${endpoint}`);
  //       socketApi.setHandler('markPriceUpdate', (params) => {
  //           console.log('Mark Price Update:', JSON.stringify(params, null, 2));
  //         });
  //   } catch (error) {
  //     console.error('Error in createApp:', error);
  //   }
  // }
  
  // main();
  