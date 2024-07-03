import connection from "./config";

export async function createTables() {
    try {
        console.log("Create table...");

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS trades (
                id INT AUTO_INCREMENT PRIMARY KEY,
                buy_price DECIMAL(10, 4),
                sell_price DECIMAL(10, 4),
                amount DECIMAL(10, 4),
                profit DECIMAL(10, 4),
                arbitrage_threshold DECIMAL(10, 4),
                close_threshold DECIMAL(10, 4),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await connection.execute(createTableQuery);
        console.log("Table created successfully.");
    } catch (error) {
        console.error("Error creating table:", error);
    }
}