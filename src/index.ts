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

// TODO: 바이낸스랑 오덜리 함수들 클래스화
// TODO: 코인 별로 가격 차이값(%) 가져와서 분석시키기 -> 최적 아비트리지 값 찾기

async function init() {

    //tokens[] = token1, token2, ....여러개의 인터페이스
    //현재는 TON으로 실행

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