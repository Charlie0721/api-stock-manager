import { Request, Response } from 'express'
import { connect } from '../database'
import { ISearchByBarcodeToCollector  } from '../interface/barcode.interface'
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

    static createTextFile = async (req: Request, res: Response) => {


        try {

            const finalData= req.body
            const dataParsed=JSON.stringify(finalData)
            const dateNow = new Date()
            let dateGenerated = dateNow.getTime()
            const directoryToSave = process.env.DIRECTORYTOSAVE
            console.log(dateGenerated, finalData)
            //@ts-ignore
            fsFiles.writeFile(directoryToSave + '/inventario' + dateGenerated + '.txt', dataParsed, error => {
                if (error) {
                    console.log(error);
                    res.status(500).json({ error: error })
                } else
                    res.json({ message: 'El archivo fue creado' });

            })

        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error })
        }

    }





}


