import { manageArbitrage } from './trading/executeArbitrage';
import { closePositions } from './trading/closePositioins';
import { createTables } from './db/createTables';
import { setShouldStop, setForceStop } from './globals';

async function init() {
    await createTables();

    process.on('SIGINT', async () => {
        setForceStop(true);
        setShouldStop(true);
        console.log('Received SIGINT. Stopping manageOrders...');
        try {
            await closePositions();
        } catch (err) {
            console.error('Error during closing positions:', err);
        } finally {
            console.log('Exiting manageOrders...');
            process.exit(0);
        }
    });

    await manageArbitrage();
}

init().catch(err => {
    console.error('Failed to initialize application:', err);
    process.exit(1);
});


// TODO: 여러 토큰 한 번에 병렬 처리
// async function manageMultipleTokens(tokens: token[]) {
//     const tasks = tokens.map(token => manageOrders(token));
//     await Promise.all(tasks);
// }

// async function init() {
//     await createTables();

//     const tokens = ['BTCUSDT', 'ETHUSDT', 'LTCUSDT']; // Example tokens

//     process.on('SIGINT', async () => {
//         setForceStop(true);
//         setShouldStop(true);
//         console.log('Received SIGINT. Stopping manageOrders...');
//         try {
//             await closePositions();
//         } catch (err) {
//             console.error('Error during closing positions:', err);
//         } finally {
//             console.log('Exiting manageOrders...');
//             process.exit(0);
//         }
//     });

//     await manageMultipleTokens(tokens);
// }

// init().catch(err => {
//     console.error('Failed to initialize application:', err);
//     process.exit(1);
// });