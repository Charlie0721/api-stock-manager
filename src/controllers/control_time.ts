
import { Request, Response } from 'express'
import { SUBSCRIPTION_END_DATE } from '../config/constants'
export class ControlTime {

    static controlTime = (req: Request, res: Response) => {

        //@ts-ignore    
        const getRemainingTime = deadline => {
            let now = new Date(),
                //@ts-ignore    
                remainTime = (new Date(deadline) - now + 1000) / 1000,
                remainSeconds = ('0' + Math.floor(remainTime % 60)).slice(-2),
                remainMinutes = ('0' + Math.floor(remainTime / 60 % 60)).slice(-2),
                remainHours = ('0' + Math.floor(remainTime / 3600 % 24)).slice(-2),
                remainDays = Math.floor(remainTime / (3600 * 24));

            return {
                remainSeconds,
                remainMinutes,
                remainHours,
                remainDays,
                remainTime
            }
        };
        //@ts-ignore    
        const countdown = (deadline, finalMessage) => {

            const timerUpdate = setInterval(() => {
                let t = getRemainingTime(deadline);
                if (t.remainTime <= 1) {
                    clearInterval(timerUpdate);
                    return res.json({ message: 'Ha finalizado la suscripción' });
                }
                if (t.remainTime > 1) {
                    clearInterval(timerUpdate);
                    res.json({ message: 'continua con la suscripción' })
                }
            }, 1000);
        };
        countdown(SUBSCRIPTION_END_DATE, '¡Ya empezó!');
    }




}