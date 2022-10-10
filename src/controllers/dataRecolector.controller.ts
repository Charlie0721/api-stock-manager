import { Request, Response } from 'express'
import { connect } from '../database'
import { ISearchByBarcodeToCollector } from '../interface/barcode.interface'

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

}


