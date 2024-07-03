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