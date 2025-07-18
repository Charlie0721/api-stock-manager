import { Request, Response } from "express";
import { getConnection } from "../database";
import * as fsFiles from "fs";
import { DIRECTORYTOSAVE } from "../config/constants";
import { RowDataPacket } from "mysql2";
export class DataCollector {
  /**
   * Buscar producto por codigo de barras
   */

  static searchProductBarcode = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    let conn;

    try {
      conn = await getConnection();
      const barcodeFound: string = req.body.barcode; 

      const [response] = await conn.query<RowDataPacket[]>(
        `SELECT 
         p.idproducto,
         p.descripcion, 
         p.precioventa, 
         p.barcode AS primary_barcode,
         GROUP_CONCAT(br.barcode) AS alternative_barcodes
       FROM productos p
       LEFT JOIN barrasprod br ON p.idproducto = br.idproducto
       WHERE p.barcode = ? OR br.barcode = ?
       GROUP BY p.idproducto
       LIMIT 1`, 
        [barcodeFound, barcodeFound] 
      );
      return res.status(200).json(response || null);
    } catch (error) {
      console.error("Error en searchProductBarcode:", error);
      return res.status(500).json({ error: "Error al buscar producto" });
    } finally {
      if (conn) {
        conn.release();
      }
    }
  };

  /**
   * Crear archivo txt en el servidor pos
   */
  static createTextFile = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const warehouseId = parseInt(req.params.idalmacen);
      const dataCollector = new DataCollector();
      const warehouseName = await dataCollector.getWareHouseName(warehouseId);

      const finalDataCollector = JSON.stringify(data);
      let barcode: any = [];
      const finalDataParsed = JSON.parse(finalDataCollector);
      finalDataParsed.forEach((collector: any) => {
        barcode.push(
          collector.barcode + collector.coma + collector.amount + "\n"
        );
      });

      const dataToFiletext = barcode.join("");
      const dateNow = new Date();
      let dateGenerated = dateNow.getTime();
      const directoryToSave = DIRECTORYTOSAVE;

      fsFiles.writeFile(
        directoryToSave +
          "/inventario" +
          dateGenerated +
          " del almacén " +
          warehouseName +
          ".txt",
        dataToFiletext,
        (error) => {
          if (error) {
            console.log(error);
            res.status(500).json({ error: error });
          } else {
            res.json({
              message: "El archivo fue creado",
              code: dateGenerated,
            });
            console.log("archivo creado con el codigo: " + dateGenerated);
          }
        }
      );
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    }
  };

  /**
   * Crear archivo txt para tralados en el servidor pos
   */
  static createTextFileTransfers = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const finalDataCollector = JSON.stringify(data);
      let barcode: any = [];
      const finalDataParsed = JSON.parse(finalDataCollector);
      finalDataParsed.forEach((collector: any) => {
        barcode.push(
          collector.SelectOrigin +
            collector.coma +
            collector.SelectDestination +
            collector.coma1 +
            collector.barcode +
            collector.coma2 +
            collector.amount +
            "\n"
        );
      });
      const dataToFileText = barcode.join("");
      const dateNow = new Date();
      let dateGenerated = dateNow.getTime();
      const directoryToSave = process.env.DIRECTORYTOSAVE;

      fsFiles.writeFile(
        directoryToSave + "/traslados" + dateGenerated + ".txt",
        dataToFileText,
        (error) => {
          if (error) {
            console.log(error);
            res.status(500).json({ error: error });
          } else {
            res.json({
              message: "El archivo fue creado",
              code: dateGenerated,
            });
            console.log("archivo creado con el codigo: " + dateGenerated);
          }
        }
      );
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    }
  };
  static searchWarehousesActive = async (req: Request, res: Response) => {
    let conn;

    try {
      conn = await getConnection();
      const response = await conn.query(
        `SELECT idalmacen, nomalmacen from almacenes WHERE activo=1`
      );
      if (response.length > 0) {
        return res.json(response[0]);
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    } finally {
      if (conn) {
        conn.release();
      }
    }
  };

  private async getWareHouseName(warehouseId: number): Promise<string> {
    let conn;

    try {
      conn = await getConnection();
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT nomalmacen FROM almacenes WHERE idalmacen=?`,
        [warehouseId]
      );

      if (rows.length > 0) {
        const { nomalmacen } = rows[0];
        const trimmedNomalmacen = nomalmacen.trim();

        return trimmedNomalmacen;
      } else {
        console.log(`No warehouse found with id ${warehouseId}`);
        return `No warehouse found with id ${warehouseId}`;
      }
    } catch (error) {
      console.log(error);
      return `Error al buscar el almacen ${error}`;
    } finally {
      if (conn) {
        conn.release();
      }
    }
  }
}
