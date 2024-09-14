import { Request, Response } from "express";
import { connect } from "../database";
import { IEditProduct } from "../interface/updateProduct.interface";
import { IAddBarcodes } from "../interface/barcode.interface";

export const UpdateProduct = async (req: Request, res: Response) => {
  const conn = await connect();
  try {
    const id: number = parseInt(req.params.idproducto);
    const editProduct: IEditProduct = req.body;
    const productUpdated = await conn.query(
      `UPDATE productos set ? WHERE idproducto= ?`,
      [editProduct, id]
    );
    return res.json({
      message: "product updated succesfully",
      product: productUpdated[0],
    });
  } catch (err) {
    console.log(err);
  } finally {
    if (conn) {
      conn.end();
    }
  }
};
export const getProductById = async (req: Request, res: Response) => {
  const conn = await connect();
  try {
    const id: string = req.params.idproducto;
    const ProductByID =
      await conn.query(`SELECT productos.idproducto, productos.barcode, productos.costo, productos.ultcosto, 
        productos.descripcion, productos.precioventa, productos.precioespecial1, productos.precioespecial2
        FROM productos
        WHERE idproducto=${id} `);
    return res.status(200).json(ProductByID[0]);
  } catch (error) {
    console.log(error);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
};
export const addMultipleBarcodes = async (req: Request, res: Response) => {
  const conn = await connect();
  try {
    const id: string = req.params.idproducto;
    const barcode: IAddBarcodes = req.body;
    const [rows] = await conn.query(`SELECT
        p.descripcion, p.precioventa,  p.idproducto, barr.barcode, p.barcode
    FROM
       productos p
       LEFT JOIN 
       barrasprod barr ON p.idproducto = barr.idproducto
    WHERE
    p.barcode=${barcode.barcode} OR barr.barcode=${barcode.barcode}
    GROUP BY
    p.idproducto`);
    //@ts-ignore

    if (rows.length <= 0) {
      const addBarcodes = await conn.query(
        `INSERT into barrasprod (idproducto, barcode) 
                VALUES (?,?)`,
        [id, barcode.barcode]
      );
      return res.status(200).json({
        message: "barcode added",
        addBarcodes,
      });
    } else {
      return res.json({
        message: "barcode found",
        barcode: rows,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error!",
      error: error,
    });
  } finally {
    if (conn) await conn.end();
  }
};
