import { connect } from "../database";
import { StockManagerParamsDto } from "../interface/stock_manager-params.dto";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export class StocManagerParamsService {
  constructor() {}

  public async create(
    uuid: string,
    stockManagerParamsDto: StockManagerParamsDto
  ) {
    const conn = await connect();
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
    }
  }

  public async getOne(uuid: string) {
    const conn = await connect();

    try {
      const [_params] = await conn.query<RowDataPacket[]>(
        `SELECT Id_Vendedor, Id_Cliente,Id_Almacen
            FROM param_stock_manager psm
            WHERE psm.Uuid_Usuario =?
            `,
        [uuid]
      );

      return _params[0];
    } catch (error) {
      console.log(error);
      return error;
    }
  }
}
