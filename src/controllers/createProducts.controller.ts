import { Request, Response } from 'express'
import { connect } from '../database'
import { ProductStructureI, ProductsI } from '../interface/CreateProducts.interface'
import { IAddBarcodes } from '../interface/barcode.interface';

export class ProductClass {

    /**
 * conocer el numero de movimiento de inventario
 */
    static getCode = async (req: Request, res: Response) => {
        let conn;
        try {
            conn = await connect();
            const codigo = req.query.codigo
            const responseCode = await conn.query(`SELECT
                MAX(p.codigo) AS ultimo_codigo,
                p.codigo, n.codigo, n.idregistro
              FROM
                estproductos est
                INNER JOIN productos p ON est.idproducto = p.idproducto
                INNER JOIN nivelesprod n ON est.idregistro = n.idregistro
              WHERE
                n.codigo = ${codigo}
            `)
            if (responseCode.length > 0) {
                return res.status(200).json({
                    code: responseCode[0]
                })
            }

        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        } finally {
            if (conn) {
                conn.end();
            }
        }
    }
    static getStructure = async (req: Request, res: Response) => {
        //Obtener datos de estructura 
      
        try {
          const conn = await connect();

            const codeStructure = await conn.query(`  SELECT est.idnivel,est.numcaracteres, est.caractacum, est.caractnivel
              FROM
              estcodigo est`)
            if (codeStructure.length > 0) {
                return res.status(200).json(codeStructure[0])
            } else {
                return res.json({ message: 'there is no structure created' })
            }

        } catch (error) {
            return res.json({ error: error })
        }
        
    }
    static getProductsLevels = async (req: Request, res: Response) => {

        /**
       * Seleccionar Lineas
       */

        try {
            const conn = await connect();
            const limit = Number(req.query.limit) || 10;
            const page = Number(req.query.page) || 1;
            const offset = (page - 1) * limit;
            const codigo = req.query.codigo || '';
            const nombre = req.query.nombre || '';
            const productLevels = await conn.query(` SELECT
            niv.idregistro, niv.codigo, niv.nombre, niv.idnivel
          
          FROM
             nivelesprod niv WHERE 
            (niv.nombre LIKE '%${nombre}%') AND 
            (niv.codigo LIKE '%${codigo}%')LIMIT ${limit} OFFSET ${offset}`)
            if (productLevels.length > 0) {
                const totalItems = productLevels.length;
                const totalPages = Math.ceil(totalItems / limit);

                return res.json({
                    status: 200,
                    productLevels: productLevels[0],
                    page: page, offset, limit,
                    totalPages: totalPages,
                })
            } else {
                return res.json({ message: 'levels not found' })
            }
        } catch (error) {
            return res.json({ error: error })
        }

    }

    /**
   * Seleccionar tarifa de IVA Compras
   */
    static getTaxShopping = async (req: Request, res: Response): Promise<Response> => {
        let conn;
        try {
            conn = await connect();
            const taxes = await conn.query(`SELECT
            i.codiva, i.nombre, i.porcentaje
        FROM
            iva i
        WHERE
            i.inclprecio = 0;`)
            return res.status(200).json(taxes[0])
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        } finally {
            if (conn) {
                await conn.end();
            }
        }
    }
    /**
    * Seleccionar tarifa de IVA Ventas
    */
    static getTaxSales = async (req: Request, res: Response): Promise<Response> => {
        let conn;
        try {
            conn = await connect();
            const taxes = await conn.query(`
            SELECT
              i.codiva, i.nombre, i.porcentaje
            FROM
              iva i
            WHERE
            i.inclprecio = 1 || i.general=0;`)
            return res.status(200).json(taxes[0])

        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        } finally {
            if (conn) {
                await conn.end();
            }
        }

    }
    /**
   * Obtener unidades de medida
   */
    static getUnitsOfMeasure = async (req: Request, res: Response): Promise<Response> => {
        let conn;
        try {
            conn = await connect();
            const response = await conn.query(`SELECT u.idunmedida, u.nommedida
            FROM medidas u`)
            if (response.length > 0) {
                return res.json({
                    status: 200,
                    unitsOfMeasure: response[0],
                })
            } else {
                return res.json({ message: 'units of measure not found' })
            }

        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        } finally {
            if (conn) {
                await conn.end();
            }
        }

    }

    /**
   * Obtener el id del ultimo producto creado
   */
    static getIdProduct = async (req: Request, res: Response) => {

        try {
            const conn = await connect();
            const productId = await conn.query(`SELECT  
           MAX(p.idproducto) AS ultimo_id
           FROM productos p`);
            if (conn) {
                await conn.end();
            }
            if (productId.length > 0) {
                return res.json(productId[0],

                )
            } else {
                return res.json({ message: "id not found" })
            }
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }
    }

    static searchExistingBarcode = async (req: Request, res: Response) => {

        try {
            const conn = await connect();
            const barcode = req.query.barcode || '';
            const [rows] = await conn.query(`SELECT
           p.descripcion, p.precioventa,  p.idproducto, barr.barcode, p.barcode
       FROM
          productos p
          LEFT JOIN 
          barrasprod barr ON p.idproducto = barr.idproducto
       WHERE
       p.barcode=${barcode} OR barr.barcode=${barcode}
       GROUP BY
       p.idproducto`)
            if (conn) {
                await conn.end();
            }
            //@ts-ignore
            if (rows.length <= 0) {
                return res.status(200).json({
                    message: 'barcode not found',
                })

            } else {
                return res.status(200).json({
                    message: 'barcode found',
                    barcode: rows
                })
            }
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }

    }
    /**
   * Crear el producto
   */
    static saveProduct = async (req: Request, res: Response) => {

        try {
            const pool = await connect();
            const conn = await pool.getConnection();
            try {
                await conn.query(`START TRANSACTION`);
                const product: ProductsI = req.body;
                const [newProductResponse] = await conn.query(`INSERT INTO productos 
                    (codigo,barcode,descripcion,idunmedida,codiva, tipo,codivaesp1,codivaesp2,costo, ultcosto, precioventa,
                    estado,compuesto,idareaserv,codivacomp,agruparalfacturar) 
                    values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [product.codigo, product.barcode, product.descripcion, product.idunmedida,
                product.codiva, product.tipo, product.codivaesp1, product.codivaesp2, product.costo, product.ultcosto, product.precioventa, product.estado,
                product.compuesto, product.idareaserv, product.codivacomp, product.agruparalfacturar])

                const result = Object.values(JSON.parse(JSON.stringify(newProductResponse)));
                product.estproductos.forEach(async (item) => {
                    result[2] = item.idproducto

                    await conn.query(`INSERT INTO estproductos (idproducto, idregistro, idnivel)
                        values (?,?,?)`, [result[2], item.idregistro, item.idnivel])
                })
                await conn.query(`COMMIT`);

                if (result) {

                    return res.status(200).json({ id: result[2], newProductResponse, ...product });
                } else {

                    return res.status(400).json({ message: "id not found !!!" })
                }

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

}