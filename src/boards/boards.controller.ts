import { Request, Response, NextFunction } from "express";
import { BaseController } from "../common/base.controller";
import { injectable, inject } from "inversify";
import { join, extname } from 'path';
import { TYPES } from "../types";
import { ILogger } from "../logger/logger.interface";
import { IConfigService } from "../config/config.service.interface";
import { BoardsServices } from "./boards.services";
import { AuthMiddleware } from "../common/auth.middleware";
import { ValidatePropertiesMiddleware } from "../common/validateProperties.middleware";
import fileUpload from "express-fileupload";
import { v4 as uuidv4 } from 'uuid';
import { unlink } from 'fs';

@injectable()
export class BoardsController extends BaseController {

    constructor(
        @inject(TYPES.ILogger) private loggerservice: ILogger,
        @inject(TYPES.ConfigService) private configService: IConfigService,
        @inject(TYPES.BoardsServices) private boardsService: BoardsServices,
    ) {
        super(loggerservice);
        this.bindRoutes([
            { path: '/', method: 'get', func: this.getAllBoards, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:boardId', method: 'get', func: this.getBoardInfo, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/', method: 'post', func: this.createBoard, middlewares: [new AuthMiddleware(this.configService.get('SECRET')), new ValidatePropertiesMiddleware(['name'])] },
            { path: '/:boardId', method: 'put', func: this.updateBoardInfo, middlewares: [new AuthMiddleware(this.configService.get('SECRET')), new ValidatePropertiesMiddleware(['name'])] },
            { path: '/:boardId', method: 'delete', func: this.deleteBoard, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:boardId/columns', method: 'get', func: this.getColumnsByBoardId, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
        ]);
    }

    async createBoard({ body, files, user }: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            new Promise<string | null>((rej) => {
                if (files && Object.keys(files).length >= 1) {
                    const photo = files.photo as fileUpload.UploadedFile;
                    const photoId = uuidv4();
                    const uploadPath = join(__dirname, '../public/uploads', `boardPhoto_${photoId}${extname(photo.name)}`);
    
                    photo.mv(uploadPath, async (err) => {
                        if (err) {
                            rej(null);
                        }

                        rej(`/uploads/boardPhoto_${photoId}${extname(photo.name)}`)
                    });
                } else {
                    rej(null);
                }
            })
            .then(async photoUrl => {
                const board = await this.boardsService.createBoard(user.id, body.name, photoUrl);
                this.ok(res, board);
            })

        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }

    async getAllBoards(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const boards = await this.boardsService.getAllBoards(req.user.id);
            this.ok(res, boards);
        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }

    async getBoardInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const boardId = parseInt(req.params.boardId, 10);
            const board = await this.boardsService.getBoardInfo(boardId);

            if (board) {
                this.ok(res, board);
            } else {
                this.error(res, 404, 'Board is not found.');
            }
        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }

    async updateBoardInfo({ body, files, params }: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const boardId = parseInt(params.boardId, 10);
            const boardData = body;
            const board = await this.boardsService.getBoardInfo(boardId);

            if(!board) {
                this.error(res, 404, 'The board doesn\'t exist!');
                return;
            }

            boardData.previewImage = await new Promise((rej) => {
                if (files && Object.keys(files).length >= 1) {
                    if(board.previewImage) unlink(join(__dirname, '../public', board.previewImage), (err) => err && this.loggerservice.error(err));

                    const photo = files.photo as fileUpload.UploadedFile;
                    const photoId = uuidv4();
                    const uploadPath = join(__dirname, '../public/uploads', `boardPhoto_${photoId}${extname(photo.name)}`);
    
                    photo.mv(uploadPath, async (err) => {
                        if (err) {
                            rej(null);
                        }
                        rej(`/uploads/boardPhoto_${photoId}${extname(photo.name)}`);
                    });
                } else {
                    rej(null);
                }
            })
            const updatedBoard = await this.boardsService.updateBoardInfo(boardId, boardData);

            if (updatedBoard) {
                this.ok(res, updatedBoard);
            } else {
                this.error(res, 404, 'Board is not found.');
            }
        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }

    async deleteBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const boardId = parseInt(req.params.boardId, 10);
            const board = await this.boardsService.getBoardInfo(boardId);

            if(!board) {
                this.error(res, 404, 'The board doesn\'t exist!');
                return;
            }
            const success = await this.boardsService.deleteBoard(boardId);

            if (success) {
                this.ok(res, { message: 'Board deleted successfully.' });
            } else {
                this.error(res, 404, 'Board is not found.');
            }
        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }

    async getColumnsByBoardId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const boardId = parseInt(req.params.boardId, 10);
            const board = await this.boardsService.getBoardInfo(boardId);

            if (!board) {
                this.error(res, 404, 'Board is not found.');
                return;
            }

            const columns = await this.boardsService.getColumnsByBoardId(boardId);
            this.ok(res, columns);
        } catch (error) {
            this.error(res, 500, 'Something went wrong, please try again later.');
        }
    }
}