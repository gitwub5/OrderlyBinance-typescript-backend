export interface BinancePosition {
    symbol: string;
    positionAmt: number;
    entryPrice: number;
    breakEvenPrice: number;
    markPrice: number;
    unRealizedProfit: number;
    liquidationPrice: number;
    leverage: number;
    maxNotionalValue: number;
    marginType: string;
    isolatedMargin: string;
    isAutoAddMargin: string;
    positionSide: string;
    notional: number;
    isolatedWallet: number;
    updateTime: number;
    isolated: boolean;
    adlQuantile: number;
  }

export interface BinanceBalance {
    accountAlias: string;
    asset: string;
    balance: number;
    crossWalletBalance: number;
    crossUnPnl: number;
    availableBalance: number;
    maxWithdrawAmount: number;
    marginAvailable: boolean;
    updateTime: number;
  }

  export interface BatchOrder {
    orderId: string;
    origClientOrderId?: string;
    symbol: string;
    side: 'SELL' | 'BUY';
    quantity: number;
    price: number;
    recvWindow?: number;
    timestamp: number;
  }

  export interface BinanceOrderStatus {
    orderId: number;
    symbol: string;
    status: string;
    clientOrderId: string;
    price: string;
    avgPrice: string;
    origQty: string;
    executedQty: string;
    cumQuote: string;
    timeInForce: string;
    type: string;
    reduceOnly: boolean;
    closePosition: boolean;
    side: string;
    positionSide: string;
    stopPrice: string;
    workingType: string;
    priceProtect: boolean;
    origType: string;
    priceMatch: string;
    selfTradePreventionMode: string;
    goodTillDate: number;
    time: number;
    updateTime: number;
  }