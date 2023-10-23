import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import { ColumnsServices } from './columns.services';
import { ILogger } from '../logger/logger.interface';
import { IConfigService } from '../config/config.service.interface';
import { AuthMiddleware } from '../common/auth.middleware';
import { BoardsServices } from '../boards/boards.services';
import { ValidatePropertiesMiddleware } from '../common/validateProperties.middleware';

@injectable()
export class ColumnsController extends BaseController {
    constructor(
        @inject(TYPES.ILogger) private loggerservice: ILogger,
        @inject(TYPES.ConfigService) private configService: IConfigService,
        @inject(TYPES.ColumnsServices) private columnsServices: ColumnsServices,
        @inject(TYPES.BoardsServices) private boardsServices: BoardsServices,
    ) {
        super(loggerservice);
        this.bindRoutes([
            { path: '/', method: 'post', func: this.createColumn, middlewares: [new AuthMiddleware(this.configService.get('SECRET')), new ValidatePropertiesMiddleware(['boardId', 'name'])] },
            { path: '/:columnId', method: 'get', func: this.getColumnById, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:columnId', method: 'put', func: this.updateColumn, middlewares: [new AuthMiddleware(this.configService.get('SECRET')), new ValidatePropertiesMiddleware(['name', 'order'])] },
            { path: '/:columnId', method: 'delete', func: this.deleteColumn, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
        ]);
    }

    async createColumn({ body }: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const boardId = body.boardId;
            const board = await this.boardsServices.getBoardInfo(boardId);

            if (!board) {
                this.error(res, 404, 'Board is not found.');
                return;
            }

            const column = await this.columnsServices.createColumn(body);
            this.ok(res, column);
        } catch (error) {
            this.loggerservice.error(error);
            this.error(res, 500, 'Something went wrong, please try again later.');
        }
    }

    async getColumnById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const columnId = parseInt(req.params.columnId, 10);
            const column = await this.columnsServices.getColumnById(columnId);
            if (column) {
                this.ok(res, column);
            } else {
                this.error(res, 404, 'Column not found.');
            }
        } catch (error) {
            this.error(res, 500, 'Something went wrong, please try again later.');
        }
    }

    async updateColumn(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const columnId = parseInt(req.params.columnId, 10);
            const updatedColumn = await this.columnsServices.updateColumn(columnId, req.body);
            if (updatedColumn) {
                this.ok(res, updatedColumn);
            } else {
                this.error(res, 404, 'Column not found.');
            }
        } catch (error) {
            this.error(res, 500, 'Something went wrong, please try again later.');
        }
    }

    async deleteColumn(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const columnId = parseInt(req.params.columnId, 10);
            const success = await this.columnsServices.deleteColumn(columnId);
            if (success) {
                this.ok(res, { message: 'Column deleted successfully.' });
            } else {
                this.error(res, 404, 'Column not found.');
            }
        } catch (error) {
            this.error(res, 500, 'Something went wrong, please try again later.');
        }
    }

}