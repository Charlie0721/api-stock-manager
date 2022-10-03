import { Request, Response } from 'express';
import { connect } from '../database';
import { ItradeOrderHeader } from '../interface/tradeOrder.interface'
import { IcreateClient } from '../interface/createClient.interface'


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
          
            return res.json(number[0]);


        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }


    }

    /**Obtener productos activos */

    static getProducts = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const idalmacen = req.params.idalmacen;
            const products = await conn.query(`SELECT productos.idproducto, productos.costo, productos.ultcosto, productos.codiva, productos.precioventa, productos.descripcion,productos.barcode,productos.codigo, inventario.cantidad, almacenes.nomalmacen 
            FROM inventario
            INNER JOIN productos ON inventario.idproducto = productos.idproducto 
            INNER JOIN almacenes ON inventario.idalmacen = almacenes.idalmacen 
            WHERE inventario.idalmacen= ${idalmacen}`);
            return res.json(products[0]);
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
            const customer = await conn.query(`SELECT
            idtercero, nombres, nit
          FROM
            terceros
          WHERE
            cliente=1;`)
            return res.status(200).json({ customer: customer[0] })

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


                const [responseOrder] = await conn.query(`INSERT INTO pedidos (numero,idtercero,fecha,subtotal,valortotal,valdescuentos,valretenciones,idalmacen,idvendedor,estado)
                VALUES (?,?,?,?,?,?,?,?,?,?)`, [newOrder.numero, newOrder.idtercero, newOrder.fecha, newOrder.subtotal, newOrder.valortotal, newOrder.valdescuento, newOrder.valretenciones, newOrder.idalmacen, newOrder.idvendedor, newOrder.estado]);

                const result = Object.values(JSON.parse(JSON.stringify(responseOrder)));
                newOrder.detpedidos.forEach(async (item) => {
                    result[2] = item.idpedido
                    await conn.query(`INSERT INTO detpedidos (idpedido,idproducto,cantidad,valorprod,descuento,codiva,porciva,costoprod,despachado)
                    VALUES (?,?,?,?,?,?,?,?,?)`, [item.idpedido, item.idproducto, item.cantidad, item.valorprod, item.descuento, item.codiva, item.porciva, item.costoprod, item.despachado]);

                })
                await conn.query(`COMMIT`);
                if (responseOrder)
                    return res.status(200).json({ responseOrder, ...newOrder });
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
            pedidos.numero, pedidos.valimpuesto, pedidos.subtotal, pedidos.valdescuentos, pedidos.valortotal, productos.descripcion, detpedidos.valorprod, detpedidos.descuento, detpedidos.porcdesc, pedidos.fecha, terceros.nombres, terceros.apellidos, detpedidos.cantidad
            FROM
            detpedidos
            LEFT JOIN productos ON detpedidos.idproducto = productos.idproducto
            LEFT JOIN pedidos ON detpedidos.idpedido= pedidos.idpedido
            LEFT JOIN terceros ON pedidos.idtercero = terceros.idtercero
            WHERE
            numero= ${numero} AND pedidos.idalmacen = ${idAlm};`)
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



