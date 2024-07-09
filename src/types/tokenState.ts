export class TokenState {
  private initialPriceDifference: number;
  private closePriceDifference: number;
  private enterPrice: number;
  private closePrice: number;

  constructor() {
    this.initialPriceDifference = 0;
    this.closePriceDifference = 0;
    this.enterPrice = 0;
    this.closePrice = 0;
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

  setEnterPrice(value: number) {
    this.enterPrice = value;
  }

  getEnterPrice() {
    return this.enterPrice;
  }

  setClosePrice(value: number) {
    this.closePrice = value;
  }

  getClosePrice() {
    return this.closePrice;
  }

  reset() {
    this.initialPriceDifference = 0;
    this.closePriceDifference = 0;
    this.enterPrice = 0;
    this.closePrice = 0;
  }
}