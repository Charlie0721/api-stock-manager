import { createPool } from 'mysql2/promise';

export async function connect() {
    const connection = await createPool({

        host: process.env.HOST,
        user: process.env.USER,
        database: process.env.DATABASE,
        password: process.env.PASSWORD,
        connectionLimit: 10,
        waitForConnections:true,
        connectTimeout:3000000,
        queueLimit:0
    });
    return connection;
   
}



