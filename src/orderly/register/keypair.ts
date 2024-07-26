import { ed25519 } from '@noble/curves/ed25519';
import { config } from 'dotenv';
import { encodeBase58, ethers } from 'ethers';
import { webcrypto } from 'node:crypto';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const MESSAGE_TYPES = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' }
  ],
  AddOrderlyKey: [
    { name: 'brokerId', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'orderlyKey', type: 'string' },
    { name: 'scope', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'expiration', type: 'uint64' }
  ]
};

const OFF_CHAIN_DOMAIN = {
  name: 'Orderly',
  version: '1',
  chainId: 421614,
  verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
};

const BASE_URL = 'https://api-evm.orderly.org';
const BROKER_ID = 'orderly';
const CHAIN_ID = 421614;

config();

async function createOrderlyKey(): Promise<void> {
  const wallet = new ethers.Wallet('ba3cde94fa7e1008d72ad1c84b6c8003ae0b61d891089b3d1711cabf68e8a546');

  const privateKey = ed25519.utils.randomPrivateKey();
  const orderlyKey = `ed25519:${encodeBase58(await ed25519.getPublicKey(privateKey))}`;
  const timestamp = Date.now();
  const addKeyMessage = {
    brokerId: BROKER_ID,
    chainId: CHAIN_ID,
    orderlyKey,
    scope: 'read,trading',
    timestamp,
    expiration: timestamp + 1_000 * 60 * 60 * 24 * 365 // 1 year
  };

  const signature = await wallet.signTypedData(
    OFF_CHAIN_DOMAIN,
    {
      AddOrderlyKey: MESSAGE_TYPES.AddOrderlyKey
    },
    addKeyMessage
  );

  const keyRes = await fetch(`${BASE_URL}/v1/orderly_key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: addKeyMessage,
      signature,
      userAddress: await wallet.getAddress()
    })
  });
  const keyJson = await keyRes.json();
  console.log('addAccessKey', keyJson);
}

// createOrderlyKey();
