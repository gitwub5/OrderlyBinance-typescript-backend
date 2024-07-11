// import { NearNetworkId } from '../../utils/utils';
// import { SmartContractClient } from './smartContract';
// import { ConfigurationOptionsClient } from './utils';
// import * as nearApi from 'near-api-js'

// export class ParameterNotFoundError extends Error {
//     constructor(parameterName: string) {
//       super(`${parameterName} parameter is not set. Please add it to your env file.`);
//     }
// }

// export class AuthClient {
//     private smartContractClient: SmartContractClient;
//     private config: ConfigurationOptionsClient;

//     constructor(options?: ConfigurationOptionsClient) {
//         this.checkEnvironment(options);
//         this.smartContractClient = new SmartContractClient(this.config);
//     }

//     private checkEnvironment(config?: ConfigurationOptionsClient) {
//         const networkId = NearNetworkId[config?.networkId || 'mainnet'];
//         const debugMode = config?.debug === undefined ? true : config?.debug;
//         const contractId = config?.contractId;
    
//         if (debugMode) {
//           console.log('Debug mode enabled. Disable it by passing `debug: false` into constructor.');
//         }
    
//         if (!networkId) {
//           throw new ParameterNotFoundError('Network ID');
//         }
    
//         this.config = {
//           networkId,
//           contractId,
//           debug: debugMode,
//         };
//       }

//       public async connect(): Promise<void> {
//         return this.smartContractClient.connect();
//       }
    
//       public async wsClientPrivate() {
//         return await this.smartContractClient.wsPrivateClient();
//       }
// }