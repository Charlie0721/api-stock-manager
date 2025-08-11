import { RowDataPacket } from "mysql2";
import { getConnection } from "../database";
import { ValidateInventory } from "./validate-inventory.service";
import { ItradeOrderHeader } from "../interface/tradeOrder.interface";
import { Query } from "mysql2/typings/mysql/lib/protocol/sequences/Query";
import { query } from "express";

export class OrdersService {
  public async paginateOrders(
    page: number,
    limit: number,
    warehouseId: number,
    sellerId: number,
    date?: string,
    number?: number
  ) {
    let conn;
    try {
      conn = await getConnection();
      const offset = (page - 1) * limit;
      const [result] = await conn.query<RowDataPacket[]>(
        `SELECT  idpedido, numero, fecha, valortotal, alm.nomalmacen, t.nombres, t.apellidos
        FROM pedidos p
        LEFT JOIN almacenes alm ON p.idalmacen = alm.idalmacen
        LEFT JOIN terceros t ON p.idtercero = t.idtercero
        WHERE p.idalmacen = ? AND p.idvendedor = ? AND fecha LIKE ? AND numero LIKE ?
        ORDER BY p.fecha DESC, p.numero DESC
        LIMIT ? OFFSET ?`,
        [
          warehouseId,
          sellerId,
          `%${date || ""}%`,
          `%${number || ""}%`,
          limit,
          offset,
        ]
      );
      if (result.length === 0) {
        return { message: "No orders found" };
      }

      
      return {
        message: "Orders paginated",
        data: result,
        page,
        limit,
      };
    } catch (error) {
      console.error("Error fetching pagination:", error);
      throw error;
    } finally {
      if (conn) {
        conn.release();
      }
    }
  }
  public async getOrderById(orderId: number) {
    let conn;
    try {
      conn = await getConnection();

      const [order] = await conn.query<RowDataPacket[]>(
        `SELECT
           p.idpedido, p.numero, prod.idproducto, p.valimpuesto, p.subtotal, p.valdescuentos, p.valortotal, prod.descripcion, dtp.valorprod, dtp.descuento,
            dtp.porcdesc, p.fecha, p.hora, t.nombres, t.nit, t.apellidos, dtp.cantidad, alm.nomalmacen
          FROM
            detpedidos dtp
            LEFT JOIN productos prod ON dtp.idproducto = prod.idproducto
            LEFT JOIN pedidos p ON dtp.idpedido = p.idpedido
            LEFT JOIN terceros t ON p.idtercero = t.idtercero
            LEFT JOIN almacenes alm ON p.idalmacen = alm.idalmacen
          WHERE
            p.idpedido = ?`,
        [orderId]
      );
            
      if (order.length === 0) {
        return { message: "Order not found" };
      }
      return {
        message: "Order found",
        data: order,
      };
    } catch (error) {
      console.error("Error fetching order by id:", error);
      throw error;
    } finally {
      if (conn) {
        conn.release();
      }
    }
  }
  public async updateOrder(
    orderId: number,
    updatedOrder: Partial<ItradeOrderHeader>
  ) {
    const conn = await getConnection();
    try {
      await conn.query(`START TRANSACTION`);

      // 1️⃣ Traer datos actuales de la cabecera
      const [currentHeader] = await conn.query<RowDataPacket[]>(
        `SELECT * FROM pedidos WHERE idpedido = ?`,
        [orderId]
      );
      if (!currentHeader.length) {
        throw new Error("Order not found");
      }

      // 2️⃣ Fusionar datos actuales con los nuevos (enfoque parcial)
      const mergedOrder = { ...currentHeader[0], ...updatedOrder };

      // 3️⃣ Validar inventario si aplica
      const validateInventory = new ValidateInventory();
      const productIds = mergedOrder.detpedidos?.map((p) => p.idproducto) || [];
      const quantities = mergedOrder.detpedidos?.map((p) => p.cantidad) || [];

      const factsInExistParam = await validateInventory.getFactsInExistParam();
      if (factsInExistParam === 0 && productIds.length > 0) {
        const message = await validateInventory.validateStockParameter(
          mergedOrder.idalmacen,
          productIds,
          quantities
        );
        if (message) {
          return { status: 400, message };
        }
      }

      // 4️⃣ Actualizar cabecera
      await conn.query(
        `UPDATE pedidos
         SET numero = ?, idtercero = ?, fecha = ?, idvendedor = ?, subtotal = ?, valortotal = ?, valimpuesto = ?, valiva = ?, valdescuentos = ?, valretenciones = ?, detalle = ?, fechacrea = ?, hora = ?, plazo = ?, idalmacen = ?, estado = ?, fechavenc = ?, idsoftware = ?
         WHERE idpedido = ?`,
        [
          mergedOrder.numero,
          mergedOrder.idtercero,
          mergedOrder.fecha,
          mergedOrder.idvendedor,
          mergedOrder.subtotal,
          mergedOrder.valortotal,
          mergedOrder.valimpuesto,
          mergedOrder.valiva,
          mergedOrder.valdescuentos,
          mergedOrder.valretenciones,
          mergedOrder.detalle,
          mergedOrder.fechacrea,
          mergedOrder.hora,
          mergedOrder.plazo,
          mergedOrder.idalmacen,
          mergedOrder.estado,
          mergedOrder.fechavenc,
          mergedOrder.idsoftware,
          orderId,
        ]
      );

      const [currentDetails] = await conn.query<RowDataPacket[]>(
        `SELECT idproducto FROM detpedidos WHERE idpedido = ?`,
        [orderId]
      );

      const currentProductIds = currentDetails.map((d) => d.idproducto);

      const newProductIds =
        mergedOrder.detpedidos?.map((p) => p.idproducto) || [];
      const productsToDelete = currentProductIds.filter(
        (id) => !newProductIds.includes(id)
      );
      if (productsToDelete.length > 0) {
        await conn.query(
          `DELETE FROM detpedidos WHERE idpedido = ? AND idproducto IN (?)`,
          [orderId, productsToDelete]
        );
      }

      for (const item of mergedOrder.detpedidos || []) {
        if (!currentProductIds.includes(item.idproducto)) {
          await conn.query(
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
          );
        } else {
          await conn.query(
            `UPDATE detpedidos
             SET cantidad = ?, valorprod = ?, descuento = ?, porcdesc = ?, codiva = ?, porciva = ?, ivaprod = ?, costoprod = ?, base = ?, despachado = ?
             WHERE idpedido = ? AND idproducto = ?`,
            [
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
              orderId,
              item.idproducto,
            ]
          );
        }
      }

      await conn.query(`COMMIT`);
      return { status: 200, message: "Order updated successfully" };
    } catch (error) {
      await conn.query(`ROLLBACK`);
      console.error("Error updating order:", error);
      throw error;
    } finally {
      conn.release();
    }
  }
}
