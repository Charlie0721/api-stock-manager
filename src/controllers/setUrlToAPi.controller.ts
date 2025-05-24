import { Request, Response } from 'express'
import { ConnectToApiDto } from '../interface/connect-api.dto'
import { UrlApiService } from '../service/url-api.service'

export class ConnectToApiController {

    public static saveUrlApi = async (req: Request, res: Response) => {
        const { header, iP1, pointOne, iP2, pointTwo, iP3, pointThree, iP4, twoPoints, port } = req.body
        const connectToApiDto = new ConnectToApiDto(header, iP1, pointOne, iP2, pointTwo, iP3, pointThree, iP4, twoPoints, port)
        const urlApiService = new UrlApiService()

        try {
            const result = await urlApiService.saveUrl(connectToApiDto);

            if (result.success) {
                return res.status(201).json({
                    success: true,
                    message: result.message,
                    url: result.url
                });
            } else {
                return res.status(result.url ? 409 : 500).json({
                    success: false,
                    message: result.message,
                    url: result.url || undefined
                });
            }

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor"
            });
        }
    }

    public static findAll = async (req: Request, res: Response) => {
        const urlApiService = new UrlApiService()
        try {
            const urls = await urlApiService.findAll()
            return res.status(200).json(urls)
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor"
            })
        }
    }
}