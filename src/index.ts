import { executeArbitrage } from './trading/websocket/executeArbitrage';
import { cancelAllOrders, closeAllPositions } from './trading/api/closePositions';
import { createTables } from './db/createTables';
import { setShouldStop, setForceStop } from './globals';
import { token } from './types/tokenTypes';
import { tokensArray } from './trading/stratgy';
import { initClients, disconnectClients } from './trading/websocket/websocketManger';

//토큰 선택
const selectedTokens = [
    tokensArray[0],
    // tokensArray[1],
    // tokensArray[2],
    // tokensArray[3],
    // tokensArray[4],
    // tokensArray[5],
    // tokensArray[6]
];

//여러 토큰 한 번에 병렬 처리
async function manageMultipleTokens(tokens: token[]) {
    await Promise.all(tokens.map(async (token) => {
        await initClients(token);
        await executeArbitrage(token);
    }));
}

// TODO: 바이낸스랑 오덜리 함수들 클래스화
async function init() {
    await createTables();

    process.on('SIGINT', async () => {
        setForceStop(true);
        setShouldStop(true);
        console.log('Received SIGINT. Stopping manageOrders...');
        try {
            await Promise.all(selectedTokens.map(token => closeAllPositions(token)));
            await Promise.all(selectedTokens.map(token => cancelAllOrders(token)));
            selectedTokens.forEach(token => disconnectClients(token));
        } catch (err) {
            console.error('Error during closing positions:', err);
        } finally {
            console.log('Exiting manageOrders...');
            process.exit(0);
        }
    });

    await manageMultipleTokens(selectedTokens);
}

init().catch(async err => {
    setForceStop(true);
    console.error('Failed to initialize application:', err);
    await Promise.all(selectedTokens.map(token => closeAllPositions(token)));
    await Promise.all(selectedTokens.map(token => cancelAllOrders(token)));
    selectedTokens.forEach(token => disconnectClients(token));
    process.exit(1);
});