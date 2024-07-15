import WebSocket from 'ws';
import { BINANCE_WS_URL, binanceAccountInfo } from '../../utils/utils';
import { createSignature } from '../../binance/api/signer';

export class WebSocketAPIClient {
  private baseUrl: string;
  private ws: WebSocket | null;
  private handlers: Map<string, Array<(message: any) => void>>;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || BINANCE_WS_URL;
    this.ws = null;
    this.handlers = new Map();
  }

  async connect() {
    this.ws = new WebSocket(BINANCE_WS_URL);

    this.ws.on('open', () => {
      console.log('Binance API WebSocket connection established.');
    });

    this.ws.on('pong', () => {
      console.log('Binance received pong from server');
    });

    this.ws.on('ping', (data) => {
      console.log('Binance received ping from server');
      this.ws!.pong(data); // Send pong with the same payload as the ping frame
    });

    this.ws.on('close', () => {
      console.log('Binance WebSocket connection closed.');
    });

    this.ws.on('error', (err: WebSocket.ErrorEvent) => {
      console.error('Binance WebSocket connection error:', err.message);
    });

    this.ws.on('message', (message: any) => {
      const data = JSON.parse(message.toString());
      //console.log('Received message:', data);
    });

    this.heartBeat();
  }

  heartBeat() {
    setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
        console.log('Binance ping server');
      }
    }, 300000);
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        //console.log(data);
        this.ws.send(JSON.stringify(data));
    } else {
        console.error('WebSocket connection is not open.');
    }
  }

  async placeOrder(symbol: string, price: number, quantity: number, side: 'BUY' | 'SELL', type: 'LIMIT' | 'MARKET') {
    const params = {
        apiKey: binanceAccountInfo.apiKey,
        positionSide: "BOTH",
        price: price,
        quantity: quantity,
        side: side,
        symbol: symbol,
        timeInForce: 'GTC',
        timestamp: Date.now().toString(),
        type: type,
        recvWindow: 5000,
    };

    // Generate the signature
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${(params as any)[key]}`)
      .join('&');
    const signature = await createSignature(sortedParams, binanceAccountInfo.secret);

    // Add the signature to the params
    const request = {
      id: 'id-placeOrder',
      method: 'order.place',
      params: {
        ...params,
        signature: signature
      },
    };

    this.send(request);
  }

  // Uncommented methods for modifyOrder, cancelOrder, and queryOrder
  async modifyOrder(symbol: string, orderId: number, price: number, quantity: number, side: 'BUY' | 'SELL') {
    const params = {
        apiKey: binanceAccountInfo.apiKey,
        orderId: orderId,
        price: price,
        quantity: quantity,
        side: side,
        symbol: symbol,
        timeInForce: 'GTC',
        timestamp: Date.now().toString(),
        recvWindow: 5000
    };

    // Generate the signature
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${(params as any)[key]}`)
      .join('&');
    const signature = await createSignature(sortedParams, binanceAccountInfo.secret);

    // Add the signature to the params
    const request = {
      id: 'id-modifyOrder',
      method: 'order.modify',
      params: {
        ...params,
        signature: signature
      },
    };

    this.send(request);
  }

  async cancelOrder(symbol: string, orderId: number) {
    const params = {
        apiKey: binanceAccountInfo.apiKey,
        orderId: orderId,
        symbol: symbol,
        timestamp: Date.now().toString(),
        recvWindow: 5000
    };

    // Generate the signature
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${(params as any)[key]}`)
      .join('&');
    const signature = await createSignature(sortedParams, binanceAccountInfo.secret);

    // Add the signature to the params
    const request = {
      id: 'id-cancelOrder',
      method: 'order.cancel',
      params: {
        ...params,
        signature: signature
      },
    };

    this.send(request);
  }

  async queryOrder(symbol: string, orderId: number) {
    const params = {
        apiKey: binanceAccountInfo.apiKey,
        orderId: orderId,
        symbol: symbol,
        timestamp: Date.now().toString(),
        recvWindow: 5000
    };

    // Generate the signature
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${(params as any)[key]}`)
      .join('&');
    const signature = await createSignature(sortedParams, binanceAccountInfo.secret);

    // Add the signature to the params
    const request = {
      id: 'id-queryOrder',
      method: 'order.status',
      params: {
        ...params,
        signature: signature
      },
    };

    this.send(request);
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      console.log('Binance WebSocket connection disconnected.');
    }
  }
}



// // Main function to test the WebSocketAPIClient
// async function main() {
//   const newClient = new WebSocketAPIClient();
//   await newClient.connect();
//   setTimeout(async () => {
//     await newClient.placeOrder("TONUSDT", 6.6, 2, 'BUY', "LIMIT");
//   }, 1000); // Adjust the timeout as necessary
// }

// main();