import { Token } from "../types/tokenTypes";
import { reconstructBinanceSymbol, reconstructOrderlySymbol } from "../utils/symbols/getSymbols";
import { TokenState } from "../types/tokenState";

export const interval = 2000; // 2초 (단위시간)
export const shortInterval = 500; // 0.5초

//TODO: 토큰 동적으로 전략 수정 가능하게!
export const tokensArray: Token[] = [
    {
        binanceSymbol : reconstructBinanceSymbol('TON'), //바이낸스 버전 심볼 -> TONUSDT
        orderlySymbol : reconstructOrderlySymbol('TON'), //오덜리 버전 심볼 -> PERP_TON_USDC
        orderSize : 2, //주문수량
        arbitrageThreshold : 0.34, // 아비트리지 허용 임계값 (%)
        closeThreshold : 0.12, //청산 포지션 임계값(%)
        precision: 4,
        state: new TokenState()
    },
    {
        binanceSymbol : reconstructBinanceSymbol('ARB'),
        orderlySymbol : reconstructOrderlySymbol('ARB'),
        orderSize : 25,
        arbitrageThreshold : 0.55,
        closeThreshold : 0.14,
        precision: 4,
        state: new TokenState()
    },
    {
        binanceSymbol : reconstructBinanceSymbol('LINK'),
        orderlySymbol : reconstructOrderlySymbol('LINK'),
        orderSize : 2,
        arbitrageThreshold : 0.61,
        closeThreshold : 0.22,
        precision: 3,
        state: new TokenState()
    },
    {
        binanceSymbol : reconstructBinanceSymbol('ZRO'),
        orderlySymbol : reconstructOrderlySymbol('ZRO'),
        orderSize : 3,
        arbitrageThreshold : 0.70,
        closeThreshold : 0.21,
        precision: 3,
        state: new TokenState()
    },
    {
        binanceSymbol : reconstructBinanceSymbol('ONDO'),
        orderlySymbol : reconstructOrderlySymbol('ONDO'),
        orderSize : 12,
        arbitrageThreshold : 0.49,
        closeThreshold : 0.14,
        precision: 4,
        state: new TokenState()
    },
    {
        binanceSymbol : reconstructBinanceSymbol('ZK'),
        orderlySymbol : reconstructOrderlySymbol('ZK'),
        orderSize : 65,
        arbitrageThreshold : 0.70,
        closeThreshold : 0.15,
        precision: 4,
        state: new TokenState()
    },
    {
        binanceSymbol : reconstructBinanceSymbol('TIA'),
        orderlySymbol : reconstructOrderlySymbol('TIA'),
        orderSize : 2,
        arbitrageThreshold : 0.64,
        closeThreshold : 0.15,
        precision: 4,
        state: new TokenState()
    },
];

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
