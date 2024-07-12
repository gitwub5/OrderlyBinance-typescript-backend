import { tokensArray } from "../../trading/stratgy";
import { initClients, clients } from "./websocketManger";

async function main(){
    const token = tokensArray[0];
    if (!clients[token.binanceSymbol]) {
        await initClients(token);
      }
  
      const { orderlyClient, binanceClient, binanceClient2 } = clients[token.binanceSymbol];
    binanceClient.setHandler('ORDER_TRADE_UPDATE', (params) => {
                const orderUpdate = params.o
                console.log('Order update:', orderUpdate);
                console.log('Side:', orderUpdate.S);
                console.log('Order Id:', orderUpdate.i);
                console.log('Order Status:', orderUpdate.X);
        
    });
    binanceClient2.setHandler('markPriceUpdate', (params) => {
                const priceUpdate = params.p;
                console.log('Mark Price Update:', parseFloat(priceUpdate));
              });

    orderlyClient.markPrice('PERP_TON_USDC');
    orderlyClient.setMessageCallback(async (message) => {
        if (message.topic === `PERP_TON_USDC@markprice`){
                  const data = message.data;
                  const orderlyPrice = parseFloat(data.price);
                 
                  console.log(`Mark Price orderly: `, orderlyPrice);
        }  
        });
    
}

// main();