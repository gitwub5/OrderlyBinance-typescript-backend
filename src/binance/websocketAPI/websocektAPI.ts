import { WebsocketAPI, WebsocketStream, WsAccountTypes, WsTradeTypes, NewOrderRespType, TimeInForce, Side, OrderType,Spot, listenkeyResponse, FuturesType } from '@binance/connector-typescript';
import { binanceAccountInfo } from '../../utils/utils';

//https://github.com/binance/binance-connector-typescript/tree/main 
//https://github.com/binance/binance-connector-typescript/tree/main/examples/websocketAPI


const API_KEY = binanceAccountInfo.apiKey;
const API_SECRET = binanceAccountInfo.secret;
const wsURL = 'wss://ws-fapi.binance.com/ws-fapi/v1';

const options: WsTradeTypes.openOrdersOptions = {
    symbol: 'BNBUSDT'
};
const callbacks = {
    open: (client: WebsocketAPI) => {
        console.debug('Connected to WebSocket server');
        client.openOrders(options);
    },
    close: () => console.debug('Disconnected from WebSocket server'),
    message: (data: string) => {
        const parseData = JSON.parse(data);
        console.info(parseData);
    }
};

const websocketAPIClient = new WebsocketAPI(API_KEY, API_SECRET, { callbacks, wsURL });

setTimeout(() => websocketAPIClient.disconnect(), 60000);

// console.log(placeBinanceOrder.limitOrder("TONUSDT", 'BUY', 6.6, 2));