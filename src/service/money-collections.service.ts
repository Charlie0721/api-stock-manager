import { connect } from "../database";
import { MoneyCollectionDto } from "../interface/money-collection.dto";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { createTransport } from "nodemailer";
import { USER_EMAIL, EMAIL_PASSWORD, SENDER_MAIL } from "../config/constants";
import { response } from "express";
const transporter = createTransport({
  host: "smtp.gmail.com",
  auth: {
    user: USER_EMAIL,
    pass: EMAIL_PASSWORD,
  },
});
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
      let email: string = recaudoData[0]?.eMail;
      const combinedData = {
        nit: empresaData[0]?.nit,
        digito: empresaData[0]?.digito,
        direccion: empresaData[0]?.direccion,
        telefono1: empresaData[0]?.telefono1,
        IdRecaudo: recaudoData[0]?.IdRecaudo,
        Valor: recaudoData[0]?.Valor,
        Descripcion: recaudoData[0]?.Descripcion,
        eMail: email,
        Fecha_Tramite: recaudoData[0]?.Fecha_Recaudo,
      };
      await this.sendEmailToCustomer(combinedData, email);
      return combinedData;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
  /**Enviar mail con el recaudo generado*/
  private async sendEmailToCustomer(moneyCollection: {}, email: string) {
    const detailMoneyHtml = this.fotmatDetailMoneyCollection(moneyCollection);

    const responseEmail = await transporter.sendMail({
      to: email,
      from: SENDER_MAIL,
      subject:
        "Recaudo generado desde aplicación Stock manager de Conexion POS",
      html: `Recaudo generado con la siguiente información: 
      ${detailMoneyHtml}
    `,
    });
    return responseEmail;
  }

  private fotmatDetailMoneyCollection(moneyCollection: any): string {
    let detailMoneyHtml = "<p>";
    for (const key in moneyCollection) {
      if (moneyCollection.hasOwnProperty(key)) {
        detailMoneyHtml += `<strong>${key}:</strong> ${moneyCollection[key]}<br> `;
      }
    }
    detailMoneyHtml += "</p>";
    return detailMoneyHtml;
  }
}
