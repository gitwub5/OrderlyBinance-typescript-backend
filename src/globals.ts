export let shouldStop = false;
export let forceStop = false;
export let initialPriceDifference: number = 0;
export let closePriceDifference: number = 0;
export let enter_price: number = 0;
export let close_price: number = 0;

export function setShouldStop(value: boolean) {
  shouldStop = value;
}

export function setForceStop(value: boolean) {
  forceStop = value;
}
