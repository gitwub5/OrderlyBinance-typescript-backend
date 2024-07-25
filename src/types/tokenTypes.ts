import { TokenState } from './tokenState';

export interface Token {
  symbol: string;
  binanceSymbol: string;
  orderlySymbol: string;
  orderSize: number;
  arbitrageThreshold: number;
  closeThreshold: number;
  precision: number;
  state: TokenState;
}