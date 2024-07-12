import { getOrderlyPrice } from '../../orderly/api/market';
import { getBinancePrice } from '../../binance/api/market';
import { shouldStop, forceStop } from '../../globals';
import { recordTrade } from '../../db/queries';
import { token } from '../../types/tokenTypes';
import { WebSocketManager as OrderlyWs } from '../../orderly/websocket/public';
import { SocketClient as BinanceWs } from '../../binance/websocketStream/socketClient';
import { tokensArray } from '../stratgy';

async function monitorClosePositions(token : token) {
    let orderlyPrice: number | null = null;
    let orderlyTimestamp: number | null = null;
    let binancePrice: number | null = null;
    let binanceTimestamp: number | null = null;
    let orderlyPriceUpdated = false;
    let binancePriceUpdated = false;

    function comparePrices() {
        if (orderlyPrice !== null && binancePrice !== null && orderlyTimestamp !== null && binanceTimestamp !== null) {
            const timestampDifference = Math.abs(orderlyTimestamp - binanceTimestamp);
            if (timestampDifference <= 500) {  // 0.5초 이내의 차이인 경우
                const priceDifference = ((binancePrice - orderlyPrice) / orderlyPrice) * 100;
                console.log(`Price Difference WS: ${priceDifference}%`);
                // 여기에 원하는 함수 호출
            }
        }
    }

    function checkAndComparePrices() {
        if (orderlyPriceUpdated && binancePriceUpdated) {
            comparePrices();
            orderlyPriceUpdated = false;
            binancePriceUpdated = false;
        }
    }

    // 오덜리 웹소켓 open
    const orderlyClient = new OrderlyWs();
    await orderlyClient.connect();
    await orderlyClient.markPrice(token.orderlySymbol);

    orderlyClient.setMessageCallback((message) => {
        if (message.topic === `${token.orderlySymbol}@markprice`) {
            const data = message.data;
            orderlyPrice = parseFloat(data.price);
            orderlyTimestamp = message.ts; 
            console.log('orderlyPrice ws:', orderlyPrice);
            console.log('orderlyTIME ws :', orderlyTimestamp);
            orderlyPriceUpdated = true;
            checkAndComparePrices();
        }
    });

    // 바이낸스 웹소켓 open
    const interval = '1s';
    const endpoint = `@markPrice@${interval}`;
    const binanceClient = new BinanceWs(`ws/${token.binanceSymbol.toLowerCase()}${endpoint}`);
    binanceClient.setHandler('markPriceUpdate', (params) => {
        binancePrice = parseFloat(params.p);
        binanceTimestamp = params.E;  // assuming the params object contains an event time (E)
        console.log('binancePrice ws:', binancePrice);
        console.log('binanceTIME ws:', binanceTimestamp);
        binancePriceUpdated = true;
        checkAndComparePrices();
    });

}

monitorClosePositions(tokensArray[0]).catch((error) => {
    console.error('Error in main function:', error);
});