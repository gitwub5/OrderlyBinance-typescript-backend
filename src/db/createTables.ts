import connection from "./config";

export async function createTables() {
    try {
        console.log("Create table...");

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS trades (
                token_name VARCHAR(50) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                initial_price_difference DECIMAL(10, 4),
                close_price_difference DECIMAL(10, 4),
                binance_enter_price DECIMAL(10, 4),
                binance_close_price DECIMAL(10, 4),
                transaction_amount DECIMAL(20, 2),
                win_loss_status VARCHAR(10),
                PRIMARY KEY (token_name, timestamp),
                UNIQUE KEY (timestamp)
            )
        `;

        await connection.execute(createTableQuery);
        console.log("Table created successfully.");
    } catch (error) {
        console.error("Error creating table:", error);
    }
}