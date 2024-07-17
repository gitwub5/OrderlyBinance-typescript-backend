import axios from 'axios';
import fs from 'fs';
import { ORDERLY_API_URL, BINANCE_API_URL } from '../utils';

async function getOrderlySymbols(): Promise<string[]> {
  try {
    const response = await axios.get(`${ORDERLY_API_URL}/v1/public/info`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;

    if (!data.success) {
      throw new Error('Error fetching symbols: API response unsuccessful');
    }

    return data.data.rows.map((symbolInfo: any) => symbolInfo.symbol);
  } catch (error) {
    console.error('Error fetching symbols:', error);
    throw error;
  }
}

async function getBinanceSymbols(): Promise<string[]> {
  try {
    const response = await axios.get(`${BINANCE_API_URL}/fapi/v1/exchangeInfo`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;

    return data.symbols.map((symbolInfo: any) => symbolInfo.symbol);
  } catch (error) {
    console.error('Error fetching symbols from Binance:', error);
    throw error;
  }
}

export function extractSymbol(orderlySymbol: string): string {
  const match = orderlySymbol.match(/^PERP_([A-Z0-9]+)_USDC$/);
  return match ? match[1] : '';
}

export function extractBaseSymbol(binanceSymbol: string): string {
  return binanceSymbol.slice(0, -4);
}

export function reconstructOrderlySymbol(symbol: string): string {
  return `PERP_${symbol}_USDC`;
}

export function reconstructBinanceSymbol(symbol: string): string {
  return `${symbol}USDT`;
}

async function saveCommonSymbolsToFile() {
  try {
    const orderlySymbols = await getOrderlySymbols();
    const binanceSymbols = await getBinanceSymbols();

    const orderlyExtracted = orderlySymbols.map(extractSymbol).filter(symbol => symbol !== '');
    const binanceExtracted = binanceSymbols.map(extractBaseSymbol);

    const commonSymbols = orderlyExtracted.filter(symbol => binanceExtracted.includes(symbol));
    console.log('Common Symbols:', commonSymbols);

    const orderlyCommonSymbols = commonSymbols.map(reconstructOrderlySymbol);
    const binanceCommonSymbols = commonSymbols.map(reconstructBinanceSymbol);

    console.log('Orderly Common Symbols:', orderlyCommonSymbols);
    console.log('Binance Common Symbols:', binanceCommonSymbols);

    // TypeScript 파일로 저장
    const tsContent = `
export const commonSymbols = ${JSON.stringify(commonSymbols, null, 2)};
export const orderlyCommonSymbols = ${JSON.stringify(orderlyCommonSymbols, null, 2)};
export const binanceCommonSymbols = ${JSON.stringify(binanceCommonSymbols, null, 2)};
`;

    fs.writeFileSync('src/utils/commonSymbols.ts', tsContent);
    console.log('Symbols saved to src/utils/commonSymbols.ts');
  } catch (error) {
    console.error('Error:', error);
  }
}