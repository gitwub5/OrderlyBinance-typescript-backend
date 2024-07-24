export class TokenState {
  private initialPriceDifference: number;
  private closePriceDifference: number;
  private binanceSide: string;
  private binanceEnterPrice: number;
  private binanceClosePrice: number;
  private orderlySide: string;
  private orderlyEnterPrice: number;
  private orderlyClosePrice: number;

  constructor() {
    this.initialPriceDifference = 0;
    this.closePriceDifference = 0;
    this.binanceSide = '';
    this.binanceEnterPrice = 0;
    this.binanceClosePrice = 0;
    this.orderlySide = '';
    this.orderlyEnterPrice = 0;
    this.orderlyClosePrice = 0;
  }

  setInitialPriceDifference(value: number) {
    this.initialPriceDifference = value;
  }

  getInitialPriceDifference() {
    return this.initialPriceDifference;
  }

  setClosePriceDifference(value: number) {
    this.closePriceDifference = value;
  }

  getClosePriceDifference() {
    return this.closePriceDifference;
  }

  setBinanceSide(value: string) {
    this.binanceSide = value;
  }

  getBinanceSide() {
    return this.binanceSide;
  }

  setBinanceEnterPrice(value: number) {
    this.binanceEnterPrice = value;
  }

  getBinanceEnterPrice() {
    return this.binanceEnterPrice;
  }

  setBinanceClosePrice(value: number) {
    this.binanceClosePrice = value;
  }

  getBinanceClosePrice() {
    return this.binanceClosePrice;
  }

  setOrderlySide(value: string) {
    this.orderlySide = value;
  }

  getOrderlySide() {
    return this.orderlySide;
  }

  setOrderlyEnterPrice(value: number) {
    this.orderlyEnterPrice = value;
  }

  getOrderlyEnterPrice() {
    return this.orderlyEnterPrice;
  }

  setOrderlyClosePrice(value: number) {
    this.orderlyClosePrice = value;
  }

  getOrderlyClosePrice() {
    return this.orderlyClosePrice;
  }

  reset() {
    this.initialPriceDifference = 0;
    this.closePriceDifference = 0;
    this.binanceSide = '';
    this.binanceEnterPrice = 0;
    this.binanceClosePrice = 0;
    this.orderlySide = '';
    this.orderlyEnterPrice = 0;
    this.orderlyClosePrice = 0;
  }
}