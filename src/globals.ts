export let shouldStop = false;
export let forceStop = false;

export function setShouldStop(value: boolean) {
  shouldStop = value;
}

export function setForceStop(value: boolean) {
  forceStop = value;
}

export let initialPriceDifference: number = 0;

export function setInitialPriceDifference(value: number) {
  initialPriceDifference = value;
}

export let closePriceDifference: number = 0;

export function setClosePriceDifference(value: number) {
  initialPriceDifference = value;
}

export let buy_price: number = 0;

export function setBuyPrice(value: number) {
  buy_price = value;
}

export let sell_price: number = 0;

export function setSellPrice(value: number) {
  sell_price = value;
}
