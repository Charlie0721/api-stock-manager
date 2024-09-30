import { Request, Response } from "express";
import { getConnection } from "../database";

export class Product {
  static allProducts = async (req: Request, res: Response) => {
 let conn;

    try {
      conn = await getConnection();
      const limit = Number(req.query.limit) || 10;
      const page = Number(req.query.page) || 1;
      const offset = (page - 1) * limit;
      const codigo = req.query.codigo || "";
      const descripcion = req.query.descripcion || "";
      const barcode = req.query.barcode || "";

      const query = `
            SELECT p.idproducto, p.barcode, p.costo, p.ultcosto, p.codigo, p.descripcion, p.precioventa, p.precioespecial1, p.precioespecial2
            FROM productos p
            LEFT JOIN barrasprod brp ON p.idproducto = brp.idproducto
            WHERE p.estado = 1
            AND (
                (p.descripcion LIKE ? AND p.barcode LIKE ? AND p.codigo LIKE ?)
                OR (brp.barcode LIKE ?)
            )
            LIMIT ? OFFSET ?
        `;

      const productos = await conn.query(query, [
        `%${descripcion}%`,
        `%${barcode}%`,
        `%${codigo}%`,
        `%${barcode}%`,
        limit,
        offset,
      ]);

      if (productos.length > 0) {
        const totalItems = productos.length;
        const totalPages = Math.ceil(totalItems / limit);

        return res.json({
          products: productos[0],
          page: page,
          offset,
          limit,
          totalPages: totalPages,
        });
      } else {
        return res.json({ message: "Products not found" });
      }
    } catch (error) {
      console.log(error);
    } finally {
      if (conn) {
        conn.release();
      }
    }
  };
}
