import WebSocket from 'ws';
import { WsPrivateUrl, orderlyAccountInfo } from '../../utils/utils';
import { Buffer } from 'buffer';
import { KeyPair } from 'near-api-js';

export const getOrderlyKeyPair = async (orderlyKeyPrivateKey: string): Promise<KeyPair> => {
    console.log('private key', orderlyKeyPrivateKey);
    return KeyPair.fromString(orderlyKeyPrivateKey);
};

export const signPostRequestByOrderlyKey = (keyPair : KeyPair , messageString: Uint8Array): string => {
    const u8 = Buffer.from(messageString);
  const signStr = keyPair.sign(u8);
  return Buffer.from(signStr.signature).toString('base64');
};

export class WebSocketManager {
    private privateUrl: string;
    private privateWebsocket: any;
    private privateSubscriptions: Set<any>;
    private messageCallbackPrivate: ((message: any) => void) | null;
    private pingInterval: number;
    private pingTimerPrivate: NodeJS.Timeout | null;

    constructor() {
      this.privateUrl = `${WsPrivateUrl.mainnet}${orderlyAccountInfo.accountId}`;
      this.privateWebsocket = null;
      this.privateSubscriptions = new Set();
      this.pingInterval = 10000; // Ping interval in milliseconds (10 seconds)
      this.pingTimerPrivate = null;
      this.messageCallbackPrivate = null;
    }

    connectPrivate() {
      this.privateWebsocket = new WebSocket(this.privateUrl);

      this.privateWebsocket.onopen = async () => {
        console.log('WebSocket connection established.');
        // Subscribe to existing subscriptions
        this.privateSubscriptions.forEach((subscription: any) => {
          this.sendPrivateSubscription(subscription);
        });

        const timestamp = new Date().getTime().toString();
        const messageStr = [
            timestamp,
          ].join('');

        const messageBytes = new TextEncoder().encode(messageStr);
        const keyPair = await getOrderlyKeyPair(orderlyAccountInfo.privateKeyBase58);
        const orderlySign = signPostRequestByOrderlyKey(keyPair, messageBytes);

        const payload = {
          "id":"123r",
          "event":"auth",
          "params":{
              "orderly_key": orderlyAccountInfo.orderlyKey,
              "sign": orderlySign,
              "timestamp": timestamp
          }
        };

        this.privateWebsocket?.send(JSON.stringify(payload));
        
        this.startPingPrivate();

        this.privateWebsocket.onmessage = (event: WebSocket.MessageEvent) => {
            const message = JSON.parse(event.data.toString());
            console.log('Received message:', message);
            if (this.messageCallbackPrivate) {
              this.messageCallbackPrivate(message);
            }
        };
    
        this.privateWebsocket.onclose = (event: WebSocket.CloseEvent) => {
            console.log('WebSocket private connection closed: ',  event.reason);
            this.stopPingPrivate();
        };
    
        this.privateWebsocket.onerror = (error: WebSocket.ErrorEvent) => {
            console.error('WebSocket private connection error:', error.message);
        };
      };
    }

    disconnectPrivate() {
      if (this.privateWebsocket) {
        this.privateWebsocket.close();
        this.privateWebsocket = null;
        console.log('WebSocket private connection disconnected.');
        this.stopPingPrivate();
      }
    }

    sendPrivateSubscription(subscription: any) {
        if (this.privateWebsocket && this.privateWebsocket.readyState === WebSocket.OPEN) {
        this.privateWebsocket.send(JSON.stringify(subscription));
        console.log('Sent subscription private:', subscription);
        this.privateSubscriptions.add(subscription);
        } else {
        console.warn('Private WebSocket connection not open. Subscription not sent.');
        this.privateSubscriptions.add(subscription);
        }
    }

    unsubscribePrivate(subscription: any) {
      this.privateSubscriptions.delete(subscription);
      // Unsubscribe from the server if needed
    }
  
    setPrivateMessageCallback(callback: any) {
      this.messageCallbackPrivate = callback;
    }

    startPingPrivate() {
        this.pingTimerPrivate = setInterval(() => {
          if (this.privateWebsocket && this.privateWebsocket.readyState === WebSocket.OPEN) {
            this.privateWebsocket.send(JSON.stringify({ event: 'pong' }));
            console.log('Sent private ping request.');
          } else {
            console.warn('Private WebSocket connection not open. Ping request not sent.');
          }
        }, this.pingInterval);
    }
    
    stopPingPrivate() {
        if (this.pingTimerPrivate) {
          clearInterval(this.pingTimerPrivate);
          this.pingTimerPrivate = null;
          console.log('Stopped private ping requests.');
        }
    }
  }

  function initPrivateWs() {
    const wsPrivate = new WebSocketManager()
    return wsPrivate;
  }

  async function main() {
    const privateClient = initPrivateWs();
    
    privateClient.connectPrivate();
    
    const submessage = {
      id: `id-${Math.random().toString(36).substring(7)}`,
      topic: "executionreport",
      event: "subscribe",
    };

    //구독이 제대로 안됨.
    privateClient.sendPrivateSubscription(submessage);
  }
  
  main().catch(error => {
    console.error('Error in main function:', error);
  });
  