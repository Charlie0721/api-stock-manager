import { createPool, Pool } from 'mysql2/promise';
import { DATABASE, HOST, PASSWORD, USER } from './config/constants';

let pool: Pool | null = null;

export async function getPool(): Promise<Pool> {
    if (pool) return pool;

    const maxConnectionAttempts = 5;
    const retryDelay = 5000; 

    for (let attempt = 1; attempt <= maxConnectionAttempts; attempt++) {
        try {
            pool = createPool({
                host: HOST,
                user: USER,
                database: DATABASE,
                password: PASSWORD,
                connectionLimit: 100,
                waitForConnections: true,
                connectTimeout: 30000,
                queueLimit: 0
            });

            await pool.getConnection();
            
            console.log('Pool de conexiones creado exitosamente');
            return pool;
        } catch (error) {
            console.error(`Error al crear el pool de conexiones (Intento ${attempt}):`, error);

            if (attempt < maxConnectionAttempts) {
                console.log(`Reintentando en ${retryDelay / 1000} segundos...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
                console.error("No se pudo establecer un pool de conexiones después de varios intentos.");
                throw new Error("Error al crear el pool de conexiones.");
            }
        }
    }

    throw new Error("Error al crear el pool de conexiones.");
}

export async function getConnection() {
    const pool = await getPool();
    return pool.getConnection();
}