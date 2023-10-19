import { Request, Response } from 'express';
import { connect } from '../database';
import { ItradeOrderHeader } from '../interface/tradeOrder.interface'
import { IcreateClient } from '../interface/createClient.interface'
import { RowDataPacket } from 'mysql2';

export class TradeOrder {

    /**Obtener el numero del pedido deacuerdo al almacén */

    static getNumberOrder = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const idalm = req.params.idalmacen;
            const number = await conn.query(`SELECT
        numero
      FROM
        pedidos
      WHERE
        idalmacen = ${idalm} AND numero > 0;`);
            if (conn) {
                await conn.end()
            }
            return res.json(number[0]);
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }
    }

    /**Obtener productos activos */

    static getProducts = async (req: Request, res: Response) => {

        try {

            const conn = await connect();
            const idalmacen = req.params.idalmacen;
            const limit = Number(req.query.limit) || 2;
            const page = Number(req.query.page) || 1;
            const offset = (page - 1) * limit;
            const descripcion = req.query.descripcion || '';
            const barcode = req.query.barcode || '';

            const [products] = await conn.query<RowDataPacket[]>(`SELECT
            p.idproducto, p.costo, p.ultcosto, p.codiva, p.precioventa, p.precioespecial1, p.precioespecial2, p.descripcion, p.barcode, p.codigo, i.cantidad, alm.nomalmacen,iv.porcentaje
          FROM
            productos p
            LEFT JOIN inventario i ON p.idproducto = i.idproducto
            LEFT JOIN almacenes alm ON i.idalmacen = alm.idalmacen
            LEFT JOIN iva iv ON p.codiva = iv.codiva
          WHERE
            i.idalmacen = ${idalmacen} AND p.estado = 1
            AND (p.descripcion LIKE '%${descripcion}%')
            AND (p.barcode LIKE '%${barcode}%')
          ORDER BY
            p.idproducto
          LIMIT
          ${limit} OFFSET ${offset} 
          `);
            if (conn) {
                await conn.end()
            }
            const newProducts = products.map((product: any) => {
                let baseValue = product.precioventa;
                let taxValue = 0;
                if (product.porcentaje !== 0) {
                    let porciva = 1 + (product.porcentaje / 100);
                    baseValue = product.precioventa / porciva;
                    taxValue = product.precioventa - baseValue;
                }
                return {
                    ...product,
                    baseValue,
                    taxValue,
                }

            })
            const totalItems = products.length;
            const totalPages = Math.ceil(totalItems / limit);

            return res.json({
                newProducts,
                page: page, offset, limit,
                totalPages: totalPages
            });
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }

    }

    /**Obtener los almacenes  */
    static getWarehousestoOrders = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const warehouses = await conn.query(`SELECT idalmacen, nomalmacen FROM almacenes WHERE activo = 1`)
            if (conn) {
              await conn.end()
            }
            return res.json(warehouses[0]);
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }
    }

    /**obtener clientes */
    static getCustomer = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const limit = Number(req.query.limit) || 10;
            const page = Number(req.query.page) || 1;
            const offset = (page - 1) * limit;
            const nombres = req.query.nombres || '';
            const nit = req.query.nit || '';
            const customer = await conn.query(`SELECT
            idtercero, nombres, nit
          FROM
            terceros
          WHERE
            cliente=1  AND (nombres LIKE '%${nombres}%')
            AND (nit LIKE '%${nit}%')
          ORDER BY
            idtercero
          LIMIT
          ${limit} OFFSET ${offset} `)
            if (conn) {
              await conn.end()
            }
            const totalItems = customer.length;
            const totalPages = Math.ceil(totalItems / limit);
            return res.status(200).json({
                customer: customer[0],
                page: page, offset, limit,
                totalPages: totalPages
            })
        } catch (error) {
            console.log(error);
            return res.status(404).json({ error: error })
        }
    }
    /**obtener empleados (vendedores) */
    static getEmployee = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const employee = await conn.query(`SELECT
                   idtercero, nombres, nit
                 FROM
                  terceros
                 WHERE 
                 empleado = 1 AND otros = 1;`)
            if (conn) {
                await conn.end()
            }
            return res.status(200).json({ employee: employee[0] })

        } catch (error) {
            console.log(error);
            return res.status(404).json({ error: error })
        }
    }

    /**Insertar la orden y el detalle */
    static insertOrder = async (req: Request, res: Response) => {
        try {
            const pool = await connect();
            const conn = await pool.getConnection();
            try {
                await conn.query(`START TRANSACTION`);
                const newOrder: ItradeOrderHeader = req.body;

                const [responseOrder] = await conn.query(`INSERT INTO pedidos (numero,idtercero,fecha,idvendedor,subtotal,valortotal,valimpuesto,valiva,valdescuentos,valretenciones,detalle,fechacrea,hora,plazo,idalmacen,estado,idsoftware)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [newOrder.numero, newOrder.idtercero, newOrder.fecha, newOrder.idvendedor, newOrder.subtotal, newOrder.valortotal, newOrder.valimpuesto, newOrder.valiva, newOrder.valdescuentos, newOrder.valretenciones, newOrder.detalle, newOrder.fechacrea, newOrder.hora, newOrder.plazo, newOrder.idalmacen, newOrder.estado, newOrder.idsoftware]);
                const result = Object.values(JSON.parse(JSON.stringify(responseOrder)));
                const insertId = await conn.query(`SELECT LAST_INSERT_ID();`)
                let destructuringInsertId = JSON.stringify(insertId[0])

                if (destructuringInsertId) {

                    newOrder.detpedidos.forEach(async (item) => {
                        destructuringInsertId = item.idpedido
                        await conn.query(`INSERT INTO detpedidos (idpedido,idproducto,cantidad,valorprod,descuento,porcdesc,codiva,porciva,ivaprod,costoprod,base,despachado)
                               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [destructuringInsertId, item.idproducto, item.cantidad, item.valorprod, item.descuento, item.porcdesc, item.codiva, item.porciva, item.ivaprod, item.costoprod, item.base, item.despachado]);
                    })
                } else {
                    return res.status(400).json({ message: "id not found !!!" })
                }
                await conn.query(`COMMIT`);
                if (responseOrder)
                    return res.status(200).json({ id: destructuringInsertId, responseOrder, ...newOrder, });
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

    /*obtener el id del ultimo pedido insertado*/
    static getIdTradeOrder = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const idTrade = await conn.query(`SELECT
        idpedido
      FROM
        pedidos;`)
            if (conn) {
                conn.end(); // Cerrar la conexión si está definida.
                console.log('La conexión se cerró correctamente.');
            }
            return res.status(200).json(idTrade[0])
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }
    }

    /**
     * Consultar el pedido ingresado por aplicación
    */
    static ordersByWarehouseAndNumber = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const numero = req.params.numero;
            const idAlm = req.params.idalmacen;
            const response = await conn.query(`SELECT
            p.numero, prod.idproducto, p.valimpuesto, p.subtotal, p.valdescuentos, p.valortotal, prod.descripcion, dtp.valorprod, dtp.descuento, dtp.porcdesc, p.fecha, p.hora, t.nombres, t.nit, t.apellidos, dtp.cantidad, alm.nomalmacen
          FROM
            detpedidos dtp
            LEFT JOIN productos prod ON dtp.idproducto = prod.idproducto
            LEFT JOIN pedidos p ON dtp.idpedido = p.idpedido
            LEFT JOIN terceros t ON p.idtercero = t.idtercero
            LEFT JOIN almacenes alm ON p.idalmacen = alm.idalmacen
          WHERE
            numero= ${numero} AND p.idalmacen = ${idAlm};`)
            return res.status(200).json(response[0])

        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }
    }

    /**Crear cliente */
    static createClient = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const client: IcreateClient = req.body;

            const responseClient = await conn.query(`INSERT INTO terceros SET?`, [client]);
            return res.status(200).json({
                data: responseClient,
                client: client,
                message: "client created successfully"
            });

        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }

    }

}



