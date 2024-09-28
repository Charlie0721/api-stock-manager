import { Request, Response } from "express";
import { connect } from "../database";
import { IHeaderPurchases } from "../interface/recordPurchases.interface";

export class ChargePurchases {
  /**
   * Traer datos basicos de productos activos
   */
  static activeProductsToPurchases = async (req: Request, res: Response) => {
    const conn = await connect();
    try {
      const limit = Number(req.query.limit) || 2;
      const page = Number(req.query.page) || 1;
      const offset = (page - 1) * limit;
      const descripcion = req.query.descripcion || "";
      const barcode = req.query.barcode || "";

      const products = await conn.query(
        `
                SELECT
                    p.idproducto, p.descripcion, p.barcode, p.codigo, p.costo, p.codiva, p.precioventa
                FROM
                    productos p
                LEFT JOIN barrasprod brp ON p.idproducto = brp.idproducto
                WHERE
                    p.estado = 1 AND (p.descripcion LIKE ?)
                    AND (p.barcode LIKE ? OR brp.barcode LIKE ?)
                ORDER BY
                    p.idproducto
                LIMIT ? OFFSET ?
            `,
        [`%${descripcion}%`, `%${barcode}%`, `%${barcode}%`, limit, offset]
      );

      const totalItems = products.length;
      const totalPages = Math.ceil(totalItems / limit);
      return res.json({
        products: products[0],
        page: page,
        offset,
        limit,
        totalPages: totalPages,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  };

  /**
   * Consultar numero de compra por almacen
   */

  static numberPurchase = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const conn = await connect();
      const idalm = req.params.idalmacen;
      const response = await conn.query(`SELECT
            numero
        FROM
            compras
        WHERE
            idalmacen =${idalm} AND numero > 0;`);
      if (conn) {
        console.log("La conexión se cerró correctamente.");
      }
      return res.json(response[0]);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    }
  };

  /**
   * Traer almacenes activos
   */
  static getWarehousestoPurchases = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const conn = await connect();
      const warehouses = await conn.query(
        `SELECT idalmacen, nomalmacen FROM almacenes WHERE activo = 1`
      );
      if (conn) {
        await conn.end();
      }
      return res.json(warehouses[0]);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    }
  };

  /**
   * Listar terceros marcados como proveedores
   */

  static getSuppliers = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const pool = await connect();
    const conn = await pool.getConnection();

    try {
      const suppliers = await conn.query(
        `SELECT idtercero, nombres, nit FROM terceros WHERE proveedor = 1`
      );
      return res.json(suppliers[0]);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    } finally {
      if (conn) {
        conn.release();
      }
    }
  };

  /**
   * Seleccionar tarifa de IVA
   */

  static getIva = async (req: Request, res: Response): Promise<Response> => {
    const pool = await connect();
    const conn = await pool.getConnection();

    try {
      const taxes = await conn.query(`SELECT
            codiva, nombre, porcentaje
        FROM
            iva
        WHERE
            inclprecio = 0;`);
      return res.status(200).json(taxes[0]);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  };

  /**
   * Guardar la compra
   */
  static savePurchase = async (req: Request, res: Response) => {
    const pool = await connect();
    const conn = await pool.getConnection();

    try {
      const pool = await connect();
      const conn = await pool.getConnection();
      await conn.query(`START TRANSACTION`);
      const newPurshase: IHeaderPurchases = req.body;
      const [responsePurchases] = await conn.query(
        `INSERT INTO compras (idtercero,docprovee,prefijo,numero,fechadocprov,fecha,detalle,idalmacen,idpago,aprobada)
            VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          newPurshase.idtercero,
          newPurshase.docprovee,
          newPurshase.prefijo,
          newPurshase.numero,
          newPurshase.fechadocprov,
          newPurshase.fecha,
          newPurshase.detalle,
          newPurshase.idalmacen,
          newPurshase.idpago,
          newPurshase.aprobada,
        ]
      );
      const result = Object.values(
        JSON.parse(JSON.stringify(responsePurchases))
      );
      newPurshase.detcompras.forEach(async (item) => {
        result[2] = item.idcompra;
        await conn.query(
          `INSERT INTO detcompras (idcompra,idmovorden,idproducto,porciva,codiva,valor,cantidad,precioventa)
                VALUES (?,?,?,?,?,?,?,?)`,
          [
            item.idcompra,
            item.idmovorden,
            item.idproducto,
            item.porciva,
            item.codiva,
            item.valor,
            item.cantidad,
            item.precioventa,
          ]
        );
      });
      await conn.query(`COMMIT`);
      if (responsePurchases)
        return res.status(200).json({ responsePurchases, ...newPurshase });
    } catch (error) {
      await conn.query(`ROLLBACK`);
      console.log(error);
      return res.status(500).json({ error: error });
    } finally {
      if (conn) conn.release();
    }
  };

  /*obtener el id del ultimo pedido insertado*/
  static getIdPurshable = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const pool = await connect();
    const conn = await pool.getConnection();

    try {
      const idPurshable = await conn.query(`SELECT
        idcompra
      FROM
        compras;`);
      return res.status(200).json(idPurshable[0]);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    } finally {
      if (conn) {
        conn.release();
      }
    }
  };
}
