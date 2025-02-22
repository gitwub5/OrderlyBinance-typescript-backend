import { executeArbitrage } from './trading/websocket/executeArbitrage';
import { cancelAllOrders, closeAllPositions as closeAllPositionsAPI } from './trading/api/closePositions';
import { createTables } from './db/createTables';
import { setShouldStop, setForceStop } from './globals';
import { Token } from './types/tokenTypes';
import { tokensArray } from './trading/strategy';
import { initClients, disconnectClients } from './trading/websocket/websocketManger';
import { delay } from './utils/delay';

//토큰 선택
export const selectedTokens = [
    // tokensArray[0],
    // tokensArray[1],
    tokensArray[2],
    // tokensArray[3],
    // tokensArray[4],
    // tokensArray[5],
    // tokensArray[6]
];


//여러 토큰 한 번에 병렬 처리
async function manageMultipleTokens(tokens: Token[]) {
    await Promise.all(tokens.map(async (token) => {
        await initClients(token);
        await delay(2000); // Wait for 2 seconds to ensure WebSocket connections are established
        await executeArbitrage(token);
    }));
}

export async function shutdown() {
    setForceStop(true);
    setShouldStop(true);
    console.log('Shutting down arbitrage...');
    try {
        await Promise.all(selectedTokens.map(token => closeAllPositionsAPI(token)));
        await Promise.all(selectedTokens.map(token => cancelAllOrders(token)));
        selectedTokens.forEach(token => disconnectClients(token));
    } catch (err) {
        console.error('Error during closing positions:', err);
    } finally {
        console.log('Exiting manageOrders...');
        process.exit(1);
    }
}

// 바이낸스 하나의 웹소켓 API 연결은 24시간 동안만 유효함
// Set up a restart every  23 hours and 55 minutes
function setupDailyRestart() {
    setTimeout(() => {
        console.log('24 hours have passed. Restarting manageOrders...');
        shutdown();
    }, 23 * 60 * 60 * 1000 + 55 * 60 * 1000); //  23 hours and 55 minutes
}

async function init() {
    await createTables();

    process.on('SIGINT', shutdown);

    // Set up the daily restart timer
    setupDailyRestart();

    await manageMultipleTokens(selectedTokens);
}

init().catch(async err => {
    setForceStop(true);
    console.error('Failed to initialize application:', err);
    await Promise.all(selectedTokens.map(token => closeAllPositionsAPI(token)));
    await Promise.all(selectedTokens.map(token => cancelAllOrders(token)));
    selectedTokens.forEach(token => disconnectClients(token));
    process.exit(1);
});