export class TokenState {
    public initialPriceDifference: number = 0;
    public closePriceDifference: number = 0;
    public enterPrice: number = 0;
    public closePrice: number = 0;

    setInitialPriceDifference(value: number) {
        this.initialPriceDifference = value;
    }

    setClosePriceDifference(value: number) {
        this.closePriceDifference = value;
    }

    setEnterPrice(value: number) {
        this.enterPrice = value;
    }

    setClosePrice(value: number) {
        this.closePrice = value;
    }
}