import { createPool } from 'mysql2/promise';
import {DATABASE,HOST,PASSWORD,USER} from './config/constants';
export async function connect() {
    const maxConnectionAttempts = 5;
    const retryDelay = 5000; 
    for (let attempt = 1; attempt <= maxConnectionAttempts; attempt++) {
        try {
            const connection = createPool({
                host: HOST,
                user: USER,
                database: DATABASE,
                password: PASSWORD,
                connectionLimit: 100,
                waitForConnections: true,
                connectTimeout: 3000000,
                queueLimit: 0
            });
            return connection;
        } catch (error) {
            // console.error(`Error al conectar a la base de datos (Intento ${attempt}):`, error);

            // await new Promise(resolve => setTimeout(resolve, 5000));
            if (attempt < maxConnectionAttempts) {
                console.log(`Reintentando en ${retryDelay / 1000} segundos...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
                console.error("No se pudo establecer una conexión a la base de datos después de varios intentos.");
                throw new Error("Error al conectar a la base de datos.");
            }
        }
    }
    console.error("No se pudo establecer una conexión a la base de datos después de varios intentos.");
    throw new Error("Error al conectar a la base de datos.");
}
