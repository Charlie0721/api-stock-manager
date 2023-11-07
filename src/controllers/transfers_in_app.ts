import { Request, Response } from 'express'
import { connect } from '../database'
import { ITransfer } from '../interface/transfers.interface'

export class TransfersToCxPos {

    /**Obtener El numero de traslados  */
    static getNumberTransfers = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const originNumbreTransfer = await conn.query(`SELECT
              COUNT(numtrasladoorigen) as result
            FROM
              traslados
            WHERE
              numtrasladoorigen > 0 `)

            return res.json(originNumbreTransfer[0])

        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error });
        }
    }

    /**Obtener los almacenes  */
    static getWarehousestoTransfer = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const warehouses = await conn.query(`SELECT idalmacen, nomalmacen FROM almacenes WHERE activo = 1`)
            return res.json(warehouses[0]);
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }

    }

    /**Obtener productos según almacen de Origen */

    static getProducts = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const idalmacen: string = req.params.idalmacen;
        
            const limit = Number(req.query.limit) || 2;
            const page = Number(req.query.page) || 1;
            const offset = (page - 1) * limit;
            const descripcion = req.query.descripcion || '';
            const barcode = req.query.barcode || '';
        
            const stockProducto = await conn.query(`
                SELECT
                    p.idproducto, p.costo, p.precioventa AS precio, p.descripcion, i.cantidad AS cantidadAct, alm.nomalmacen
                FROM
                    inventario i
                INNER JOIN productos p ON i.idproducto = p.idproducto
                INNER JOIN almacenes alm ON i.idalmacen = alm.idalmacen
                LEFT JOIN barrasprod brp ON p.idproducto = brp.idproducto
                WHERE
                    i.idalmacen = ? AND p.estado = 1
                    AND (p.descripcion LIKE ?)
                    AND (p.barcode LIKE ? OR brp.barcode LIKE ?)
                ORDER BY
                    p.idproducto
                LIMIT ? OFFSET ?
            `, [idalmacen, `%${descripcion}%`, `%${barcode}%`, `%${barcode}%`, limit, offset]);
        
            if (conn) {
                await conn.end();
            }
        
            if (stockProducto.length > 0) {
                const totalItems = stockProducto.length;
                const totalPages = Math.ceil(totalItems / limit);
                return res.status(200).json({
                    stock: stockProducto[0],
                    page: page, offset, limit,
                    totalPages: totalPages
                });
            } else {
                return res.status(404).json({ message: 'data not found' });
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error });
        }
    }

    /**Enviar traslados */
    static sendTransfer = async (req: Request, res: Response) => {


        try {
            const pool = await connect();
            const conn = await pool.getConnection();
            try {

                await conn.query(`START TRANSACTION`);
                const newTransfer: ITransfer = req.body;
                const [responseTransfer] = await conn.query(`INSERT INTO traslados (fecha,detalle,tipotraslado,estado,idalmacen,idalmdest,fechacrea,hora,documento,numtrasladoorigen)
                VALUES (?,?,?,?,?,?,?,?,?,?)`, [newTransfer.fecha, newTransfer.detalle, newTransfer.tipotraslado, newTransfer.estado, newTransfer.idalmacen,
                newTransfer.idalmdest, newTransfer.fechacrea, newTransfer.hora, newTransfer.documento, newTransfer.numtrasladoorigen])
                const result = Object.values(JSON.parse(JSON.stringify(responseTransfer)));
                const insertId = await conn.query(`SELECT LAST_INSERT_ID();`)
                let destructuringInsertId = JSON.stringify(insertId[0])
                if (destructuringInsertId) {
                    newTransfer.dettraslado.forEach(async (item) => {
                        destructuringInsertId = item.idtraslado
                        await conn.query(`INSERT INTO  dettraslado (idtraslado,idproducto,cantidad,idalmacendest,costo,precio)
                        VALUES (?,?,?,?,?,?) `, [destructuringInsertId, item.idproducto, item.cantidad, item.idalmacendest, item.costo, item.precio])
                    })
                } else {
                    return res.status(400).json({ message: "id not found !!!" })
                }
                await conn.query(`COMMIT`);
                if (responseTransfer)
                    return res.status(200).json({
                        id: destructuringInsertId,
                        responseTransfer, ...newTransfer
                    });

            } catch (error) {
                await conn.query(`ROLLBACK`);
                console.log(error);
                return res.status(500).json({ error: error })
            }

        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }
    }
    /*obtener el id del ultimo traslado insertado*/
    static getIdTransfer = async (req: Request, res: Response): Promise<Response> => {
     
        try {
            const conn = await connect();
            const idTrade = await conn.query(`SELECT
            idtraslado
          FROM
            traslados;`)
            if (conn) {
               await conn.end()
              }
            return res.status(200).json(idTrade[0])
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        } 
    }
}



