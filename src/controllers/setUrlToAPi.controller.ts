import { Request, Response } from 'express'

import { IurlAPi } from '../interface/urlApi.interface'


export const connectToApi = (req: Request, res: Response) => {

    try {

        const urlApi: IurlAPi = {
            header: req.body.header,
            iP1: req.body.iP1,
            pointOne: req.body.pointOne,
            iP2: req.body.iP2,
            pointTwo: req.body.pointTwo,
            iP3: req.body.iP3,
            pointThree: req.body.pointThree,
            iP4: req.body.iP4,
            twoPoints: req.body.twoPoints,
            port: req.body.port
        }


        return res.status(200).json({ urlApi: urlApi })

    } catch (err) {
        console.log(err)
        return res.status(404).json({ error: err })

    }


}


