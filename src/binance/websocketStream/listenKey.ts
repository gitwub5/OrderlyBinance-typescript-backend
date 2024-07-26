import { createSignAndRequest } from '../api/signer';

export async function getListenKey(){
    const endpoint = '/fapi/v1/listenKey';
    const queryParams = {
    };
  
    const res = await createSignAndRequest(endpoint, queryParams, 'POST');
    return res.listenKey;
  }

export async function keepListenKey(){
    const endpoint = '/fapi/v1/listenKey';
    const queryParams = {
    };
  
    const res = await createSignAndRequest(endpoint, queryParams, 'PUT');
    return res;
}

export async function deleteListenKey(){
    const endpoint = '/fapi/v1/listenKey';
    const queryParams = {
    };
  
    const res = await createSignAndRequest(endpoint, queryParams, 'DELETE');
    console.log(res);
}

// async function main(){
// console.log(await keepListenKey());
// }
// main();