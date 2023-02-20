import { Request, Response } from 'express'
import { connect } from '../database'
import Redis from 'ioredis';

const redis = new Redis({
    host: 'localhost',
    port: 6379,
});

/**
 * Traer productos con cantidades 
 */


export const inventoryQuantities = async (req: Request, res: Response) => {

    try {
        const key = "products"
        const cachedData = await redis.get(key);
        const conn = await connect();

        if (cachedData) {
            res.json(JSON.parse(cachedData));
        } else {
            const responseQuantities = await conn.query(`SELECT productos.idproducto,productos.barcode, productos.codigo, productos.descripcion, inventario.cantidad, almacenes.nomalmacen
            FROM inventario
            INNER JOIN productos ON inventario.idproducto = productos.idproducto
            INNER JOIN almacenes ON inventario.idalmacen = almacenes.idalmacen ORDER BY productos.idproducto`)
            await redis.set(key, JSON.stringify(responseQuantities[0]));
            return res.status(200).json(responseQuantities[0])
        }


    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }


}

