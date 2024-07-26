// Delay function to wait for a specified number of milliseconds
export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}