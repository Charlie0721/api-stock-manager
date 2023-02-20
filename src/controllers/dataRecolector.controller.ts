import { Request, Response } from 'express'
import { connect } from '../database'
import { ISearchByBarcodeToCollector } from '../interface/barcode.interface'
import * as fsFiles from 'fs';

export class DataCollector {

    /**
   * Buscar producto por codigo de barras
   */

    static searchProductBarcode = async (req: Request, res: Response): Promise<Response> => {

        try {
            const conn = await connect();
            let barcodeFound: ISearchByBarcodeToCollector = req.body.barcode;
            const response = await conn.query(`SELECT descripcion, precioventa, barcode FROM productos WHERE barcode =${barcodeFound}`)
            return res.status(200).json(response[0])

        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }

    }

    /**
 * Crear archivo txt en el servidor pos
 */
    static createTextFile = async (req: Request, res: Response) => {

        try {
            const data = req.body
            const finalDataCollector = JSON.stringify(data);
            let barcode: any = [];
            const finalDataParsed = JSON.parse(finalDataCollector);
            finalDataParsed.forEach((collector: any) => {
                barcode.push(
                    collector.barcode + collector.coma + collector.amount + "\n"
                );
            });

            const dataToFiletext = barcode.join("")
            const dateNow = new Date()
            let dateGenerated = dateNow.getTime()
            const directoryToSave = process.env.DIRECTORYTOSAVE

            fsFiles.writeFile(directoryToSave + '/inventario' + dateGenerated + '.txt', dataToFiletext, error => {
                if (error) {
                    console.log(error);
                    res.status(500).json({ error: error })
                } else {
                    res.json({
                        message: 'El archivo fue creado',
                        code: dateGenerated
                    });
                    console.log("archivo creado con el codigo: " + dateGenerated);
                }

            })

        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }
    }

    /**
* Crear archivo txt para tralados en el servidor pos
*/
    static createTextFileTransfers = async (req: Request, res: Response) => {

        try {
            const data = req.body
            const finalDataCollector = JSON.stringify(data);
            let barcode: any = [];
            const finalDataParsed = JSON.parse(finalDataCollector);
            finalDataParsed.forEach((collector: any) => {
                barcode.push(
                    collector.warehouse1 + collector.coma + collector.warehouse2 + collector.coma1 + collector.barcode + collector.coma2 + collector.amount + "\n"
                );
            });
            const dataToFileText = barcode.join("")
            const dateNow = new Date()
            let dateGenerated = dateNow.getTime()
            const directoryToSave = process.env.DIRECTORYTOSAVE

            fsFiles.writeFile(directoryToSave + '/traslados' + dateGenerated + '.txt', dataToFileText, error => {
                if (error) {
                    console.log(error);
                    res.status(500).json({ error: error })
                } else {
                    res.json({
                        message: 'El archivo fue creado',
                        code: dateGenerated
                    });
                    console.log("archivo creado con el codigo: " + dateGenerated);
                }

            })

        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }
    }
    static searchWarehousesActive = async (req: Request, res: Response) => {

        try {
            const conn = await connect();
            const response = await conn.query(`SELECT idalmacen, nomalmacen from almacenes WHERE activo=1`)

            if (response.length > 0) {
                return res.json(response[0])
            }


        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }


    }

}


