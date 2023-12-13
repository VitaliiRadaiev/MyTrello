import { injectable, inject } from 'inversify';
import 'reflect-metadata';
import express, { Express } from 'express';
import { Server, createServer } from 'http';
import cors from 'cors';
import path from 'path';
import fileUpload from 'express-fileupload';
import ws, { WebSocketServer } from 'ws';
import { TYPES } from './types';
import { PrismaService } from './database/prisma.service';
import { ILogger } from './logger/logger.interface';
import { IExeptionFilter } from './errors/exeption.filter.interface';
import { IConfigService } from './config/config.service.interface';
import { UsersController } from './users/users.controller';
import { ColumnsController } from './columns/columns.controller';
import { Websocket } from './websocket/websocket';

@injectable()
export class App {
    app: Express;
    server: Server;
    port: number;
    wss: WebSocketServer;

    constructor(
        @inject(TYPES.ILogger) private logger: ILogger,
        @inject(TYPES.ExeptionFilter) private exeptionFilter: IExeptionFilter, 
        @inject(TYPES.PrismaService) private prismaService: PrismaService,
        @inject(TYPES.ConfigService) private configService: IConfigService,  
        @inject(TYPES.UsersController) private usersController: UsersController,  
        @inject(TYPES.BoardsController) private boardsController: UsersController,  
        @inject(TYPES.ColumnsController) private columnsController: ColumnsController,  
        @inject(TYPES.CardsController) private cardsController: ColumnsController,  
        @inject(TYPES.Websocket) private websocket: Websocket,  
    ) {
        this.app = express();
        this.port = 8001;
        this.server = createServer(this.app);
        this.wss = new WebSocketServer({ server: this.server, path: '/api/ws' });
    }

    private useMiddleware(): void {
        this.app.use(express.json());
        this.app.use(cors());
        this.app.use(fileUpload({}));
    }

    private useRoutes(): void {
        this.app.use('/api/users', this.usersController.router);
        this.app.use('/api/boards', this.boardsController.router);
        this.app.use('/api/columns', this.columnsController.router);
        this.app.use('/api/cards', this.cardsController.router);
    }

    private useExeptionFilters(): void {
        this.app.use(this.exeptionFilter.catch.bind(this.exeptionFilter));
    }

    private useWebsocket(): void {
        this.wss.on('connection', this.websocket.init);
    }

    public async init(): Promise<void> {
        this.useMiddleware();
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.useRoutes();
        this.useExeptionFilters();
        this.app.use((req, res, next) => {
            res.sendFile(path.join(path.join(__dirname, 'public', 'index.html')));
        });
        await this.prismaService.connect();
        this.useWebsocket();
        this.server.listen(this.port);
        console.log('Server is running on http://localhost:8001');
    }
}