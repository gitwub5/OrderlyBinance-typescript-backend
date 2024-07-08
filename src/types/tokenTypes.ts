import { TokenState } from './tokenState';

export interface token {
    binanceSymbol : string;
    orderlySymbol : string;
    orderSize : number;
    arbitrageThreshold : number;
    closeThreshold : number;
    precision : number;
    state: TokenState; 
}