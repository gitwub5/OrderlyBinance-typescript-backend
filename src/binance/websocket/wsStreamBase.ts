import WebSocket from 'ws';

abstract class WebSocketStreamBase {
  private ws: WebSocket | null = null;
  private messageCallback: ((data: any) => void) | null = null;

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
      console.log('Received pong from server');
    });

    this.ws.on('ping', () => {
      console.log('Received ping from server');
      this.ws?.pong();
    });

    this.heartBeat();
  }

  protected abstract handleMessage(data: any): void;

  private heartBeat() {
    setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
        console.log('Ping server');
      }
    }, 5000);
  }

  setMessageCallback(callback: (data: any) => void) {
    this.messageCallback = callback;
  }
}

export default WebSocketStreamBase;