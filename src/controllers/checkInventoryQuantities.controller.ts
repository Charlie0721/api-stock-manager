import { Request, Response } from "express";
import { getConnection } from "../database";
import { RowDataPacket } from "mysql2/promise";
/**
 * Traer productos con cantidades
 */

export const inventoryQuantities = async (req: Request, res: Response) => {
  let conn;

  try {
    conn = await getConnection();
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const descripcion = req.query.descripcion || "";
    const barcode = req.query.barcode || "";

    const query = `
      SELECT p.idproducto, p.barcode, p.codigo, p.descripcion, i.cantidad, alm.nomalmacen
      FROM inventario i
      INNER JOIN productos p ON i.idproducto = p.idproducto
      INNER JOIN almacenes alm ON i.idalmacen = alm.idalmacen
      LEFT JOIN barrasprod brp ON p.idproducto = brp.idproducto
      WHERE p.estado = 1
      AND ((p.descripcion LIKE ?) AND (p.barcode LIKE ?) OR (brp.barcode LIKE ?))
      GROUP BY p.idproducto, p.barcode, p.codigo, p.descripcion, alm.nomalmacen
      ORDER BY p.idproducto
      LIMIT ? OFFSET ?
  `;
    const responseQuantities = await conn.query<RowDataPacket[]>(query, [
      `%${descripcion}%`,
      `%${barcode}%`,
      `%${barcode}%`,
      limit,
      offset,
    ]);
    const totalItems = responseQuantities.length;
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      inventory: responseQuantities[0],
      page: page,
      offset,
      limit,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  } finally {
    if (conn) {
      conn.release();
    }
  }
};
