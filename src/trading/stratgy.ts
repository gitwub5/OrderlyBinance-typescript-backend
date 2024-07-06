import { token } from "../types/tokenTypes";
import { reconstructBinanceSymbol, reconstructOrderlySymbol } from "../utils/getSymbols";

export const tokens: token[] = [
    {
        binanceSymbol : reconstructBinanceSymbol('TON'), //바이낸스 버전 심볼 -> TONUSDT
        orderlySymbol : reconstructOrderlySymbol('TON'), //오덜리 버전 심볼 -> PERP_TON_USDC
        orderSize : 2, //주문수량
        arbitrageThreshold : 0.3, // 아비트리지 허용 임계값 (%)
        closeThreshold : 0.15 //청산 포지션 임계값(%)
    },
    {
        binanceSymbol : reconstructBinanceSymbol('BTC'),
        orderlySymbol : reconstructOrderlySymbol('BTC'),
        orderSize : 2,
        arbitrageThreshold : 0.3,
        closeThreshold : 0.15
    },
    {
        binanceSymbol : reconstructBinanceSymbol('WOO'),
        orderlySymbol : reconstructOrderlySymbol('WOO'),
        orderSize : 2,
        arbitrageThreshold : 0.25,
        closeThreshold : 0.12
    }
];

export const TON : token = {
    binanceSymbol : reconstructBinanceSymbol('TON'),
    orderlySymbol : reconstructOrderlySymbol('TON'),
    orderSize : 2,
    arbitrageThreshold : 0.25,
    closeThreshold : 0.12
};

export const orderSize = 2; // 주문 크기 (단위: TON)
export const interval = 3000; // 3초 (단위시간)
export const shortInterval = 1000; // 1초


// export const arbitrageThreshold = 0.3; 
// export const closeThreshold = 0.15;

// 수수료
// Binance: Taker 0.05%, Maker 0.02%
// Orderly: Taker & Maker 0.03%

// 기본 설정 값:
// Binance Taker: 0.05%
// Orderly Taker: 0.03%
// 총 수수료 합계: 0.05% + 0.03% = 0.08%

// 임계값 설정:
// 거래 수수료 합계를 고려하여, 수익이 발생하기 위해 최소 갭은 0.08% 이상이어야 함.
// 임계값을 약간 여유 있게 설정하여, 슬리피지와 기타 비용을 고려.

// 아비트리지 실행 임계값 (arbitrageThreshold): 0.3% 
// 포지션 청산 임계값 (closeThreshold): 0.15% (수수료 합계와 수익을 고려한 적절한 값)
