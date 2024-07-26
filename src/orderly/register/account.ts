import { config } from "dotenv";
import { ethers } from "ethers";

const MESSAGE_TYPES = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" }
  ],
  Registration: [
    { name: "brokerId", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "timestamp", type: "uint64" },
    { name: "registrationNonce", type: "uint256" }
  ]
};

const OFF_CHAIN_DOMAIN = {
  name: "Orderly",
  version: "1",
  chainId: 421614,
  verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
};

const BASE_URL = "https://api-evm.orderly.org";
const BROKER_ID = "orderly";
const CHAIN_ID = 421614;

config();

async function registerAccount(): Promise<void> {
  const wallet = new ethers.Wallet('ba3cde94fa7e1008d72ad1c84b6c8003ae0b61d891089b3d1711cabf68e8a546');

  const nonceRes = await fetch(`${BASE_URL}/v1/registration_nonce`);
  const nonceJson = await nonceRes.json();
  const registrationNonce = nonceJson.data.registration_nonce as string;

  const registerMessage = {
    brokerId: BROKER_ID,
    chainId: CHAIN_ID,
    timestamp: Date.now(),
    registrationNonce
  };

  const signature = await wallet.signTypedData(
    OFF_CHAIN_DOMAIN,
    {
      Registration: MESSAGE_TYPES.Registration
    },
    registerMessage
  );

  const registerRes = await fetch(`${BASE_URL}/v1/register_account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: registerMessage,
      signature,
      userAddress: await wallet.getAddress()
    })
  });
  const registerJson = await registerRes.json();
  if (!registerJson.success) {
    throw new Error(registerJson.message);
  }
  const orderlyAccountId = registerJson.data.account_id;
  console.log("orderlyAccountId", orderlyAccountId);
}

// async function main() {
//     console.log(await registerAccount());
// }

// main();

