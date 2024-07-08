import { manageArbitrage } from './trading/executeArbitrage';
import { cancelAllOrders, closePositions } from './trading/closePositions';
import { createTables } from './db/createTables';
import { setShouldStop, setForceStop } from './globals';
import { token } from './types/tokenTypes';
import { tokensArray } from './trading/stratgy';

//여러 토큰 한 번에 병렬 처리
async function manageMultipleTokens(tokens: token[]) {
    const tasks = tokens.map(token => manageArbitrage(token));
    await Promise.all(tasks);
}

// TODO: 바이낸스랑 오덜리 함수들 클래스화
// TODO: 코인 별로 가격 차이값(%) 가져와서 분석시키기 -> 최적 아비트리지 값 찾기
async function init() {
    //토큰 선택
    const selectedTokens = [
        tokensArray[0],
        tokensArray[1],
        tokensArray[2],
        tokensArray[3],
        tokensArray[4],
        tokensArray[5],
        tokensArray[6]
    ];
    // const selectedTokens = tokensArray.slice(0, 5);

    await createTables();

    process.on('SIGINT', async () => {
        setForceStop(true);
        setShouldStop(true);
        console.log('Received SIGINT. Stopping manageOrders...');
        try {
            await Promise.all(tokensArray.map(token => closePositions(token)));
            await Promise.all(tokensArray.map(token => cancelAllOrders(token)));
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
    await Promise.all(tokensArray.map(token => closePositions(token)));
    await Promise.all(tokensArray.map(token => cancelAllOrders(token)));
    process.exit(1);
});