import { connect } from "../database";
import { MoneyCollectionDto } from "../interface/money-collection.dto";
import { ResultSetHeader } from "mysql2";
export class MoneyCollectionService {
  constructor() {}

  async create(moneyCollectionDto: MoneyCollectionDto) {
    const conn = await connect();
    const value = moneyCollectionDto.getValor();
    const description = moneyCollectionDto.getDescripcion();

    moneyCollectionDto.setValor(value);
    moneyCollectionDto.setDescripcion(description);

    try {
      const money = await conn.query<ResultSetHeader>(
        `INSERT INTO recaudos_movil (Valor, Descripcion)
        VALUES (?,?)`,
        [moneyCollectionDto.getValor(), moneyCollectionDto.getDescripcion()]
      );
      const insertId = money[0].insertId;

      const [data] = await conn.query(
        `SELECT * FROM recaudos_movil WHERE IdRecaudo = ?`,
        [insertId]
      );

      return data;
    } catch (error) {
      console.log(error);
    }
  }
}
