import { connect } from "../database";
import { MoneyCollectionDto } from "../interface/money-collection.dto";
import { ResultSetHeader, RowDataPacket } from "mysql2";
export class MoneyCollectionService {
  constructor() {}

  async create(moneyCollectionDto: MoneyCollectionDto) {
    const conn = await connect();
    const value = moneyCollectionDto.getValor();
    const description = moneyCollectionDto.getDescripcion();
    const email = moneyCollectionDto.getEmail();

    moneyCollectionDto.setValor(value);
    moneyCollectionDto.setDescripcion(description);
    moneyCollectionDto.setEmail(email);
    try {
      const money = await conn.query<ResultSetHeader>(
        `INSERT INTO recaudos_movil (Valor, Descripcion, eMail)
        VALUES (?,?,?)`,
        [
          moneyCollectionDto.getValor(),
          moneyCollectionDto.getDescripcion(),
          moneyCollectionDto.getEmail(),
        ]
      );
      const insertId = money[0].insertId;

      const [data] = await conn.query(
        `SELECT * FROM recaudos_movil WHERE IdRecaudo = ?`,
        [insertId]
      );

      return data;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async findOne(idRecaudo: number) {
    const conn = await connect();

    try {
      const [empresaData] = await conn.query<RowDataPacket[]>(
        `SELECT nit, digito, direccion, telefono1
        FROM empresa`
      );

      const [recaudoData] = await conn.query<RowDataPacket[]>(
        `SELECT IdRecaudo, Valor, Descripcion, Fecha_Recaudo, eMail
        FROM recaudos_movil
        WHERE IdRecaudo = ?`,
        [idRecaudo]
      );

      const combinedData = {
        nit: empresaData[0]?.nit,
        digito: empresaData[0]?.digito,
        direccion: empresaData[0]?.direccion,
        telefono1: empresaData[0]?.telefono1,
        IdRecaudo: recaudoData[0]?.IdRecaudo,
        Valor: recaudoData[0]?.Valor,
        Descripcion: recaudoData[0]?.Descripcion,
        eMail: recaudoData[0]?.eMail,
        Fecha_Tramite: recaudoData[0]?.Fecha_Recaudo,
      };

      return combinedData;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
}