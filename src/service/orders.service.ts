import { RowDataPacket } from "mysql2";
import { getConnection } from "../database";

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
        `SELECT  idpedido, numero, fecha, alm.nomalmacen, t.nombres, t.apellidos
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
}
