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
    }, 300000);
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

// // 사용자 데이터 스트림에 연결하는 함수
// async function connectUserDataStream() {
//   try {
//     const listenKey = await getListenKey();
//     const binanceUserDataStream = new SocketClient(`ws/${listenKey}`);

//     binanceUserDataStream.setHandler('ACCOUNT_UPDATE', (message: any) => {
//       console.log('Account Update:', message);
//     });

//     binanceUserDataStream.setHandler('ORDER_TRADE_UPDATE', (message: any) => {
//       console.log('Order Trade Update:', message);
//     });

//     binanceUserDataStream.setHandler('POSITION_UPDATE', (message: any) => {
//       console.log('Position Update:', message);
//     });
//   } catch (error) {
//     console.error('Error connecting to user data stream:', error);
//   }
// }

// // 사용자 데이터 스트림 연결 시도
// connectUserDataStream();