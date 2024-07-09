import { TokenState } from '../src/types/tokenState';

describe('TokenState', () => {
  let tokenState: TokenState;

  beforeEach(() => {
    tokenState = new TokenState();
  });

  test('should set and get initialPriceDifference', () => {
    tokenState.setInitialPriceDifference(1.5);
    expect(tokenState.getInitialPriceDifference()).toBe(1.5);
  });

  test('should set and get closePriceDifference', () => {
    tokenState.setClosePriceDifference(2.5);
    expect(tokenState.getClosePriceDifference()).toBe(2.5);
  });

  test('should set and get enterPrice', () => {
    tokenState.setEnterPrice(100);
    expect(tokenState.getEnterPrice()).toBe(100);
  });

  test('should set and get closePrice', () => {
    tokenState.setClosePrice(110);
    expect(tokenState.getClosePrice()).toBe(110);
  });

  test('should reset all values', () => {
    tokenState.setInitialPriceDifference(1.5);
    tokenState.setClosePriceDifference(2.5);
    tokenState.setEnterPrice(100);
    tokenState.setClosePrice(110);

    tokenState.reset();

    expect(tokenState.getInitialPriceDifference()).toBe(0);
    expect(tokenState.getClosePriceDifference()).toBe(0);
    expect(tokenState.getEnterPrice()).toBe(0);
    expect(tokenState.getClosePrice()).toBe(0);
  });
});