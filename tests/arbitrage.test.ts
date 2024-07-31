// import { executeArbitrage } from '../src/trading/executeArbitrage';
// import { tokensArray } from '../src/trading/strategy';
// import * as manageOrders from '../src/trading/manageOrders';
// import * as orderlyMarket from '../src/orderly/market';
// import * as monitorPositions from '../src/trading/monitorPositions';
// import * as recordTrade from '../src/db/queries';
// import { QueryResult } from 'pg';

// jest.mock('../src/trading/manageOrders');
// jest.mock('../src/orderly/market');
// jest.mock('../src/trading/monitorClosePositions');
// jest.mock('../src/db/recordTrade');

// describe('Arbitrage Bot', () => {
//   const token = tokensArray[0];

//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should execute arbitrage and save data correctly', async () => {
//     // Mock functions
//     const mockPlaceNewOrder = jest.spyOn(manageOrders, 'placeNewOrder').mockResolvedValue({
//       longPositionId: 1,
//       shortPositionId: 2
//     });
//     const mockGetOrderlyPrice = jest.spyOn(orderlyMarket, 'getOrderlyPrice').mockResolvedValue(100);
//     const mockHandleOrder = jest.spyOn(manageOrders, 'handleOrder').mockResolvedValue({
//       longPositionPrice: 99,
//       shortPositionPrice: 101
//     });
//     const mockEnterShortPosition = jest.spyOn(manageOrders, 'enterShortPosition').mockResolvedValue(100);
//     const mockEnterLongPosition = jest.spyOn(manageOrders, 'enterLongPosition').mockResolvedValue(100);
//     const mockMonitorClosePositions = jest.spyOn(monitorPositions, 'monitorClosePositions').mockResolvedValue(undefined);
//     const mockRecordTrade = jest.spyOn(recordTrade, 'recordTrade').mockResolvedValue({
//       command: '',
//       rowCount: 0,
//       oid: 0,
//       rows: [],
//       fields: []
//     } as QueryResult);

//     await executeArbitrage(token);

//     // Assertions
//     expect(mockPlaceNewOrder).toHaveBeenCalled();
//     expect(mockGetOrderlyPrice).toHaveBeenCalled();
//     expect(mockHandleOrder).toHaveBeenCalled();
//     expect(mockEnterShortPosition).toHaveBeenCalled();
//     expect(mockEnterLongPosition).toHaveBeenCalled();
//     expect(mockMonitorClosePositions).toHaveBeenCalled();
//     expect(mockRecordTrade).toHaveBeenCalled();

//     const tokenState = token.state;
//     expect(tokenState.getInitialPriceDifference()).not.toBe(0);
//     expect(tokenState.getClosePriceDifference()).not.toBe(0);
//     expect(tokenState.getEnterPrice()).not.toBe(0);
//     expect(tokenState.getClosePrice()).not.toBe(0);
//   });
// });