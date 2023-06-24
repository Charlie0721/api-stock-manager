import { Request, Response } from 'express'
import { connect } from '../database'

export class CheckSalesOfTheDay {

    static checkSales = async (req: Request, res: Response) => {

        try {
            const conn = await connect();
            let consultationDate: string = req.body.initialDate;
            console.log(consultationDate)
            const [rows] = await conn.query(`SELECT   a.fecha, a.idalmacen, a.prodvendid, e.subtot, e.ivaimp, a.costoacum, e.sumdesc, e.total, e.retencion, e.cantfact, f.valordev, e.valpropina, e.total + IF(ISNULL(e.valpropina), 0, e.valpropina) AS totalconprop, almd.nomalmacen, e.otrosimpuestos, e.impuestoinc
            FROM (SELECT a.idalmacen, a.fecha, SUM(a.valortotal) AS total, COUNT(a.idfactura) AS cantfact, SUM(a.valretenciones) AS retencion, SUM(a.valimpuesto) AS ivaimp, SUM(a.subtotal) AS subtot, SUM(a.valdescuentos) AS sumdesc, SUM(b.propina) AS valpropina, SUM(a.otrosimpuestos) otrosimpuestos, SUM(a.impuestoinc) impuestoinc
            FROM facturas a
            LEFT JOIN ordenes b ON (a.idfactura = b.idfactura)
            LEFT JOIN almacenes alm ON (a.idalmacen = alm.idalmacen)
            WHERE a.fecha =${consultationDate} AND a.estado = 0 AND alm.idempresa = 1
            GROUP BY  a.idalmacen, a.fecha
            ORDER BY  a.idalmacen, a.fecha ASC) AS e
            LEFT JOIN (SELECT a.idalmacen, a.fecha, SUM(b.valordev) AS valordev
            FROM facturas a
            LEFT JOIN devventas b ON (a.idfactura = b.idfactura)
            LEFT JOIN almacenes alm ON (a.idalmacen = alm.idalmacen)
            WHERE a.fecha =${consultationDate} AND a.estado = 0 AND alm.idempresa = 1
            GROUP BY a.idalmacen, a.fecha
            ORDER BY a.idalmacen, a.fecha ASC) f ON (e.fecha = f.fecha AND e.idalmacen = f.idalmacen)
            LEFT JOIN (SELECT a.fecha, a.idalmacen, SUM(b.cantidad) AS prodvendid, SUM(c.ultcosto * b.cantidad) AS costoacum
            FROM facturas a
            LEFT JOIN detfacturas b ON (a.idfactura = b.idfactura)
            LEFT JOIN productos c ON (b.idproducto = c.idproducto)
            LEFT JOIN iva d ON (c.codiva = d.codiva)
            LEFT JOIN almacenes alm ON (a.idalmacen = alm.idalmacen)
            WHERE a.fecha = ${consultationDate} AND a.estado = 0 AND alm.idempresa = 1
            GROUP BY a.idalmacen, a.fecha 
            ORDER BY a.idalmacen, a.fecha ASC) a ON (e.fecha = a.fecha AND a.idalmacen = e.idalmacen)
            LEFT JOIN almacenes almd ON (a.idalmacen = almd.idalmacen)
            `)
            //@ts-ignore
            if (rows.length <= 0) {

                return res.status(401).json({
                    message: `No se encontraron facturas con la fecha ${consultationDate}`
                })
            }
            return res.status(200).json({
                message: "Facturas encontradas",
                sales:rows,
              
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error })
        }
    }

}

