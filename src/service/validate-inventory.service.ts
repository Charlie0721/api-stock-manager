import { RowDataPacket } from "mysql2";
import { getConnection } from "../database";

export class ValidateInventory {
  // Obtener parámetro para facturar sin existencias
  public async getFactsInExistParam(): Promise<number> {
    const conn = await getConnection();
    const [_param] = await conn.query<RowDataPacket[]>(
      `SELECT opf.factsinexist FROM otrosparamfact opf`
    );
    let param = 0;
    param = _param[0]?.factsinexist ?? 0;
    return param;
  }

  // Método público para validar existencias
  public async validateStockParameter(
    warehouseId: number,
    productIds: Array<number>,
    quantities: Array<number>
  ): Promise<string> {
    const message = await this.validateQuantities(
      warehouseId,
      productIds,
      quantities
    );
    return message;
  }

  // Método privado para verificar cantidades en inventario
  private async validateQuantities(
    warehouseId: number,
    productIds: Array<number>,
    quantities: Array<number>
  ): Promise<string> {
    const conn = await getConnection();

    // Consulta para obtener el inventario
    const [stocks] = await conn.query<RowDataPacket[]>(
      `SELECT p.descripcion, i.idproducto, i.cantidad, alm.nomalmacen
       FROM productos p
       LEFT JOIN inventario i ON p.idproducto = i.idproducto
       LEFT JOIN almacenes alm ON i.idalmacen = alm.idalmacen
       WHERE i.idalmacen = ? AND p.estado = 1 AND p.idproducto IN (?)`,
      [warehouseId, productIds]
    );

    let message = "";

    const invalidProducts = [];
    for (let i = 0; i < productIds.length; i++) {
      const product = stocks.find((item) => item.idproducto === productIds[i]);

      // Verifica si el producto existe en el inventario y si tiene suficiente cantidad
      if (!product || quantities[i] > (product.cantidad || 0)) {
        invalidProducts.push({
          descripcion: product?.descripcion || `ID ${productIds[i]}`,
          cantidad: product?.cantidad || 0,
          cantidadSolicitada: quantities[i],
        });
      }
    }

    if (invalidProducts.length > 0) {
      message = `No puede cargar pedido !!. 
      Los siguientes productos no cuentan con stock suficiente en inventario:  ${invalidProducts
        .map(
          (p) =>
            `${p.descripcion} (requeridos: ${p.cantidadSolicitada}, disponible: ${p.cantidad})`
        )
        .join(", ")}`;
    }

    return message;
  }
}
