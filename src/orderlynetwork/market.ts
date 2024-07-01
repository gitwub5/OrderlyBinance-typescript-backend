import { orderlySymbol,orderlyAxios } from '../utils';

export async function getOrderlyPrice() {
    const response = await orderlyAxios.get(`/v1/public/futures/${orderlySymbol}`);
    const price = response.data.data.mark_price;
    
    //console.log(`Orderly ${orderlySymbol} price: `, parseFloat(price));
    return parseFloat(price);
}

//getOrderlyPrice();