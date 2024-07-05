import { manageArbitrage } from './trading/executeArbitrage';
import { closePositions } from './trading/closePositioins';
import { createTables } from './db/createTables';
import { setShouldStop, setForceStop } from './globals';
import { TON } from './trading/stratgy';

// TODO: 여러 토큰 한 번에 병렬 처리
// async function manageMultipleTokens(tokens: token[]) {
//     const tasks = tokens.map(token => manageOrders(token));
//     await Promise.all(tasks);
// }

async function init() {

    //tokens[] = token1, token2, ....여러개의 인터페이스

    await createTables();

    process.on('SIGINT', async () => {
        setForceStop(true);
        setShouldStop(true);
        console.log('Received SIGINT. Stopping manageOrders...');
        try {
            await closePositions(TON);
        } catch (err) {
            console.error('Error during closing positions:', err);
        } finally {
            console.log('Exiting manageOrders...');
            process.exit(0);
        }
    });
    
    await manageArbitrage(TON);
    //await manageMultipleTokens(tokens);
}

init().catch(async err => {
    console.error('Failed to initialize application:', err);
    await closePositions(TON);
    process.exit(1);
});