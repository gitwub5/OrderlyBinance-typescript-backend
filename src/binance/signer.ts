import crypto from 'crypto';

export async function createBinanceSignature(
    query_string : string,
    apiSecret : Uint8Array | string,
){
    return crypto
        .createHmac('sha256', apiSecret)
        .update(query_string)
        .digest('hex');
}