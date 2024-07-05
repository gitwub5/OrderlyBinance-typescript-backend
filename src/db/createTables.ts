import connection from "./config";

export async function createTables() {
    try {
        console.log("Create table...");

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS trades (
                token_name VARCHAR(50) NOT NULL,
                id INT AUTO_INCREMENT,
                initial_price_difference DECIMAL(10, 4),
                close_price_difference DECIMAL(10, 4),
                buy_price DECIMAL(10, 4),
                sell_price DECIMAL(10, 4),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (token_name, id),
                UNIQUE KEY (id)
            )
        `;

        await connection.execute(createTableQuery);
        console.log("Table created successfully.");
    } catch (error) {
        console.error("Error creating table:", error);
    }
}
