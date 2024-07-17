import { token } from "../types/tokenTypes";
import { reconstructBinanceSymbol, reconstructOrderlySymbol } from "../utils/symbols/getSymbols";
import { TokenState } from "../types/tokenState";

export const interval = 2000; // 2초 (단위시간)
export const shortInterval = 500; // 0.5초

export const tokensArray: token[] = [
    {
        binanceSymbol : reconstructBinanceSymbol('TON'), //바이낸스 버전 심볼 -> TONUSDT
        orderlySymbol : reconstructOrderlySymbol('TON'), //오덜리 버전 심볼 -> PERP_TON_USDC
        orderSize : 2, //주문수량
        arbitrageThreshold : 0.35, // 아비트리지 허용 임계값 (%)
        closeThreshold : 0.10, //청산 포지션 임계값(%)
        precision: 4,
        state: new TokenState()
    },
    {
        binanceSymbol : reconstructBinanceSymbol('ARB'),
        orderlySymbol : reconstructOrderlySymbol('ARB'),
        orderSize : 25,
        arbitrageThreshold : 0.38,
        closeThreshold : 0.10,
        precision: 4,
        state: new TokenState()
    },
    {
        binanceSymbol : reconstructBinanceSymbol('LINK'),
        orderlySymbol : reconstructOrderlySymbol('LINK'),
        orderSize : 2,
        arbitrageThreshold : 0.40,
        closeThreshold : 0.12,
        precision: 3,
        state: new TokenState()
    },
    {
        binanceSymbol : reconstructBinanceSymbol('ZRO'),
        orderlySymbol : reconstructOrderlySymbol('ZRO'),
        orderSize : 3,
        arbitrageThreshold : 0.30,
        closeThreshold : 0.12,
        precision: 3,
        state: new TokenState()
    },
    {
        binanceSymbol : reconstructBinanceSymbol('ONDO'),
        orderlySymbol : reconstructOrderlySymbol('ONDO'),
        orderSize : 12,
        arbitrageThreshold : 0.47,
        closeThreshold : 0.12,
        precision: 4,
        state: new TokenState()
    },
    {
        binanceSymbol : reconstructBinanceSymbol('ZK'),
        orderlySymbol : reconstructOrderlySymbol('ZK'),
        orderSize : 65,
        arbitrageThreshold : 0.40,
        closeThreshold : 0.15,
        precision: 4,
        state: new TokenState()
    },
    {
        binanceSymbol : reconstructBinanceSymbol('TIA'),
        orderlySymbol : reconstructOrderlySymbol('TIA'),
        orderSize : 2,
        arbitrageThreshold : 0.40,
        closeThreshold : 0.20,
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
