import { ed25519 } from '@noble/curves/ed25519';
import bs58 from 'bs58';

//TODO: 수정 필요
export async function signAndSendRequest(
  orderlyAccountId: string,
  privateKey: Uint8Array | string,
  input: URL | string,
  init?: RequestInit | undefined
): Promise<Response> {
  const timestamp = Date.now();
  const encoder = new TextEncoder();

  const url = new URL(input);
  let message = `${String(timestamp)}${init?.method ?? 'GET'}${url.pathname}${url.search}`;
  if (init?.body) {
    message += init.body;
  }
  const orderlySignature = await ed25519.sign(encoder.encode(message), privateKey);

  return fetch(input, {
    headers: {
      'Content-Type':
        init?.method !== 'GET' && init?.method !== 'DELETE'
          ? 'application/json'
          : 'application/x-www-form-urlencoded',
      'orderly-timestamp': String(timestamp),
      'orderly-account-id': orderlyAccountId,
      'orderly-key': `ed25519:${bs58.encode(await ed25519.getPublicKey(privateKey))}`,
      'orderly-signature': Buffer.from(orderlySignature).toString('base64url'),
      ...(init?.headers ?? {})
    },
    ...(init ?? {})
  });
}


// import { ed25519 } from '@noble/curves/ed25519';
// import bs58 from 'bs58';

// export async function signAndSendRequest(
//   orderlyAccountId: string,
//   privateKey: Uint8Array | string,
//   input: URL | string,
//   init?: RequestInit | undefined
// ): Promise<Response> {
//   const timestamp = Date.now();
//   const encoder = new TextEncoder();

//   const url = new URL(input);
//   let message = `${String(timestamp)}${init?.method ?? 'GET'}${url.pathname}${url.search}`;
//   if (init?.body) {
//     message += init.body;
//   }
//   const orderlySignature = await ed25519.sign(encoder.encode(message), privateKey);

//   const headers = {
//     'Content-Type':
//       init?.method !== 'GET' && init?.method !== 'DELETE'
//         ? 'application/json'
//         : 'application/x-www-form-urlencoded',
//     'orderly-timestamp': String(timestamp),
//     'orderly-account-id': orderlyAccountId,
//     'orderly-key': `ed25519:${bs58.encode(await ed25519.getPublicKey(privateKey))}`,
//     'orderly-signature': Buffer.from(orderlySignature).toString('base64url'),
//     ...(init?.headers ?? {}),
//   };

//   // 요청 정보 출력
//   console.log('Request URL:', input);
//   console.log('Request Method:', init?.method ?? 'GET');
//   console.log('Request Headers:', headers);
//   if (init?.body) {
//     console.log('Request Body:', init.body);
//   }

//   try {
//     return await fetch(input, {
//       ...init,
//       headers,
//     });
//   } catch (error) {
//     console.error('Error in signAndSendRequest:', error);
//     return new Response(null, { status: 500, statusText: 'Internal Server Error' });
//   }
// }
