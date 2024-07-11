// import { Buffer } from 'buffer';
// import { ec as EC } from 'elliptic';
// import keccak256 from 'keccak256';
// import { Account, connect, utils } from 'near-api-js';
// import { Contract } from 'near-api-js/lib/contract';
// import BigNumber from 'bignumber.js';

// import { ConfigurationOptionsClient } from './utils';
// import { NearWallet } from './near-wallet';
// import { WebSocketManager as PrivateWs } from './private';
// import { environment } from './utils';
// import { orderlyAccountInfo } from '../../utils/utils';

// export const AssetManagerContractMethodsList = {
//     viewMethods: [
//       'get_listed_tokens',
//       'user_storage_usage',
//       'is_token_listed',
//       'user_account_exists',
//       'storage_balance_of',
//       'storage_balance_bounds',
//       'is_symbol_listed',
//       'get_user_trading_key',
//       'is_orderly_key_announced',
//       'is_trading_key_set',
//       'storage_cost_of_announce_key',
//       'get_user_tokens_balances',
//     ],
//     changeMethods: [
//       // Authentication/registration
//       'storage_deposit',
//       'user_announce_key',
//       'user_request_set_trading_key',
//       // Deposit
//       'user_deposit_native_token',
//       // Withdrawal
//       'user_request_withdraw',
//       'storage_withdraw',
//       'storage_unregister',
//       // Perps
//       'user_request_settlement'
//     ],
//   };

// export class SmartContractClient {
//     private wallet: NearWallet;
//     private contract: Contract | any;
//     private account: Account;
//     public wsPrivate: any;
  
//     constructor(private config: ConfigurationOptionsClient) {

//     }
  
//     generateTradingKey() {
//         const ec = new EC('secp256k1');
//         const keyPair = ec.genKeyPair();
//         const pubKeyAsHex = keyPair.getPublic().encode('hex').replace('04', '');
    
//         return {
//           privateKey: keyPair.getPrivate().toString('hex'),
//           publicKey: keyPair.getPublic().encode('hex'),
//           pubKeyAsHex: pubKeyAsHex,
//           normalizeTradingKey: btoa(keccak256(pubKeyAsHex).toString('hex')),
//           keyPair,
//         };
//       }

//     async connect(): Promise<void> {
//         if (window.Buffer === undefined) window.Buffer = Buffer;
//         const nearConfig = environment('mainnet').nearWalletConfig;
//         const nearConnection = await connect(nearConfig);

//         this.wallet = new NearWallet({ contractId: this.config.contractId, network: this.config.networkId });

//         await this.wallet.startUp();

//         if (this.wallet.isSignedIn) {
//         console.log('Start to init Orderly SDK');
//         console.log('this.wallet', this.wallet);
//         await nearConnection.account(this.wallet.accountId);
//         const accountId = this.wallet.accountId;
//         const orderlyKeyPair = await environment(this.config.networkId).nearWalletConfig.keyStore.getKey(
//             environment(this.config.networkId).nearWalletConfig.networkId,
//             accountId,
//         );

//         this.account = new Account(nearConnection.connection, accountId);
//         this.contract = new Contract(
//             this.account,
//             environment(this.config.networkId).nearWalletConfig.contractName,
//             AssetManagerContractMethodsList,
//         );

//         const userExists = await this.contract.user_account_exists({ user: accountId });
//         console.log(`userExists: ${userExists}`);

//         if (!userExists) {
//             console.log('User account not exists, creating');
//             this.wallet.callMethod(
//             environment(this.config.networkId).nearWalletConfig.contractName,
//             'storage_deposit',
//             { account_id: accountId, registration_only: true },
//             '30000000000000',
//             utils.format.parseNearAmount('1'),
//             );
//             console.log('User account created');
//         }

//         const isKeyAnnounced = await this.contract.is_orderly_key_announced({
//             user: accountId,
//             orderly_key: orderlyKeyPair.getPublicKey().toString(),
//         });

//         if (!isKeyAnnounced) {
//             try {
//             const storageCost = await this.contract.storage_cost_of_announce_key({});
//             const balanceOf = await this.contract.storage_balance_of({ account_id: accountId });
//             const storageUsage = await this.contract.user_storage_usage({ user: accountId });
//             const value = new BigNumber(storageUsage)
//                 .plus(new BigNumber(storageCost))
//                 .minus(new BigNumber(balanceOf.total));

//             console.log('storageCost', storageCost);
//             console.log('balanceOf', balanceOf);
//             console.log('storageUsage', storageUsage);

//             if (value.isGreaterThan(0)) {
//                 this.wallet.callMethod(
//                 environment(this.config.networkId).nearWalletConfig.contractName,
//                 'storage_deposit',
//                 { account_id: accountId, registration_only: false },
//                 '30000000000000',
//                 utils.format.parseNearAmount('1'),
//                 );
//             } else {
//                 console.log('Key not announced, doing it');
//                 await this.contract.user_announce_key({});
//                 console.log('Key announced');
//             }
//             } catch (e) {
//             console.log('ERROR', e);
//             }
//         }

//         const tradingKeyIsSet = await this.contract.is_trading_key_set({
//             user: accountId,
//             orderly_key: orderlyKeyPair.getPublicKey().toString(),
//         });

//         let tradingKeyPairResponse;

//         if (!tradingKeyIsSet) {
//             const getTradingKeyPair = () => {
//             const ec = new EC('secp256k1');
//             const keyPair = ec.genKeyPair();

//             return {
//                 privateKey: keyPair.getPrivate().toString('hex'),
//                 publicKey: keyPair.getPublic().encode('hex'),
//                 keyPair,
//             };
//             };

//             const tradingKeyPair = getTradingKeyPair();
//             const pubKeyAsHex = tradingKeyPair.publicKey.replace('04', '');
//             const normalizeTradingKey = btoa(keccak256(pubKeyAsHex).toString('hex'));

//             console.log('Trading key is generated, setting it', normalizeTradingKey);

//             await this.contract.user_request_set_trading_key({
//             key: normalizeTradingKey,
//             });

//             const tradingKey = localStorage.setItem('TRADING_KEY', tradingKeyPair.publicKey.replace('04', ''));
//             const tradingKeySecret = localStorage.setItem('TRADING_KEY_SECRET', tradingKeyPair.privateKey);

//             tradingKeyPairResponse = {
//             tradingKey: tradingKey,
//             tradingKeySecret: tradingKeySecret,
//             };
//         }

//         const sdkOptions: ConfigurationOptionsClient = {
//             networkId: this.config.networkId,
//             accountId: accountId,
//             publicKey: orderlyKeyPair.getPublicKey().toString(),
//             orderlyKeyPrivate: `ed25519:${orderlyAccountInfo.privateKeyBase58}`,
//             tradingPublic: tradingKeyPairResponse?.tradingKey || localStorage.getItem('TRADING_KEY'),
//             tradingSecret: tradingKeyPairResponse?.tradingKeySecret || localStorage.getItem('TRADING_KEY_SECRET'),
//         };

//         this.wsPrivate = new PrivateWs(sdkOptions);
//         }
//     }

//     public wsPrivateClient() {
//         return this.wsPrivate;
//     }
// }