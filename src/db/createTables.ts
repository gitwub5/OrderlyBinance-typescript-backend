import connection from "./config";

export async function createTables() {
    try {
        console.log("Creating tables...");

        const createBinanceTradesTable = `
            CREATE TABLE IF NOT EXISTS binance_trades (
                token_name VARCHAR(50) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                side VARCHAR(4) NOT NULL, -- 'BUY' or 'SELL'
                enter_price DECIMAL(10, 4) NOT NULL,
                close_price DECIMAL(10, 4) NOT NULL,
                binance_pnl DECIMAL(10, 4) NULL,
                PRIMARY KEY (token_name, timestamp)
            )
        `;

        const createOrderlyTradesTable = `
            CREATE TABLE IF NOT EXISTS orderly_trades (
                token_name VARCHAR(50) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                side VARCHAR(4) NOT NULL, -- 'BUY' or 'SELL'
                enter_price DECIMAL(10, 4) NOT NULL,
                close_price DECIMAL(10, 4) NOT NULL,
                orderly_pnl DECIMAL(10, 4) NULL,
                PRIMARY KEY (token_name, timestamp)
            )
        `;

        const createTradesSummaryTable = `
            CREATE TABLE IF NOT EXISTS trades_summary (
                token_name VARCHAR(50) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                transaction_amount DECIMAL(20, 2),
                initial_price_difference DECIMAL(10, 4),
                close_price_difference DECIMAL(10, 4),
                binance_pnl DECIMAL(10, 4) NULL,
                orderly_pnl DECIMAL(10, 4) NULL,
                total_pnl DECIMAL(10, 4) NULL,
                win_loss_status VARCHAR(10) NULL,
                PRIMARY KEY (token_name, timestamp)
            )
        `;

        await connection.execute(createBinanceTradesTable);
        await connection.execute(createOrderlyTradesTable);
        await connection.execute(createTradesSummaryTable);

        console.log("Tables created successfully.");
    } catch (error) {
        console.error("Error creating tables:", error);
    }
}