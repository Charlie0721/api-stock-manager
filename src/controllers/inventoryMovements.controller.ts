import { Request, Response } from 'express'
import { connect } from '../database'
import { IIngMovInvEntrada } from '../interface/movementInventory.interface';
import Redis from 'ioredis';
const redis = new Redis({
    host: 'localhost',
    port: 6379,
});

export class InventoryMovements {

    /**
     * concoer el numero de movimiento de inventario
     */
    static numberOfEntrie = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const idalm = req.params.idalmacen
            const consecutive = await conn.query(`SELECT numero, idconceptajuste FROM ctrajustes WHERE numero > 0 AND idconceptajuste = 1 AND idalmacen=${idalm}`
            )
            return res.json({

                number: consecutive[0]
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error })
        }

    }
    /**
     * Listar terceros
  
   */
    static listThirdParties = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const thirdParties = await conn.query(`SELECT idtercero, nit, nombres FROM terceros `
            )
            return res.status(200).json(thirdParties[0])

        } catch (error) {
            return res.status(500).json({ message: error })
        }

    }

    /**
     * Listar almacenes 
     */

    static listWarehouses = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const warehouses = await conn.query(`SELECT idalmacen, nomalmacen FROM almacenes WHERE activo = 1`)
            return res.status(200).json(warehouses[0])

        } catch (error) {
            return res.status(500).json({ message: error })
        }
    }
    /**
     *obtener stock de productos
    */

    static getProductStock = async (req: Request, res: Response) => {
        try {



            const key = "products-stock"
            const cachedData = await redis.get(key);
            const conn = await connect();
            const idalmacen: string = req.params.idalmacen

            if (cachedData) {
                res.json(JSON.parse(cachedData));
            } else {

                const stockProducto = await conn.query(`SELECT productos.idproducto, productos.costo, productos.precioventa, productos.descripcion,productos.barcode,productos.codigo, inventario.cantidad as cantidadAct, almacenes.nomalmacen 
                FROM inventario
                INNER JOIN productos ON inventario.idproducto = productos.idproducto 
                INNER JOIN almacenes ON inventario.idalmacen = almacenes.idalmacen 
                WHERE inventario.idalmacen= ${idalmacen} `)
                await redis.set(key, JSON.stringify(stockProducto[0]));
                return res.status(200).json(stockProducto[0])
            }

        }

        catch (error) {
            return res.status(500).json({ message: error })
        }

    }

    /**
      * Guardar el movimiento de inventario 
   */
    static saveInventoryMovement = async (req: Request, res: Response) => {

        try {
            const pool = await connect();
            const conn = await pool.getConnection();
            try {

                const pool = await connect();
                const conn = await pool.getConnection();
                await conn.query(`START TRANSACTION`);
                const newInventoryMovement: IIngMovInvEntrada = req.body;
                const [responseInventoryMovement] = await conn.query(`INSERT INTO ctrajustes (fecha,idalmacen,detalle,estado,idconceptajuste,numero,idusuario,idtercero)
                VALUES (?,?,?,?,?,?,?,?)`, [newInventoryMovement.fecha, newInventoryMovement.idalmacen, newInventoryMovement.detalle, newInventoryMovement.estado, newInventoryMovement.idconceptajuste, newInventoryMovement.numero, newInventoryMovement.idusuario, newInventoryMovement.idtercero]);
                const result = Object.values(JSON.parse(JSON.stringify(responseInventoryMovement)));

                newInventoryMovement.ajustesinv.forEach(async (item) => {
                    result[2] = item.idajuste
                    await conn.query(`INSERT INTO ajustesinv (idajuste,idproducto,idalmacen,entrada,salida) 
                    VALUES (?,?,?,?,?)`, [item.idajuste, item.idproducto, item.idalmacen, item.entrada, item.salida]);
                })
                await conn.query(`COMMIT`);
                if (responseInventoryMovement)
                    return res.status(200).json({ responseInventoryMovement, ...newInventoryMovement });

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
    static getIdMovement = async (req: Request, res: Response): Promise<Response> => {
        try {
            const conn = await connect();
            const idPurshable = await conn.query(`SELECT
            idajuste
          FROM
            ctrajustes;`)
            return res.status(200).json(idPurshable[0])
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }


    }
}

