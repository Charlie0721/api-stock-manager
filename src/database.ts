import { createPool } from 'mysql2/promise';

export async function connect() {
    const maxConnectionAttempts = 3;

    for (let attempt = 1; attempt <= maxConnectionAttempts; attempt++) {
        try {
            const connection = createPool({
                host: process.env.HOST,
                user: process.env.USER,
                database: process.env.DATABASE,
                password: process.env.PASSWORD,
                connectionLimit: 50,
                waitForConnections: true,
                connectTimeout: 3000000,
                queueLimit: 100
            });

            return connection;
        } catch (error) {
            console.error(`Error al conectar a la base de datos (Intento ${attempt}):`, error);

            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    console.error("No se pudo establecer una conexión a la base de datos después de varios intentos.");
    throw new Error("Error al conectar a la base de datos.");
}
