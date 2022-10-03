import { Request, Response } from 'express'
import { connect } from '../database'




export const allProducts = async (req: Request, res: Response) => {


    try {

        const conn = await connect();
        const productos = await conn.query(`SELECT
        productos.idproducto, productos.barcode, productos.costo, productos.ultcosto,productos.codigo, productos.descripcion, productos.precioventa,
        productos.precioespecial1, productos.precioespecial2
      FROM
        productos
      WHERE
        estado = 1`)

        if (productos.length > 0) {
            return res.json(productos[0]);
        } else {
            return res.json({ message: 'products not found' })

        }


    } catch (error) {
        console.log(error)
    }

}