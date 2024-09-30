import { Request, Response } from "express";
import { getConnection } from "../database";
import { IIngMovInvEntrada } from "../interface/movementInventory.interface";

export class InventoryMovements {
  /**
   * conocer el numero de movimiento de inventario
   */
  static numberOfEntrie = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;
    try {
      conn = await getConnection();
      const idalm = req.params.idalmacen;
      const consecutive = await conn.query(
        `SELECT numero, idconceptajuste FROM ctrajustes WHERE numero > 0 AND idconceptajuste = 1 AND idalmacen=${idalm}`
      );
      if (conn) {
        await conn.end();
      }
      return res.json({
        number: consecutive[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  };
  /**
     * Listar terceros
  
   */
  static listThirdParties = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;
    try {
      conn = await getConnection();
      const limit = Number(req.query.limit) || 10;
      const page = Number(req.query.page) || 1;
      const offset = (page - 1) * limit;
      const nombres = req.query.nombres || "";
      const nit = req.query.nit || "";
      const thirdParties =
        await conn.query(`SELECT idtercero, nit, nombres FROM terceros 
            WHERE (nombres LIKE '%${nombres}%')
            AND (nit LIKE '%${nit}%')
          ORDER BY
            idtercero
          LIMIT
          ${limit} OFFSET ${offset}  `);
      if (conn) {
        await conn.end();
      }
      const totalItems = thirdParties.length;
      const totalPages = Math.ceil(totalItems / limit);
      return res.status(200).json({
        third: thirdParties[0],
        page: page,
        offset,
        limit,
        totalPages: totalPages,
      });
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  };

  /**
   * Listar almacenes
   */

  static listWarehouses = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;
    try {
      conn = await getConnection();
      const warehouses = await conn.query(
        `SELECT idalmacen, nomalmacen FROM almacenes WHERE activo = 1`
      );
      return res.status(200).json(warehouses[0]);
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  };
  /**
   *obtener stock de productos
   */

  static getProductStock = async (req: Request, res: Response) => {
    let conn;
    try {
      conn = await getConnection();
      const idalmacen: string = req.params.idalmacen;
      const limit = Number(req.query.limit) || 2;
      const page = Number(req.query.page) || 1;
      const offset = (page - 1) * limit;
      const descripcion = req.query.descripcion || "";
      const barcode = req.query.barcode || "";

      const stockProducto = await conn.query(
        `
                SELECT
                    p.idproducto, p.costo, p.precioventa, p.descripcion, p.barcode, p.codigo, i.cantidad AS cantidadAct, alm.nomalmacen
                FROM
                    inventario i
                INNER JOIN productos p ON i.idproducto = p.idproducto
                INNER JOIN almacenes alm ON i.idalmacen = alm.idalmacen
                LEFT JOIN barrasprod brp ON p.idproducto = brp.idproducto
                WHERE
                    i.idalmacen = ? AND p.estado = 1
                    AND (p.descripcion LIKE ?)
                    AND (p.barcode LIKE ?)
                    OR (brp.barcode LIKE ?)
                ORDER BY
                    p.idproducto
                LIMIT ? OFFSET ?
            `,
        [
          idalmacen,
          `%${descripcion}%`,
          `%${barcode}%`,
          `%${barcode}%`,
          limit,
          offset,
        ]
      );

      if (conn) {
        await conn.end();
      }

      if (stockProducto.length > 0) {
        const totalItems = stockProducto.length;
        const totalPages = Math.ceil(totalItems / limit);
        return res.status(200).json({
          stock: stockProducto[0],
          page: page,
          offset,
          limit,
          totalPages: totalPages,
        });
      } else {
        return res.status(404).json({ message: "data not found" });
      }
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  };

  /**
   * Guardar el movimiento de inventario
   */
  static saveInventoryMovement = async (req: Request, res: Response) => {
    const conn = await getConnection();

    try {
      await conn.query(`START TRANSACTION`);
      const newInventoryMovement: IIngMovInvEntrada = req.body;
      const [responseInventoryMovement] = await conn.query(
        `INSERT INTO ctrajustes (fecha,idalmacen,detalle,estado,idconceptajuste,numero,idusuario,idtercero)
                VALUES (?,?,?,?,?,?,?,?)`,
        [
          newInventoryMovement.fecha,
          newInventoryMovement.idalmacen,
          newInventoryMovement.detalle,
          newInventoryMovement.estado,
          newInventoryMovement.idconceptajuste,
          newInventoryMovement.numero,
          newInventoryMovement.idusuario,
          newInventoryMovement.idtercero,
        ]
      );
      const result = Object.values(
        JSON.parse(JSON.stringify(responseInventoryMovement))
      );

      newInventoryMovement.ajustesinv.forEach(async (item) => {
        result[2] = item.idajuste;
        await conn.query(
          `INSERT INTO ajustesinv (idajuste,idproducto,idalmacen,entrada,salida) 
                    VALUES (?,?,?,?,?)`,
          [
            item.idajuste,
            item.idproducto,
            item.idalmacen,
            item.entrada,
            item.salida,
          ]
        );
      });
      await conn.query(`COMMIT`);
      if (responseInventoryMovement)
        return res
          .status(200)
          .json({ responseInventoryMovement, ...newInventoryMovement });
      conn.end();
    } catch (error) {
      await conn.query(`ROLLBACK`);
      console.log(error);
      return res.status(500).json({ error: error });
    } finally {
      conn.release();
    }
  };

  /*obtener el id del ultimo pedido insertado*/
  static getIdMovement = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;

    try {
      conn = await getConnection();

      const idPurshable = await conn.query(`SELECT
            idajuste
          FROM
            ctrajustes;`);
      if (conn) {
        await conn.end();
      }
      return res.status(200).json(idPurshable[0]);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    } finally {
      if (conn) conn.release();
    }
  };
}
