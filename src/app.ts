import express, { Application } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import responseTime from'response-time';
dotenv.config();
import IndexRoutes from './routes/index.routes'
export class App {

    private app: Application;
    constructor(private port?: number | string) {
        this.app = express();
        this.settings();
        this.middlewares();
        this.routes();

    }

    settings() {
        this.app.set('port', this.port || process.env.PORT || 4000);
    }

    middlewares() {
        this.app.use(morgan('dev'));
        this.app.use(responseTime());
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(express.json());
        this.app.use(cors());
        this.app.use(compression());
    }
    routes() {
        this.app.use(IndexRoutes);
    }


    async listen() {

        await this.app.listen(this.app.get('port'));
        console.log('--------------------------------------------------')
        console.log(`Server listening on http://localhost:${this.app.get('port')}`)
        console.log('--------------------------------------------------')
      
    }


}