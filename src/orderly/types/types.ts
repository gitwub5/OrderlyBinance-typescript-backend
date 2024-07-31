export interface OrderlyPosition {
    symbol: string;
    position_qty: number;
    cost_position: number;
    last_sum_unitary_funding: number;
    pending_long_qty: number;
    pending_short_qty: number;
    settle_price: number;
    average_open_price: number;
    unsettled_pnl: number;
    mark_price: number;
    est_liq_price: number;
    timestamp: number;
    mmr: number;
    imr: number;
    IMR_withdraw_orders: number;
    MMR_with_orders: number;
    pnl_24_h: number;
    fee_24_h: number;
  }
  
  export interface OrderlyPositionResponse {
    success: boolean;
    data: OrderlyPosition;
    timestamp: number;
  }

  export interface BalanceHolding {
    updated_time: number;
    token: string;
    holding: number;
    frozen: number;
    pending_short: number;
  }
  
export interface OrderlyBalanceResponse {
    success: boolean;
    data: {
      holding: BalanceHolding[];
    };
    timestamp: number;
  }

  //Order Client Interfaces
export interface OrderResponse {
  success: boolean;
  id: string;
  [key: string]: any;
}

