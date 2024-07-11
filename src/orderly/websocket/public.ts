import WebSocket from 'ws';
import { WsPublicUrl, orderlyAccountInfo } from "../../utils/utils";

export class WebSocketManager {
  public url: string;
  public websocket: WebSocket | null;
  public subscriptions: Set<any>;
  public messageCallback: ((message: any) => void) | null;
  public pingTimer: NodeJS.Timeout | null;
  public pingInterval: number;

  constructor() {
    this.url = `${WsPublicUrl.mainnet}${orderlyAccountInfo.accountId}`;
    this.websocket = null;
    this.subscriptions = new Set();
    this.pingInterval = 10000; // Ping interval in milliseconds (10 seconds)
    this.pingTimer = null;
    this.messageCallback = null;
  }

  connect() {
    this.websocket = new WebSocket(this.url);

    this.websocket.onopen = () => {
        console.log('WebSocket connection established.');
        // Subscribe to existing subscriptions
        this.subscriptions.forEach((subscription) => {
            this.sendSubscription(subscription);
        });
        this.startPing();
    };

    this.websocket.onmessage = (event: WebSocket.MessageEvent) => {
      const message = JSON.parse(event.data.toString());
      console.log('Received message:', message);
      if (this.messageCallback) {
          this.messageCallback(message);
      }
    };

    this.websocket.onclose = (event: WebSocket.CloseEvent) => {
      console.log('WebSocket connection closed:', event.reason);
      this.stopPing();
    };

    this.websocket.onerror = (error: WebSocket.ErrorEvent) => {
        console.error('WebSocket connection error:', error.message);
    };
  }

  disconnect() {
    if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
        console.log('WebSocket connection disconnected.');
        this.stopPing();
    }
  }

  sendSubscription(subscription: any) {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          this.websocket.send(JSON.stringify(subscription));
          console.log('Sent subscription:', subscription);
          this.subscriptions.add(subscription);
      } else {
          console.warn('WebSocket connection not open. Subscription not sent.');
          this.subscriptions.add(subscription);
      }
  }


  unsubscribe(subscription: any) {
    this.subscriptions.delete(subscription);
    // Unsubscribe from the server if needed
  }

  setMessageCallback(callback: (message: any) => void) {
    this.messageCallback = callback;
  }

  startPing() {
    this.pingTimer = setInterval(() => {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({ event: 'pong' }));
            console.log('Sent ping request.');
        } else {
            console.warn('WebSocket connection not open. Ping request not sent.');
        }
    }, this.pingInterval);
  }
  
  stopPing() {
    if (this.pingTimer) {
        clearInterval(this.pingTimer);
        this.pingTimer = null;
        console.log('Stopped ping requests.');
    }
  }
}


//TEST
function initPublicWs() {
  const wsPublic = new WebSocketManager()
  return wsPublic;
}

async function main() {
  const wsClient = initPublicWs();
  
  wsClient.connect();
  
  const submessage = {
    id: `id-${Math.random().toString(36).substring(7)}`,
    topic: `PERP_TON_USDC@markprice`,
    event: "subscribe",
  };
  wsClient.sendSubscription(submessage);
  await new Promise(resolve => setTimeout(resolve, 3000));
  wsClient.disconnect();
  
}

main().catch(error => {
  console.error('Error in main function:', error);
});