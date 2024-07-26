import WebSocket from 'ws';
import { BINANCE_WS_URL, binanceAccountInfo } from '../../utils/utils';
import { createSignature } from '../../binance/api/signer';

export class WebSocketAPIClient {
  private baseUrl: string;
  private ws: WebSocket | null;
  public messageCallback: ((message: any) => void) | null;
  private handlers: Map<string, Array<(message: any) => void>>;
  private reconnectInterval: number;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || BINANCE_WS_URL;
    this.ws = null;
    this.messageCallback = null;
    this.handlers = new Map();
    this.reconnectInterval = 10000; // 10 seconds
  }

  async connect() {
    this.ws = new WebSocket(BINANCE_WS_URL);

    this.ws.on('open', () => {
      console.log('Binance API WebSocket connection established.');
      this.heartBeat();
    });

    this.ws.on('pong', () => {
      console.log('Binance received pong from server');
      // Reset reconnect interval
      this.reconnectInterval = 10000;
    });

    this.ws.on('ping', (data) => {
      console.log('Binance received ping from server');
      if (this.ws) {
        this.ws.pong(data); // Send pong with the same payload as the ping frame
        console.log('Sent pong back to server');
      }
    });

    this.ws.on('close', () => {
      console.log('Binance WebSocket connection closed.');
      this.reconnect();
    });

    this.ws.on('error', (err: WebSocket.ErrorEvent) => {
      console.error('Binance WebSocket connection error:', err.message);
      this.reconnect();
    });

    this.ws.on('message', (message: any) => {
      const data = JSON.parse(message.toString());
      // console.log('Received message:', data);
      if (this.messageCallback) {
        this.messageCallback(data);
      }
    });
  }

  private heartBeat() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.ping();
      console.log('Binance ping server');
      setTimeout(() => this.heartBeat(), 180000); // Ping every 3 minutes
    }
  }

  private reconnect() {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws = null;
    }
    setTimeout(() => {
      console.log('Reconnecting to Binance WebSocket...');
      this.connect();
    }, this.reconnectInterval);

    // Exponential backoff for reconnection attempts
    this.reconnectInterval = Math.min(this.reconnectInterval * 2, 60000); // Max 1 minute
  }

  async setMessageCallback(callback: (message: any) => void) {
    this.messageCallback = callback;
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        //console.log(data);
        this.ws.send(JSON.stringify(data));
    } else {
        console.error('WebSocket connection is not open.');
    }
  }

  async placeOrder(symbol: string,  price: number | null , quantity: number, side: 'BUY' | 'SELL', type: 'LIMIT' | 'MARKET') {
    const params: any = {
      apiKey: binanceAccountInfo.apiKey,
      positionSide: "BOTH",
      quantity: quantity,
      side: side,
      symbol: symbol,
      timestamp: Date.now().toString(),
      type: type,
      recvWindow: 5000,
    };
  
    if (type === 'LIMIT' && price !== null) {
      params.price = price;
      params.timeInForce = 'GTC';
    }  
  
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    const signature = await createSignature(sortedParams, binanceAccountInfo.secret);
  
    const request = {
      id: 'id-placeOrder',
      method: 'order.place',
      params: {
        ...params,
        signature: signature
      },
    };
  
    //console.log('Placing order with request:', request); 
  
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

  async positionInfo(symbol: string){
    const params = {
        apiKey: binanceAccountInfo.apiKey,
        symbol: symbol,
        timestamp: Date.now().toString()
    };

    // Generate the signature
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${(params as any)[key]}`)
      .join('&');
    const signature = await createSignature(sortedParams, binanceAccountInfo.secret);

    // Add the signature to the params
    const request = {
      id: 'id-positionInformation',
      method: "account.position",
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
      console.log('Binance API WebSocket connection disconnected.');
    }
  }
}


// async function main() {
//   const newClient = new WebSocketAPIClient();

//   await newClient.connect();

//   // Define the callback function to process incoming messages
//   const handleMessage = (message: any) => {
//     if (message.id === 'id-positionInformation') {
//       console.log('Position Information:', parseFloat(message.result[0].positionAmt));
//     } else {
//       console.log('Other Message:', message);
//     }
//   };
 

//   newClient.setMessageCallback(handleMessage);

//   // // Assign the callback function to the messageCallback property
  
//   setTimeout(async() => {
//     newClient.placeOrder('TONUSDT', null , 2, 'BUY', 'MARKET');
//   }, 1000);

//   // // Use setInterval to send a request every second
//   // setInterval(async () => {
//   //   await newClient.positionInfo("TONUSDT");
//   // }, 1000); // Sends the request every 1000 milliseconds (1 second)
// }

// main();