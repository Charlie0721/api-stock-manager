import { Request, Response } from 'express'
import { connect } from '../database'
import { ProductStructureI, ProductsI } from '../interface/CreateProducts.interface'

export class ProductClass {

    static getProductsLevels = async (req: Request, res: Response) => {

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

            const codeStructure = await conn.query(`  SELECT est.idnivel,est.numcaracteres, est.caractacum, est.caractnivel
              FROM
              estcodigo est`)

            if (productLevels.length > 0 && codeStructure.length > 0) {
                const totalItems = productLevels.length;
                const totalPages = Math.ceil(totalItems / limit);

                return res.json({
                    status: 200,
                    productLevels: productLevels[0],
                    page: page, offset, limit,
                    totalPages: totalPages,
                    structure: codeStructure[0]
                })
            } else {
                return res.json({ message: 'levels not found' })
            }
        } catch (error) {
            return res.json({ error: error })
        }
    }

    static saveProduct = async (req: Request, res: Response) => {

        try {
            const pool = await connect();
            const conn = await pool.getConnection();
            try {
                await conn.query(`START TRANSACTION`);
                const product: ProductsI = req.body;
                const [newProductResponse] = await conn.query(`INSERT INTO productos 
                (codigo,barcode,descripcion,idunmedida,codiva, tipo,codivaesp1,codivaesp2,costo,precioventa,
                estado,compuesto,idareaserv,codivacomp,agruparalfacturar) 
                values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [product.codigo, product.barcode, product.descripcion, product.idunmedida,
                product.codiva, product.tipo, product.codivaesp1, product.codivaesp2, product.costo, product.precioventa, product.estado,
                product.compuesto, product.idareaserv, product.codivacomp, product.agruparalfacturar])

                const result = Object.values(JSON.parse(JSON.stringify(newProductResponse)));
                console.log(result[2]);

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