import { connect } from "../database";
import { StockManagerParamsDto } from "../interface/stock_manager-params.dto";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export class StocManagerParamsService {
  constructor() {}

  public async create(
    uuid: string,
    stockManagerParamsDto: StockManagerParamsDto
  ) {
    const pool = await connect();
    const conn = await pool.getConnection();

    const salerId = stockManagerParamsDto.getIdVendedor();
    const customerId = stockManagerParamsDto.getIdCliente();
    const warehouseId = stockManagerParamsDto.getIdAlmacen();
    const uuidUser = uuid;
    stockManagerParamsDto.setIdVendedor(salerId);
    stockManagerParamsDto.setIdCliente(customerId);
    stockManagerParamsDto.setIdAlmacen(warehouseId);
    try {
      const _stockParams = await conn.query<ResultSetHeader>(
        `INSERT INTO param_stock_manager (Id_Vendedor,Id_Cliente,Id_Almacen,Uuid_Usuario )
            VALUES(?,?,?,?)`,
        [
          stockManagerParamsDto.getIdVendedor(),
          stockManagerParamsDto.getIdCliente(),
          stockManagerParamsDto.getIdAlmacen(),
          uuidUser,
        ]
      );
      return _stockParams;
    } catch (error) {
      console.log(error);
      return error;
    } finally {
      if (conn) conn.release();
    }
  }

  public async getOne(uuid: string) {
    const pool = await connect();
    const conn = await pool.getConnection();

    try {
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT Id_Vendedor, Id_Cliente, Id_Almacen
              FROM param_stock_manager psm
              WHERE psm.Uuid_Usuario = ?`,
        [uuid]
      );

      if (rows.length > 0) {
        return rows[0];
      } else {
        return { status: 404, message: "Not found" };
      }
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      if (conn) {
        conn.release();
      }
    }
  }
}
