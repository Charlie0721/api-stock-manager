import { connect } from "../database";
import { MoneyCollectionDto } from "../interface/money-collection.dto";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { createTransport } from "nodemailer";
import { USER_EMAIL, EMAIL_PASSWORD, SENDER_MAIL } from "../config/constants";
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
    const salerId = moneyCollectionDto.getIdVendedor();
    const customerId = moneyCollectionDto.getIdCliente();
    const value = moneyCollectionDto.getValor();
    const description = moneyCollectionDto.getDescripcion();
    const email = moneyCollectionDto.getEmail();

    moneyCollectionDto.setIdVendedor(salerId);
    moneyCollectionDto.setIdCliente(customerId);
    moneyCollectionDto.setValor(value);
    moneyCollectionDto.setDescripcion(description);
    moneyCollectionDto.setEmail(email);
    try {
      const money = await conn.query<ResultSetHeader>(
        `INSERT INTO recaudos_movil (IdVendedor,IdCliente,Valor, Descripcion, eMail)
        VALUES (?,?,?,?,?)`,
        [
          moneyCollectionDto.getIdVendedor(),
          moneyCollectionDto.getIdCliente(),
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

  /**Consultar cartera por clientes*/

  async checkAccountsReceivableByCustomer(customerId: number) {
    const conn = await connect();
    try {
      const [pendingPortfolio] = await conn.query<RowDataPacket[]>(
        `SELECT  
      c.tipodoc, c.valcuota, c.tipocartera, f.numero,c.credito
      FROM cartera c
     LEFT JOIN facturas f ON (c.iddocumento = f.idfactura)
      
     WHERE c.idtercero = ? AND c.tipocartera=1 AND c.valcuota != c.credito
     
      `,
        [customerId]
      );

      if (pendingPortfolio.length === 0) {
        throw { status: 404, message: 'No accounts receivable found for the customer' };
      }

      let quotaValue: number = 0;
      let totalPortfolio: number = 0;
      let balance: number = 0;
      let accountsReceivable: any[] = [];
      const newPortfolio = pendingPortfolio.map((portfolio) => {
        totalPortfolio += portfolio.valcuota;
        balance += portfolio.credito;
        quotaValue = totalPortfolio - balance;
        accountsReceivable.push(portfolio);
        return {
          totalPortfolio,
          balance,
          quotaValue,
        };
      });
      return {
        accountsReceivable,
        portfolio: newPortfolio,
      };
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
        `SELECT IdRecaudo,IdVendedor,IdCliente, Valor, Descripcion, Fecha_Recaudo, eMail
        FROM recaudos_movil
        WHERE IdRecaudo = ?`,
        [idRecaudo]
      );
      let sellerId: number = recaudoData[0]?.IdVendedor;
      let customerId: number = recaudoData[0]?.IdCliente;

      const [sellerData] = await conn.query<RowDataPacket[]>(
        `
      SELECT  idtercero, nombres, apellidos
      FROM terceros WHERE idtercero=?
      `,
        [sellerId]
      );

      const [customerData] = await conn.query<RowDataPacket[]>(
        `  SELECT  idtercero,nit, digito, nombres, apellidos
      FROM terceros WHERE idtercero=?`,
        [customerId]
      );
      let email: string = recaudoData[0]?.eMail;
      const combinedData = {
        nit: empresaData[0]?.nit,
        digito: empresaData[0]?.digito,
        direccion: empresaData[0]?.direccion,
        telefono1: empresaData[0]?.telefono1,
        IdRecaudo: recaudoData[0]?.IdRecaudo,
        encargado_cobro:
          sellerData[0]?.nombres + " " + sellerData[0]?.apellidos,
        identificacion: customerData[0]?.nit,
        Valor: recaudoData[0]?.Valor,
        Descripcion: recaudoData[0]?.Descripcion,
        cliente: customerData[0]?.nombres + " " + customerData[0]?.apellidos,
        nit_cliente: customerData[0]?.nit + "-" + customerData[0]?.digito,
        eMail: email,
        Fecha_Tramite: recaudoData[0]?.Fecha_Recaudo,
      };
      if (email && email.trim() !== "") {
        await this.sendEmailToCustomer(combinedData, email);
      }
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
