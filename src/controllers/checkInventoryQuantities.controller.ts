import { Request, Response } from 'express'
import { connect } from '../database'


/**
 * Traer productos con cantidades 
 */


export const inventoryQuantities = async (req: Request, res: Response): Promise<Response> => {

    try {
        const conn = await connect();
        const responseQuantities = await conn.query(`SELECT productos.idproducto,productos.barcode, productos.codigo, productos.descripcion, inventario.cantidad, almacenes.nomalmacen
        FROM inventario
        INNER JOIN productos ON inventario.idproducto = productos.idproducto
        INNER JOIN almacenes ON inventario.idalmacen = almacenes.idalmacen ORDER BY productos.idproducto`)

        return res.status(200).json(responseQuantities)

    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }


}

