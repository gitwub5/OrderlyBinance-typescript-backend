import WebSocket from 'ws';
import { orderlyAccountInfo, WS_PUBLIC_URL } from '../../utils/utils';

export abstract class WebSocketStreamBase {
  private ws: WebSocket | null = null;
  protected messageCallback: ((data: any) => void) | null = null;
  private pingInterval: number = 10000; // Ping interval in milliseconds
  private pingTimer: NodeJS.Timeout | null = null;
  protected shouldStop = false;

  constructor(private subscription: string) {
    const account_id = orderlyAccountInfo.accountId;
    const url = `${WS_PUBLIC_URL}${account_id}`;
    this.connect(url);
  }

  protected connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      if (this.shouldStop) {
        this.ws?.close();
        return;
      }
      console.log('WebSocket connection established.');
      this.sendSubscription(this.subscription);
      this.startPing();
    });


    this.ws.on('message', (data: WebSocket.Data) => {
      const message = JSON.parse(data.toString());
      if (message.event === 'ping') {
        this.ws?.pong();
        return; // ping 이벤트는 별도로 처리하고 로그에 출력하지 않음
      }
      if (this.messageCallback) {
        this.messageCallback(message);
      }
      this.handleMessage(message);
    });

    this.ws.on('close', () => {
      if (this.shouldStop) return;
      console.warn('WebSocket connection closed. Reconnecting...');
      this.stopPing();
      setTimeout(() => this.connect(url), 1000);
    });
  }

  private startPing() {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
        //console.log('Ping server');
      }
    }, this.pingInterval);
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
      //console.log('Stopped ping requests.');
    }
  }

   sendSubscription(subscription: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(subscription);
      console.log('Sent subscription:', subscription);
    } else {
      console.warn('WebSocket connection not open. Subscription not sent.');
    }
  }

  unsubscribe(subscription: string) {
    // Unsubscribe from the server if needed
  }

  setMessageCallback(callback: (data: any) => void) {
    this.messageCallback = callback;
  }

  stop() {
    this.shouldStop = true;
    this.ws?.removeAllListeners();
    this.ws?.close();
    this.stopPing();
    this.ws = null;
    console.log('WebSocket connection stopped.');
  }

  protected abstract handleMessage(data: any): void;
}