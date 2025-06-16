import { RowDataPacket } from "mysql2";
import { getConnection } from "../database";

export class PurchasesService {
  public constructor() {}

  public async getResolutions(
    resolutionCategoryType: number,
    warehouseId: number
  ) {
    let conn;
    try {
      conn = await getConnection();
      const resolutions = await conn.query<RowDataPacket[]>(
        `SELECT r.idresolucion, r.categoresol, r.tiporesol, r.prefijo, a.IdRelResolCompras, r.numero FROM  resolucion_compras  r
        LEFT JOIN almresolcompras a ON  r.idresolucion = a.idresolucion
        WHERE r.categoresol=? AND a.idalmacen=? `,
        [resolutionCategoryType, warehouseId]
      );
      return resolutions[0];
    } catch (error) {
      console.error("Error fetching resolutions:", error);
      throw error;
    } finally {
      if (conn) {
        conn.release();
      }
    }
  }

  public async getResolutionCategoryTypeByThirdParty(
    thirdPartyId: number
  ): Promise<number> {
    let conn;
    try {
      conn = await getConnection();
      const [result] = await conn.query<RowDataPacket[]>(
        `SELECT tipofactcompras FROM terceros WHERE idtercero = ?`,
        [thirdPartyId]
      );
      if (result.length > 0) {
        return result[0].tipofactcompras;
      }
      throw new Error(
        "No resolution category type found for the given third party ID."
      );
    } catch (error) {
      console.error("Error fetching third party:", error);
      throw error;
    } finally {
      if (conn) {
        conn.release();
      }
    }
  }
  public async getPurshaseNumberByResolutionId(
    resolutionId: number,
    warehouseId: number
  ): Promise<number> {
    let conn;
    try {
      conn = await getConnection();
      let nextNumber: number = 0;
      const [result] = await conn.query<RowDataPacket[]>(
        `SELECT MAX(c.numero) AS numero FROM compras c WHERE c.idresolucion = ? AND c.idalmacen = ?`,
        [resolutionId, warehouseId]
      );
      const maxNumber = result[0].numero;
      nextNumber = maxNumber + 1;
      return nextNumber;
    } catch (error) {
      console.error("Error fetching number:", error);
      throw error;
    } finally {
      if (conn) {
        conn.release();
      }
    }
  }
}
