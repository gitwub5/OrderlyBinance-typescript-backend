import { manageOrders } from './manageOrders';
import { closePositions } from './closePositioins';
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

//TODO: Profit을 따로 계산해서 저장하는데 거의 대부분의 주문이 원하는 가격으로 안들어갈 확률이 높아서 수익률이 정확하지 않을 수 있어서 주문 기록을 거래소에서 가져와서 저장하는거로 바꾸기