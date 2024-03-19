import { Request, Response } from 'express';
import { connect } from '../database';
import { ItradeOrderHeader } from '../interface/tradeOrder.interface'
import { IcreateClient } from '../interface/createClient.interface'
import { RowDataPacket } from 'mysql2';
import { INeighborhoodsInterface } from '../interface/neighborhoods.interface'
import { ResultSetHeader } from 'mysql2/promise';
import { log } from 'console';

export class TradeOrder {

   
    /**Obtener productos activos */
    // static getProducts = async (req: Request, res: Response) => {
    //     try {
    //       const conn = await connect();
    //       const idalmacen = req.params.idalmacen;
    //       const limit = Number(req.query.limit) || 2;
    //       const page = Number(req.query.page) || 1;
    //       const offset = (page - 1) * limit;
    //       const descripcionString: string = req.query.descripcion as string;
    //       const words = descripcionString.split(' ');
    //       const barcode = req.query.barcode || '';
    
    //       if (words.length === 0) {
    //         return res.status(400).json({ error: 'Debe proporcionar al menos una palabra para la búsqueda.' });
    //       }
    
    //       const placeholders = Array(words.length).fill('p.descripcion LIKE ?').join(' AND ');
    
    //       const [products] = await conn.query<RowDataPacket[]>(`
    //         SELECT
    //           p.idproducto, p.costo, p.ultcosto, p.codiva, p.precioventa, p.precioespecial1, p.precioespecial2, p.descripcion, p.barcode, p.codigo, i.cantidad, alm.nomalmacen, iv.porcentaje, ppc.cantidad, ppc.precio
    //         FROM
    //           productos p
    //         LEFT JOIN inventario i ON p.idproducto = i.idproducto
    //         LEFT JOIN almacenes alm ON i.idalmacen = alm.idalmacen
    //         LEFT JOIN iva iv ON p.codiva = iv.codiva
    //         LEFT JOIN barrasprod brp ON p.idproducto = brp.idproducto
    //         LEFT JOIN prodprecioscant  ppc ON p.idproducto = ppc.idproducto
    //         WHERE
    //           i.idalmacen = ? AND p.estado = 1
    //           AND (
    //             ${placeholders}
    //           )
    //           AND (p.barcode LIKE ? OR brp.barcode LIKE ?)
    //         ORDER BY
    //           p.idproducto
    //         LIMIT ? OFFSET ?
    //       `, [idalmacen, ...words.map(word => `%${word}%`), `%${barcode}%`, `%${barcode}%`, limit, offset]);
    
    //       if (conn) {
    //         await conn.end();
    //       }
    
    //       const newProducts = products.map((product: any) => {
    //         let baseValue = product.precioventa;
    //         let taxValue = 0;
    //         if (product.porcentaje !== 0) {
    //           let porciva = 1 + (product.porcentaje / 100);
    //           baseValue = product.precioventa / porciva;
    //           taxValue = product.precioventa - baseValue;
    //         }
    //         return {
    //           ...product,
    //           baseValue,
    //           taxValue,
    //         };
    //       });
    
    //       const totalItems = products.length;
    //       const totalPages = Math.ceil(totalItems / limit);
    
    //       return res.json({
    //         newProducts,
    //         page: page, offset, limit,
    //         totalPages: totalPages
    //       });
    //     } catch (error) {
    //       console.log(error);
    //       return res.status(500).json({ error: error });
    //     }
    //   }
    static getProducts = async (req: Request, res: Response) => {
        try {
          const conn = await connect();
          const idalmacen = req.params.idalmacen;
          const limit = Number(req.query.limit) || 2;
          const page = Number(req.query.page) || 1;
          const offset = (page - 1) * limit;
          const descripcionString: string = req.query.descripcion as string;
          const words = descripcionString.split(' ');
          const barcode = req.query.barcode || '';
      
          if (words.length === 0) {
            return res.status(400).json({ error: 'Debe proporcionar al menos una palabra para la búsqueda.' });
          }
      
          const placeholders = Array(words.length).fill('p.descripcion LIKE ?').join(' AND ');
      
          const [products] = await conn.query<RowDataPacket[]>(`
            SELECT
              p.idproducto, p.costo, p.ultcosto, p.codiva, p.precioventa, p.precioespecial1, p.precioespecial2, p.descripcion, p.barcode, p.codigo, i.cantidad, alm.nomalmacen, iv.porcentaje
            FROM
              productos p
            LEFT JOIN inventario i ON p.idproducto = i.idproducto
            LEFT JOIN almacenes alm ON i.idalmacen = alm.idalmacen
            LEFT JOIN iva iv ON p.codiva = iv.codiva
            LEFT JOIN barrasprod brp ON p.idproducto = brp.idproducto
            WHERE
              i.idalmacen = ? AND p.estado = 1
              AND (
                ${placeholders}
              )
              AND (p.barcode LIKE ? OR brp.barcode LIKE ?)
            GROUP BY
              p.idproducto
            ORDER BY
              p.idproducto
            LIMIT ? OFFSET ?
          `, [idalmacen, ...words.map(word => `%${word}%`), `%${barcode}%`, `%${barcode}%`, limit, offset]);
      
          for (const product of products) {
            const [preciosPorVolumen] = await conn.query<RowDataPacket[]>(`
              SELECT cantidad, precio FROM prodprecioscant WHERE idproducto = ? ORDER BY cantidad
            `, [product.idproducto]);
      
            product.preciosPorVolumen = preciosPorVolumen;
          }
      
          await conn.end(); 
      
          const totalItems = products.length;
          const totalPages = Math.ceil(totalItems / limit);
      
          return res.json({
            newProducts: products,
            page,
            offset,
            limit,
            totalPages
          });
        } catch (error) {
          console.log(error);
          return res.status(500).json({ error: error });
        }
      }
      
      
      

    /**Obtener los almacenes  */
    static getWarehousestoOrders = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const warehouses = await conn.query(`SELECT idalmacen, nomalmacen FROM almacenes WHERE activo = 1`)
            if (conn) {
                await conn.end()
            }
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
            const limit = Number(req.query.limit) || 10;
            const page = Number(req.query.page) || 1;
            const offset = (page - 1) * limit;
            const nombres = req.query.nombres || '';
            const nit = req.query.nit || '';
            const customer = await conn.query(`SELECT
            idtercero, nombres, apellidos, nit
          FROM
            terceros
          WHERE
            cliente=1  AND (nombres LIKE ?)
            AND (nit LIKE ?)
          ORDER BY
            idtercero
          LIMIT ? OFFSET ? `,
                [`%${nombres}%`, `%${nit}%`, limit, offset]);
            if (conn) {
                await conn.end()
            }
            const totalItems = customer.length;
            const totalPages = Math.ceil(totalItems / limit);
            return res.status(200).json({
                customer: customer[0],
                page: page, offset, limit,
                totalPages: totalPages
            })
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
            if (conn) {
                await conn.end()
            }
            return res.status(200).json({ employee: employee[0] })

        } catch (error) {
            console.log(error);
            return res.status(404).json({ error: error })
        }
    }
  /** Obtener el número del pedido de acuerdo al almacén */
static getNumberOrder = async (req: Request, res: Response): Promise<Response> => {
    try {
        const conn = await connect();
        const idalm = req.params.idalmacen;
        const [numberResult] = await conn.query<RowDataPacket[]>(`
            SELECT COUNT(p1.numero) AS numero FROM pedidos p1 WHERE p1.idalmacen=? AND p1.numero > 0`,
            [idalm]
        );
        const number = numberResult[0].numero || 0;
        return res.json({ numero: number });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error });
    }
};

/** Insertar la orden y el detalle */
static insertOrder = async (req: Request, res: Response) => {
    try {
        const pool = await connect();
        const conn = await pool.getConnection();
        try {
            await conn.query(`START TRANSACTION`);

            const newOrder: ItradeOrderHeader = req.body;

            const [responseOrder] = await conn.query<ResultSetHeader>(
                `INSERT INTO pedidos (numero, idtercero, fecha, idvendedor, subtotal, valortotal, valimpuesto, valiva, valdescuentos, valretenciones, detalle, fechacrea, hora, plazo, idalmacen, estado, idsoftware)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    newOrder.numero, newOrder.idtercero, newOrder.fecha, newOrder.idvendedor, newOrder.subtotal, newOrder.valortotal,
                    newOrder.valimpuesto, newOrder.valiva, newOrder.valdescuentos, newOrder.valretenciones, newOrder.detalle, newOrder.fechacrea,
                    newOrder.hora, newOrder.plazo, newOrder.idalmacen, newOrder.estado, newOrder.idsoftware
                ]
            );

            const orderId = responseOrder.insertId;
                
            if (orderId) {
                const detpedidosPromises = newOrder.detpedidos.map(async (item) => {
                    await conn.query(
                        `INSERT INTO detpedidos (idpedido, idproducto, cantidad, valorprod, descuento, porcdesc, codiva, porciva, ivaprod, costoprod, base, despachado)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [orderId, item.idproducto, item.cantidad, item.valorprod, item.descuento, item.porcdesc, item.codiva, item.porciva,
                            item.ivaprod, item.costoprod, item.base, item.despachado]
                    );
                });

                await Promise.all(detpedidosPromises);
            } else {
                return res.status(400).json({ message: "id not found!!!" });
            }

            await conn.query(`COMMIT`);

            return res.status(200).json({ id: orderId, responseOrder, ...newOrder, numero: newOrder.numero });
        } catch (error) {
            await conn.query(`ROLLBACK`);
            console.error(error);
            return res.status(500).json({ error: error });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error });
    }
};


    /*obtener el id del ultimo pedido insertado*/
    static getIdTradeOrder = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const idTrade = await conn.query(`SELECT
        idpedido
      FROM
        pedidos;`)
            if (conn) {
                conn.end();
                console.log('La conexión se cerró correctamente.');
            }
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
            p.numero, prod.idproducto, p.valimpuesto, p.subtotal, p.valdescuentos, p.valortotal, prod.descripcion, dtp.valorprod, dtp.descuento, dtp.porcdesc, p.fecha, p.hora, t.nombres, t.nit, t.apellidos, dtp.cantidad, alm.nomalmacen
          FROM
            detpedidos dtp
            LEFT JOIN productos prod ON dtp.idproducto = prod.idproducto
            LEFT JOIN pedidos p ON dtp.idpedido = p.idpedido
            LEFT JOIN terceros t ON p.idtercero = t.idtercero
            LEFT JOIN almacenes alm ON p.idalmacen = alm.idalmacen
          WHERE
            numero= ${numero} AND p.idalmacen = ${idAlm};`)
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

            const [customerFound] = await conn.query<RowDataPacket[]>(`SELECT
            nombres, nit, idtercero 
            FROM
            terceros
            WHERE nit=?`,
                [client.nit])

            if (customerFound.length > 0) {
                return res.status(201).json({ message: "¡Customer already exist!" })
            }
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

    static getCountries = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const [countries] = await conn.query<RowDataPacket[]>(`SELECT 
            idpais, nompais, codpais
            FROM paises `)
            if (countries.length === 0) {
                return res.status(404).json({ message: 'No se encontraron paises' });
            }
            return res.status(200).json(countries);

        }
        catch (error) {
            console.error(error)
            return res.status(500).json({ error: error })
        }

    }

    static getMunicipalities = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const [municipalities] = await conn.query<RowDataPacket[]>(`SELECT 
            idmunicipio, nommunicipio, iddepto,codmunicipio
            FROM municipios `)
            if (municipalities.length === 0) {
                return res.status(404).json({ message: 'No se encontraron Municipios' });
            }
            return res.status(200).json(municipalities);
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: error })

        }

    }

    static getDepartments = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const [departments] = await conn.query<RowDataPacket[]>(`SELECT 
            iddepto, codigodepto, nomdepartamento,idpais,valorimportacion
            FROM departamentos `)

            if (departments.length === 0) {
                return res.status(404).json({ message: 'No se encontraron Departamentos' });
            }
            return res.status(200).json(departments);

        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: error })
        }
    }

    static getNeighborhoods = async (req: Request, res: Response): Promise<Response> => {

        try {

            const conn = await connect();
            const [neighborhoods] = await conn.query<RowDataPacket[]>(`SELECT
            b.idbarrio, b.nombarrio, b.idmunicipio,b.codzona
            FROM 
            barrios b 
            `)
            if (neighborhoods.length === 0) {
                return res.status(404).json({ message: 'No se encontraron Barrios en la BD' });
            }
            return res.status(200).json(neighborhoods);

        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: error })

        }

    }

    /**
     *Crear barrios 
    */
    static createNeighborhoods = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            const neighborhood: INeighborhoodsInterface = req.body;
            const [neighborhoods] = await conn.query(`INSERT INTO
                barrios 
                SET ?
            `, [neighborhood]);
    
            let insertId: number | undefined;
    
            if ('insertId' in neighborhoods && typeof neighborhoods.insertId === 'number') {
                insertId = neighborhoods.insertId;
            }
            
            return res.json({
                neighborhood,
                insertId,
                status: 201
            });

        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: error })
        }
    }
}



