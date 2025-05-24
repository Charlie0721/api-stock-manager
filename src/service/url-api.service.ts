import { getConnection } from "../database";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { ConnectToApiDto } from "../interface/connect-api.dto";
export class UrlApiService {

    public constructor() { }

    public async saveUrl(connectToApiDto: ConnectToApiDto): Promise<{ success: boolean, message: string, url?: string }> {
        let conn;
        conn = await getConnection();

        const header = connectToApiDto.getHeader();
        const ip1 = connectToApiDto.getIp1();
        const pointOne = connectToApiDto.getPointOne();
        const ip2 = connectToApiDto.getIp2();
        const pointTwo = connectToApiDto.getPointTwo();
        const ip3 = connectToApiDto.getIp3();
        const pointThree = connectToApiDto.getPointThree();
        const ip4 = connectToApiDto.getIp4();
        const twoPoints = connectToApiDto.getTwoPoints();
        const port = connectToApiDto.getPort();

        connectToApiDto.setHeader(header);
        connectToApiDto.setIp1(ip1);
        connectToApiDto.setPointOne(pointOne);
        connectToApiDto.setIp2(ip2);
        connectToApiDto.setPointTwo(pointTwo);
        connectToApiDto.setIp3(ip3);
        connectToApiDto.setPointThree(pointThree);
        connectToApiDto.setIp4(ip4);
        connectToApiDto.setTwoPoints(twoPoints);
        connectToApiDto.setPort(port);

        try {
            const url = `${header}${ip1}${pointOne}${ip2}${pointTwo}${ip3}${pointThree}${ip4}${twoPoints}${port}`;
            const existUrl = await this.existUrl(url);
            if (existUrl) {
                return {
                    success: false,
                    message: `La URL ${url} ya existe`,
                    url: url
                };
            }
            await conn.query<ResultSetHeader>(
                `INSERT INTO stock_manager_url (url) VALUES(?)`,
                [url]
            );

            return {
                success: true,
                message: "URL guardada exitosamente",
                url: url
            };
        } catch (error) {
            console.log(error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "Error desconocido al guardar la URL"
            };
        }
        finally {
            if (conn) conn.release();
        }
    }

    public async findAll(): Promise<{ success: boolean, message: string, urls?: string[] }> {
        let conn;
        conn = await getConnection();
        try {
            const [rows] = await conn.query<RowDataPacket[]>(
                `SELECT * FROM stock_manager_url`
            );
            return {
                success: true,
                message: "URLs obtenidas exitosamente",
                urls: rows.map((row) => row.url)
            };
        } catch (error) {
            console.log(error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "Error desconocido al obtener las URLs"
            };
        }
        finally {
            if (conn) conn.release();
        }
    }

    private async existUrl(url: string): Promise<boolean> {
        let conn;
        conn = await getConnection();
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT * FROM stock_manager_url WHERE url = ?`,
            [url]
        );
        return rows.length > 0;
    }
}





