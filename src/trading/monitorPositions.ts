import { getOrderlyPositions } from "../orderly/account";
import { getBinancePositions } from "../binance/account";
import { getBinancePrice } from "../binance/market";
import { getOrderlyPrice } from "../orderly/market";
import { shortInterval } from "./stratgy";
import { cancelAllOrders, closeAllPositions } from "./closePositions";
import { token } from "../types/tokenTypes";

//현재 보유한 포지션 갯수
export async function getPositionAmounts(token: token) {
    const [orderlyPosition, binancePosition] = await Promise.all([
        getOrderlyPositions(token.orderlySymbol),
        getBinancePositions(token.binanceSymbol)
    ]);

    const orderlyAmt = parseFloat(orderlyPosition.position_qty.toString());
    const binanceAmt = parseFloat(binancePosition.positionAmt.toString());

    return { orderlyAmt, binanceAmt };
}

export async function monitorClosePositions(token: token) {
    try {
        let isClosePosition = false;

        while (!isClosePosition) {
            const [orderlyPrice, binancePrice] = await Promise.all([
                getOrderlyPrice(token.orderlySymbol),
                getBinancePrice(token.binanceSymbol)
            ]);

            const priceDifference = ((binancePrice - orderlyPrice) / orderlyPrice) * 100;

            console.log(`<<<< [${token.binanceSymbol}] Price Difference: ${priceDifference}% >>>>`);

            // 청산 조건 확인
            if (Math.abs(priceDifference) <= token.closeThreshold) {
                console.log(`<<<< [${token.binanceSymbol}] Closing positions due to close threshold >>>>`);

                await closeAllPositions(token);
                await cancelAllOrders(token);

                isClosePosition = true;
                token.state.setClosePriceDifference(priceDifference);
                return;
            }

            // shortInterval 간격으로 반복
            await new Promise(resolve => setTimeout(resolve, shortInterval));
        }
    } catch (error) {
        console.error('Error in monitorClosePositions:', error);
        throw error;
    }
}