import WebSocket from 'ws';

export abstract class WebSocketStreamBase {
  private ws: WebSocket | null = null;
  private messageCallback: ((data: any) => void) | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(protected symbol: string, private endpoint: string) {
    this.connect(endpoint);
  }

  private connect(endpoint: string) {
    const url = `wss://fstream.binance.com/ws/${this.symbol.toLowerCase()}${endpoint}`;
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      console.log('WebSocket connection opened.');
    });

    this.ws.on('message', (data: string) => {
      const parsedData = JSON.parse(data);
      if (this.messageCallback) {
        this.messageCallback(parsedData);
      }
      this.handleMessage(parsedData);
    });

    this.ws.on('close', () => {
      console.warn('WebSocket connection closed. Reconnecting...');
      setTimeout(() => this.connect(endpoint), 1000);
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.ws?.close();
    });

    this.ws.on('pong', () => {
      //console.log('Received pong from server');
    });

    this.ws.on('ping', () => {
      //console.log('Received ping from server');
      this.ws?.pong();
    });

    this.startHeartBeat();
  }

  private startHeartBeat() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
        //console.log('Ping server');
      }
    }, 5000);
  }

  private stopHeartBeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      //console.log('Ping stopped');
    }
  }

  protected abstract handleMessage(data: any): void;

  setMessageCallback(callback: (data: any) => void) {
    this.messageCallback = callback;
  }

  stop() {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.stopHeartBeat();
      this.ws.close();
      this.ws = null;
      console.log('WebSocket connection stopped.');
    }
  }
}