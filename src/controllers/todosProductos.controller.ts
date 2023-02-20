import { Request, Response } from 'express'
import { connect } from '../database'

import Redis from 'ioredis';

const redis = new Redis({
    host: 'localhost',
    port: 6379,
});

export class Product {


    static allProducts = async (req: Request, res: Response) => {


        try {
            const key = "products"
            const cachedData = await redis.get(key);
            const conn = await connect();
            if (cachedData) {
                res.json(JSON.parse(cachedData));
            } else {
                const productos = await conn.query(`SELECT
                productos.idproducto, productos.barcode, productos.costo, productos.ultcosto,productos.codigo, productos.descripcion, productos.precioventa,
                productos.precioespecial1, productos.precioespecial2
              FROM
                productos
              WHERE
                estado = 1`)
                await redis.set(key, JSON.stringify(productos[0]));
                if (productos.length > 0) {

                    return res.json(productos[0])

                } else {
                    return res.json({ message: 'products not found' })

                }
            }


        } catch (error) {
            console.log(error)
        }

    }


}

