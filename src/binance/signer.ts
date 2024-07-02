import crypto from 'crypto';
import axios from "axios";
import { binanceAccountInfo, BINANCE_API_URL } from '../utils';


async function createBinanceSignature(
    query_string : string,
    apiSecret : Uint8Array | string,
){
    return crypto
        .createHmac('sha256', apiSecret)
        .update(query_string)
        .digest('hex');
}

export async function createSignAndRequest(endpoint: string, queryParams: Record<string, string>, method: 'GET' | 'POST' | 'DELETE' | 'PUT') {
    const baseUrl = BINANCE_API_URL;
    const timestamp = Date.now().toString();
    queryParams.timestamp = timestamp;
    
    const queryString = new URLSearchParams(queryParams).toString();
    const signature = await createBinanceSignature(queryString, binanceAccountInfo.secret);
    const finalQueryString = `${queryString}&signature=${signature}`;

    const url = `${baseUrl}${endpoint}?${finalQueryString}`;
    const headers = {
        'X-MBX-APIKEY': binanceAccountInfo.apiKey,
    };

    try {
        const response = await axios({
            method,
            url,
            headers,
        });
        return response.data;
    } catch (error) {
        console.error(`Error in ${method} request to ${endpoint}:`, error);
        return null;
    }
}