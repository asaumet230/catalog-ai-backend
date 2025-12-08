import express, { Express } from 'express';
import cors from 'cors';
import { PathsProps } from '../interfaces';
import { dbConnection } from '../database';
import { authRouter, usersRouter, catalogsRouter, analyticsRouter, productsRouter } from '../routes';

/**
 * Server Class
 * Centralizes all server configuration and initialization
 * Following Single Responsibility Principle (SOLID)
 *
 * @class Server
 * @description Main server class that configures Express app, routes, middlewares and database
 */


export class Server {
    private app       : Express;
    private paths     : PathsProps;
    private port      : string;
    private whiteList : string[];

    constructor() {
        this.app = express();
        this.port = process.env.PORT || '8080';

        this.paths = {
            auth            : '/api/auth',
            users           : '/api/users',
            catalogs        : '/api/catalogs',
            analytics       : '/api',
            products        : '/api/products',
        }

        this.whiteList = process.env.CORS_WHITELIST?.split(',') || [
            'http://localhost:3000',
            'http://localhost:3001',
        ];

        this.middlewares();
        this.connectDB();
        this.routes();
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`🚀 Server running on port: ${this.port}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        });
    }

    async connectDB() {
        await dbConnection();
    }

    private middlewares() {
        
        this.app.use(cors({
            origin: (origin, callback) => {
                if (!origin || this.whiteList.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
        }));

        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.static('public'));
    }

    private routes() {

        this.app.use(this.paths.auth, authRouter);
        this.app.use(this.paths.users, usersRouter);
        this.app.use(this.paths.catalogs, catalogsRouter);
        this.app.use(this.paths.analytics, analyticsRouter);
        this.app.use(this.paths.products, productsRouter);

        this.app.get('/health', (_, res) => {
            res.status(200).json({
                ok      : true,
                message : 'CatalogAI API is running',
                version : '1.0.0',
            });
        });
    }
}
