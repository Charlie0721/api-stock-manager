import { Request, Response } from 'express'
import { connect } from '../database'
import { IFechas } from '../interface/fechas.interface'

export const SearchPrices = async (req: Request, res: Response) => {

    try {

        const newPrices: IFechas = req.body;

        const conn = await connect();
        const response = await conn.query(`SELECT a.idproducto, c.descripcion, c.codigo, c.barcode, precioalm(c.idproducto, 1, 1) AS precioventa, precioalm(c.idproducto, 1, 2) AS precioespecial1, c.referencia, c.equipum, c.nomequipum
        FROM detcompras a
        LEFT JOIN compras b ON (a.idcompra = b.idcompra)
        LEFT JOIN productos c ON (a.idproducto = c.idproducto)
        WHERE b.estado = 0 AND b.aprobada = 1 AND b.tipocompra = 1 AND b.fecha BETWEEN ${newPrices.fecha1} AND ${newPrices.fecha2} AND a.modiprecio = 1
        GROUP BY a.idproducto`)

        return res.json(response[0])

    } catch (err) {
        console.log(err)
    }

}

