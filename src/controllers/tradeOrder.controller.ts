import { Request, Response } from "express";
import { getConnection } from "../database";
import { ItradeOrderHeader } from "../interface/tradeOrder.interface";
import { IcreateClient } from "../interface/createClient.interface";
import { RowDataPacket } from "mysql2";
import { INeighborhoodsInterface } from "../interface/neighborhoods.interface";
import { ResultSetHeader } from "mysql2/promise";
import { ValidateInventory } from "../service/validate-inventory.service";
import { OrdersService } from "../service/orders.service";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
export class TradeOrder {
  static getProducts = async (req: Request, res: Response) => {
    let conn;
    try {
      conn = await getConnection();
      const idalmacen = req.params.idalmacen;
      const limit = Number(req.query.limit) || 2;
      const page = Number(req.query.page) || 1;
      const offset = (page - 1) * limit;
      const descripcionString: string = req.query.descripcion as string;
      const words = descripcionString.split(" ");
      const barcode = req.query.barcode || "";

      if (words.length === 0) {
        return res.status(400).json({
          error: "Debe proporcionar al menos una palabra para la búsqueda.",
        });
      }

      const placeholders = Array(words.length)
        .fill("p.descripcion LIKE ?")
        .join(" AND ");

      const [products] = await conn.query<RowDataPacket[]>(
        `
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
          `,
        [
          idalmacen,
          ...words.map((word) => `%${word}%`),
          `%${barcode}%`,
          `%${barcode}%`,
          limit,
          offset,
        ]
      );
      const newProducts = products.map((product: any) => {
        let baseValue = product.precioventa;
        let taxValue = 0;
        if (product.porcentaje !== 0) {
          let porciva = 1 + product.porcentaje / 100;
          baseValue = product.precioventa / porciva;
          taxValue = product.precioventa - baseValue;
        }
        return {
          ...product,
          baseValue,
          taxValue,
        };
      });

      const totalItems = products.length;
      const totalPages = Math.ceil(totalItems / limit);

      return res.json({
        newProducts,
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
        await conn.release();
      }
    }
  };

  /**Obtener los almacenes  */
  static getWarehousestoOrders = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const conn = await getConnection();
    try {
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

  /**obtener clientes */
  static getCustomer = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const conn = await getConnection();
    try {
      const limit = Number(req.query.limit) || 10;
      const page = Number(req.query.page) || 1;
      const offset = (page - 1) * limit;
      const nombres = req.query.nombres || "";
      const nit = req.query.nit || "";
      const customer = await conn.query(
        `SELECT
            idtercero, nombres, apellidos, nit
          FROM
            terceros
          WHERE
            cliente=1  AND (nombres LIKE ?)
            AND (nit LIKE ?)
          ORDER BY
            idtercero
          LIMIT ? OFFSET ? `,
        [`%${nombres}%`, `%${nit}%`, limit, offset]
      );

      const totalItems = customer.length;
      const totalPages = Math.ceil(totalItems / limit);
      return res.status(200).json({
        customer: customer[0],
        page: page,
        offset,
        limit,
        totalPages: totalPages,
      });
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: error });
    } finally {
      if (conn) {
        conn.release();
      }
    }
  };
  /**obtener empleados (vendedores) */
  static getEmployee = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;
    try {
      conn = await getConnection();
      const employee = await conn.query(`SELECT
                   idtercero, nombres, nit
                 FROM
                  terceros
                 WHERE 
                 empleado = 1 AND otros = 1;`);
      return res.status(200).json({ employee: employee[0] });
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: error });
    } finally {
      if (conn) {
        conn.release();
      }
    }
  };
  /** Obtener el número del pedido de acuerdo al almacén */
  static getNumberOrder = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;
    try {
      conn = await getConnection();
      const idalm = req.params.idalmacen;
      const [numberResult] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(p1.numero) AS numero FROM pedidos p1 WHERE p1.idalmacen=? AND p1.numero > 0`,
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
  static insertOrder = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const conn = await getConnection();
    let orderId: number;
    let responseOrder;

    try {
      await conn.query(`START TRANSACTION`);

      const newOrder: ItradeOrderHeader = req.body;
      const validateInventory = new ValidateInventory();

      // Obtener los IDs y cantidades de los productos
      let productIds: Array<number> = [];
      let quantities: Array<number> = [];
      newOrder.detpedidos.forEach((product) => {
        productIds.push(product.idproducto);
        quantities.push(product.cantidad);
      });

      // Obtener el parámetro para facturar sin existencias
      const factsInExistParam = await validateInventory.getFactsInExistParam();

      // Validar las existencias de inventario solo si el parámetro está en 0
      if (factsInExistParam === 0) {
        const message = await validateInventory.validateStockParameter(
          newOrder.idalmacen,
          productIds,
          quantities
        );

        if (message) {
          // Devuelve el mensaje de error si hay productos con cantidad insuficiente
          return res.status(400).json({ message });
        }
      }

      // Insertar la orden independientemente del valor del parámetro
      [responseOrder] = await conn.query<ResultSetHeader>(
        `INSERT INTO pedidos (numero, idtercero, fecha, idvendedor, subtotal, valortotal, valimpuesto, valiva, valdescuentos, valretenciones, detalle, fechacrea, hora, plazo, idalmacen, estado, fechavenc, idsoftware)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newOrder.numero,
          newOrder.idtercero,
          newOrder.fecha,
          newOrder.idvendedor,
          newOrder.subtotal,
          newOrder.valortotal,
          newOrder.valimpuesto,
          newOrder.valiva,
          newOrder.valdescuentos,
          newOrder.valretenciones,
          newOrder.detalle,
          newOrder.fechacrea,
          newOrder.hora,
          newOrder.plazo,
          newOrder.idalmacen,
          newOrder.estado,
          newOrder.fechavenc,
          newOrder.idsoftware,
        ]
      );
      orderId = responseOrder.insertId;

      // Insertar los detalles del pedido
      const detpedidosPromises = newOrder.detpedidos.map((item) =>
        conn.query(
          `INSERT INTO detpedidos (idpedido, idproducto, cantidad, valorprod, descuento, porcdesc, codiva, porciva, ivaprod, costoprod, base, despachado)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.idproducto,
            item.cantidad,
            item.valorprod,
            item.descuento,
            item.porcdesc,
            item.codiva,
            item.porciva,
            item.ivaprod,
            item.costoprod,
            item.base,
            item.despachado,
          ]
        )
      );
      await Promise.all(detpedidosPromises);
      await conn.query(`COMMIT`);
      return res.status(201).json({
        id: orderId,
        responseOrder,
        ...newOrder,
        numero: newOrder.numero,
      });
    } catch (error) {
      await conn.query(`ROLLBACK`);
      console.error(error);
      return res
        .status(500)
        .json({ error: "Error al insertar la orden", details: error });
    } finally {
      conn.release();
    }
  };

  /*obtener el id del ultimo pedido insertado*/
  static getIdTradeOrder = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;
    try {
      conn = await getConnection();
      const idTrade = await conn.query(`SELECT
        idpedido
      FROM
        pedidos;`);
      return res.status(200).json(idTrade[0]);
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
   * Consultar el pedido ingresado por aplicación
   */
  static ordersByWarehouseAndNumber = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;
    try {
      conn = await getConnection();
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
            numero= ${numero} AND p.idalmacen = ${idAlm};`);
      //  await this.sendOrderToPdf(response[0]);

      return res.status(200).json(response[0]);
    } catch (error) {
      return res.status(500).json({ error: error });
    } finally {
      if (conn) {
        conn.release();
        console.log("La conexión se cerró correctamente.");
      }
    }
  };
  static async sendOrderToPdf(req: Request, res: Response) {
    let conn;

    try {
      conn = await getConnection();
      const numero = req.params.numero;
      const idAlm = req.params.idalmacen;
      const response = await conn.query<RowDataPacket[]>(`SELECT
            p.numero, prod.idproducto, p.valimpuesto, p.subtotal, p.valdescuentos, p.valortotal, prod.descripcion, dtp.valorprod, dtp.descuento, dtp.porcdesc, p.fecha, p.hora, t.nombres, t.nit, t.apellidos, dtp.cantidad, alm.nomalmacen
          FROM
            detpedidos dtp
            LEFT JOIN productos prod ON dtp.idproducto = prod.idproducto
            LEFT JOIN pedidos p ON dtp.idpedido = p.idpedido
            LEFT JOIN terceros t ON p.idtercero = t.idtercero
            LEFT JOIN almacenes alm ON p.idalmacen = alm.idalmacen
          WHERE
            numero= ${numero} AND p.idalmacen = ${idAlm};`);
      if (
        !response ||
        response[0].length === 0 ||
        !response[0] ||
        response[0].length === 0
      ) {
        throw new Error("No hay datos disponibles para generar el pedido.");
      }
      const data = response[0][0];

      const orderNumber = data.numero;
      let productList = `<table style="width:100%; border-collapse: collapse; font-size: 10px;">
      <tr>
          <th style="text-align: left;">Cant</th>
          <th style="text-align: left;">Descripción</th>
          <th style="text-align: left;">Vr Unitario</th>
          <th style="text-align: left;">Vr Total</th>
      </tr>`;

      response[0].forEach((item) => {
        productList += `
        <tr>
            <td>${item.cantidad}</td>
            <td>${item.descripcion}</td>
            <td>${TradeOrder.formatCurrency(item.valorprod)}</td>
            <td>${TradeOrder.formatCurrency(
              item.cantidad * item.valorprod
            )}</td>
        </tr>`;
      });

      productList += `</table>`;

      const htmlContent = `
      <html>
      <head>
        <title>Pedido</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            width: 80mm;
            margin: 0 auto;
            padding: 5px;
            font-size: 10px;
          }
          .header, .footer {
            text-align: center;
            margin-bottom: 5px;
          }
          .header h2 {
            font-size: 12px;
            margin: 3px 0;
          }
          .content {
            margin-bottom: 10px;
          }
          .total {
            font-weight: bold;
            text-align: right;
            margin-top: 8px;
            font-size: 10px;
          }
          .product-details {
            display: flex;
            justify-content: space-between;
            gap: 5px;
          }
          html, body {
            height: auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${data.nomalmacen}</h2>
            <p>Fecha: ${TradeOrder.formatDate(data.fecha)} Hora: ${
        data.hora
      }</p>
            <p>Pedido Nro. ${orderNumber}</p>
            <p>${data.nombres} ${data.apellidos}</p>
            <p>Nit/CC: ${data.nit}</p>
          </div>
          <div class="content">
            ${productList}
            <div class="total">
              <p>SUBTOTAL: ${TradeOrder.formatCurrency(data.subtotal)}</p>
              <p>IVA: ${TradeOrder.formatCurrency(data.valimpuesto)}</p>
              <p>TOTAL: ${TradeOrder.formatCurrency(data.valortotal)}</p>
            </div>
          </div>
          <div class="footer">
            <p>Software: https://conexionpos.com/</p>
          </div>
        </div>
      </body>
      </html>`;

      // Iniciar Puppeteer
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      const height = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;

        const maxHeight = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        );

        return maxHeight;
      });

      await page.setViewport({ width: 300, height: height });

      const pdfBuffer = await page.pdf({
        width: "80mm",
        height: `${height}px`,
        printBackground: true,
        margin: {
          top: "0mm",
          right: "0mm",
          bottom: "0mm",
          left: "0mm",
        },
        preferCSSPageSize: true,
      });

      await browser.close();

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error("Error generando el PDF.");
      }

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=pedido_${orderNumber}.pdf`,
        "Content-Length": pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error) {
      console.error("Error en sendOrderToPdf:", error);
      return res.status(500).json({ error: error });
    } finally {
      if (conn) {
        conn.release();
        console.log("Conexión liberada correctamente.");
      }
    }
  }

  static formatCurrency(value: number): string {
    return `$ ${value.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`;
  }
  static formatDate(dateString: string): string {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${day}/${month}/${year}`;
  }

  /**Crear cliente */
  static createClient = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;
    try {
      conn = await getConnection();
      const client: IcreateClient = req.body;

      const [customerFound] = await conn.query<RowDataPacket[]>(
        `SELECT
            nombres, nit, idtercero 
            FROM
            terceros
            WHERE nit=?`,
        [client.nit]
      );

      if (customerFound.length > 0) {
        return res.status(201).json({ message: "¡Customer already exist!" });
      }
      const responseClient = await conn.query(`INSERT INTO terceros SET?`, [
        client,
      ]);
      return res.status(200).json({
        data: responseClient,
        client: client,
        message: "client created successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    }
  };

  static getCountries = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;
    try {
      conn = await getConnection();
      const [countries] = await conn.query<RowDataPacket[]>(`SELECT 
            idpais, nompais, codpais
            FROM paises `);
      if (countries.length === 0) {
        return res.status(404).json({ message: "No se encontraron paises" });
      }
      return res.status(200).json(countries);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error });
    }
  };

  static getMunicipalities = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;
    try {
      conn = await getConnection();
      const [municipalities] = await conn.query<RowDataPacket[]>(`SELECT 
            idmunicipio, nommunicipio, iddepto,codmunicipio
            FROM municipios `);
      if (municipalities.length === 0) {
        return res
          .status(404)
          .json({ message: "No se encontraron Municipios" });
      }
      return res.status(200).json(municipalities);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error });
    }
  };

  static getDepartments = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;
    try {
      conn = await getConnection();
      const [departments] = await conn.query<RowDataPacket[]>(`SELECT 
            iddepto, codigodepto, nomdepartamento,idpais,valorimportacion
            FROM departamentos `);

      if (departments.length === 0) {
        return res
          .status(404)
          .json({ message: "No se encontraron Departamentos" });
      }
      return res.status(200).json(departments);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error });
    } finally {
      if (conn) {
        conn.release();
      }
    }
  };

  static getNeighborhoods = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;
    try {
      conn = await getConnection();
      const [neighborhoods] = await conn.query<RowDataPacket[]>(`SELECT
            b.idbarrio, b.nombarrio, b.idmunicipio,b.codzona
            FROM 
            barrios b 
            `);
      if (neighborhoods.length === 0) {
        return res
          .status(404)
          .json({ message: "No se encontraron Barrios en la BD" });
      }
      return res.status(200).json(neighborhoods);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error });
    } finally {
      if (conn) {
        conn.release();
      }
    }
  };

  /**
   *Crear barrios
   */
  static createNeighborhoods = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;
    try {
      conn = await getConnection();
      const neighborhood: INeighborhoodsInterface = req.body;
      const [neighborhoods] = await conn.query(
        `INSERT INTO
                barrios 
                SET ?
            `,
        [neighborhood]
      );

      let insertId: number | undefined;

      if (
        "insertId" in neighborhoods &&
        typeof neighborhoods.insertId === "number"
      ) {
        insertId = neighborhoods.insertId;
      }

      return res.json({
        neighborhood,
        insertId,
        status: 201,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error });
    } finally {
      if (conn) {
        conn.release();
      }
    }
  };

  static paginateOrders = async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const warehouseId = Number(req.params.warehouseId);
    const sellerId = Number(req.params.sellerId);
    const date = req.query.date as string | undefined;
    const number = req.query.number ? Number(req.query.number) : undefined;

    const ordersService = new OrdersService();
    const {
      message,
      data,
      limit: currentLimit,
      page: currentPage,
    } = await ordersService.paginateOrders(
      page,
      limit,
      warehouseId,
      sellerId,
      date,
      number
    );

    return res.status(200).json({
      data,
      limit: currentLimit,
      page: currentPage,
      message,
    });
  };

  static getOrderById = async (req: Request, res: Response) => {
    const orderId = Number(req.params.orderId);
    const ordersService = new OrdersService();
    try {
      const { message, data } = await ordersService.getOrderById(orderId);
      return res.status(200).json({
        message,
        data,
      });
    } catch (error) {
      console.error("Error fetching order by id:", error);
      return res.status(500).json({ error: "Error fetching order by id" });
    }
  };
}
