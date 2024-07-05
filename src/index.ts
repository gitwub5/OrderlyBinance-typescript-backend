import { manageOrders } from './trading/apiArbitrage';
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

    await manageOrders();
}

init().catch(err => {
    console.error('Failed to initialize application:', err);
    process.exit(1);
});
