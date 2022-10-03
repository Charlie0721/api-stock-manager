import { Request, Response } from 'express'
import { connect } from '../database'
import { IEditProduct } from '../interface/updateProduct.interface'

export const UpdateProduct = async (req: Request, res: Response) => {

    try {

        const conn = await connect();

        const id: number = parseInt(req.params.idproducto);

        const editProduct: IEditProduct = req.body

        const productUpdated = await conn.query(`UPDATE productos set ? WHERE idproducto= ?`, [editProduct, id]
        )
        return res.json({
            message: 'product updated succesfully',
            product: productUpdated[0]
        })


    } catch (err) {
        console.log(err)
    }

}
export const getProductById = async (req: Request, res: Response) => {

    try {

        const conn = await connect();
        const id: string = req.params.idproducto;
        const ProductByID = await conn.query(`SELECT productos.idproducto, productos.barcode, productos.costo, productos.ultcosto, 
        productos.descripcion, productos.precioventa, productos.precioespecial1, productos.precioespecial2
        FROM productos
        WHERE idproducto=${id} `)
        return res.status(200).json(ProductByID[0])
    } catch (error) {
        console.log(error)
    }


}


