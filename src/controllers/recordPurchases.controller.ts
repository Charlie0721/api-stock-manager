import { Request, Response } from "express";
import { getConnection } from "../database";
import { IHeaderPurchases } from "../interface/recordPurchases.interface";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { PurchasesService } from "../service/purshases.service";

export class ChargePurchases {
  /**
   * Traer datos basicos de productos activos
   */
  static activeProductsToPurchases = async (req: Request, res: Response) => {
    let conn;
    try {
      conn = await getConnection();
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
        conn.release();
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
      let conn;
      conn = await getConnection();
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
    let conn;
    try {
      conn = await getConnection();
      const warehouses = await conn.query(
        `SELECT idalmacen, nomalmacen FROM almacenes WHERE activo = 1`
      );

      return res.json(warehouses[0]);
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
   * Listar terceros marcados como proveedores
   */

  static getSuppliers = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;

    try {
      conn = await getConnection();
      const [suppliers] = await conn.query<RowDataPacket[]>(
        `SELECT idtercero, nombres, nit, tipofactcompras FROM terceros WHERE proveedor = 1`
      );

      return res.json(suppliers);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    } finally {
      if (conn) {
        conn.release();
        console.log("La conexión se cerró correctamente.");
      }
    }
  };

  /**
   * Seleccionar tarifa de IVA
   */

  static getIva = async (req: Request, res: Response): Promise<Response> => {
    let conn;

    try {
      conn = await getConnection();
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
        conn.release();
      }
    }
  };

  /**
   * Guardar la compra
   */
  static savePurchase = async (req: Request, res: Response) => {
    const conn = await getConnection();
    let purshaseId: number;
    let responsePurchases;
    try {
      const conn = await getConnection();
      await conn.query(`START TRANSACTION`);
      const newPurshase: IHeaderPurchases = req.body;

      const purchasesService = new PurchasesService();
      const resolutionCategoryType =
        await purchasesService.getResolutionCategoryTypeByThirdParty(
          newPurshase.idtercero
        );
      const resolution = await purchasesService.getResolutions(
        resolutionCategoryType,
        newPurshase.idalmacen
      );
      let prefix: string = "";
      let resolutionId: number = 0;

      for (const _resolution of resolution) {
        if (_resolution.categoresol === resolutionCategoryType) {
          prefix = _resolution.prefijo;
          resolutionId = _resolution.idresolucion;
          break;
        }
      }
      if (resolution.length === 0) {
        return res.status(400).json({
          message: "No hay resoluciones disponibles para este Almacén.",
        });
      }

      const purshaseNumber =
        await purchasesService.getPurshaseNumberByResolutionId(
          resolutionId,
          newPurshase.idalmacen
        );

      [responsePurchases] = await conn.query<ResultSetHeader>(
        `INSERT INTO compras (idresolucion,prefijo,numero,idtercero,docprovee,fechadocprov,fecha,detalle,idalmacen,idpago,aprobada)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          resolutionId,
          prefix,
          purshaseNumber,
          newPurshase.idtercero,
          newPurshase.docprovee,
          newPurshase.fechadocprov,
          newPurshase.fecha,
          newPurshase.detalle,
          newPurshase.idalmacen,
          newPurshase.idpago,
          newPurshase.aprobada,
        ]
      );
      purshaseId = responsePurchases.insertId;
      const detComprasPromises = newPurshase.detcompras.map((item) =>
        conn.query(
          `INSERT INTO detcompras (idcompra,idmovorden,idproducto,porciva,codiva,valor,cantidad,precioventa)
            VALUES (?,?,?,?,?,?,?,?)`,
          [
            purshaseId,
            item.idmovorden,
            item.idproducto,
            item.porciva,
            item.codiva,
            item.valor,
            item.cantidad,
            item.precioventa,
          ]
        )
      );
      await Promise.all(detComprasPromises);
      await conn.query(`COMMIT`);
      if (responsePurchases)
        return res.status(200).json({ responsePurchases, ...newPurshase, number:purshaseNumber });
    } catch (error) {
      await conn.query(`ROLLBACK`);
      console.log(error);
      return res.status(500).json({ error: error });
    } finally {
      if (conn) conn.release();
      console.log("La conexión se cerró correctamente.");
    }
  };

  /*obtener el id del ultimo pedido insertado*/
  static getIdPurshable = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;

    try {
      conn = await getConnection();

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
