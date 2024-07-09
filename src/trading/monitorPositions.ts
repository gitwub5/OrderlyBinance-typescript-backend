import { getOrderlyPositions } from "../orderly/account";
import { getBinancePositions } from "../binance/account";
import { getBinancePrice } from "../binance/market";
import { getOrderlyPrice } from "../orderly/market";
import { shortInterval } from "./stratgy";
import { cancelAllOrders, closePositions } from "./closePositions";
import { token } from "../types/tokenTypes";

//현재 보유한 포지션 갯수
export async function getPositionAmounts(token: token) {
    const [orderlyPosition, binancePosition] = await Promise.all([
        getOrderlyPositions(token.orderlySymbol),
        getBinancePositions(token.binanceSymbol)
    ]);

    const orderlyAmt = orderlyPosition ? parseFloat(orderlyPosition.position_qty.toString()) : null;
    const binanceAmt = binancePosition ? parseFloat(binancePosition.positionAmt.toString()) : null;

    return { orderlyAmt, binanceAmt };
}

// 현재 포지션이 있는지 확인하는 함수
export async function hasOpenPositions(token: token): Promise<boolean> {
    try {
        const [orderlyPosition, binancePosition] = await Promise.all([
            getOrderlyPositions(token.orderlySymbol),
            getBinancePositions(token.binanceSymbol)
        ]);

        const orderlyAmt = orderlyPosition ? parseFloat(orderlyPosition.position_qty.toString()) : null;
        const positionAmt = binancePosition ? parseFloat(binancePosition.positionAmt.toString()) : null;

        console.log(`Orderly position_qty:', orderlyAmt !== null ? orderlyAmt : 'null`);
        console.log(`Binance positionAmt:', positionAmt !== null ? positionAmt : 'null`);

        return (orderlyAmt !== null && orderlyAmt !== 0) || (positionAmt !== null && positionAmt !== 0);
    } catch (error) {
        console.error('Error checking open positions:', error);
        throw error;
    }
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

                await closePositions(token);
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