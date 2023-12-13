import { Request, Response, NextFunction } from "express";
import { BaseController } from "../common/base.controller";
import { injectable, inject } from "inversify";
import { join, extname } from 'path';
import { existsSync, rm, unlink } from 'fs';
import { TYPES } from "../types";
import { ILogger } from "../logger/logger.interface";
import { IConfigService } from "../config/config.service.interface";
import { BoardsServices } from "./boards.services";
import { AuthMiddleware } from "../common/auth.middleware";
import { ValidatePropertiesMiddleware } from "../common/validateProperties.middleware";
import fileUpload from "express-fileupload";
import { v4 as uuidv4 } from 'uuid';
import { ColumnsServices } from "../columns/columns.services";
import { UsersServices } from "../users/users.services";
import { WsSender } from '../websocket/ws.sender';
import { IParticipantsModel } from "./boards.types";
import { getClietntsIds } from "../utils/utils";

@injectable()
export class BoardsController extends BaseController {

    constructor(
        @inject(TYPES.ILogger) private loggerservice: ILogger,
        @inject(TYPES.ConfigService) private configService: IConfigService,
        @inject(TYPES.BoardsServices) private boardsService: BoardsServices,
        @inject(TYPES.ColumnsServices) private columnsServices: ColumnsServices,
        @inject(TYPES.UsersServices) private usersServices: UsersServices,
        @inject(TYPES.WsSender) private wsSender: WsSender,
    ) {
        super(loggerservice);
        this.bindRoutes([
            { path: '/', method: 'get', func: this.getAllBoards, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/guest', method: 'get', func: this.getAllGuestBoards, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:boardId', method: 'get', func: this.getBoardInfo, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/', method: 'post', func: this.createBoard, middlewares: [new AuthMiddleware(this.configService.get('SECRET')), new ValidatePropertiesMiddleware(['name'])] },
            { path: '/:boardId', method: 'put', func: this.updateBoardInfo, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:boardId', method: 'delete', func: this.deleteBoard, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:boardId/columns', method: 'get', func: this.getColumnsByBoardId, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:boardId/participant/:userId', method: 'post', func: this.addParticipantToBoard, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:boardId/participants', method: 'get', func: this.getBoardParticipants, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:boardId/participant/:userId', method: 'delete', func: this.removeParticipantFromBoard, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
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
    async getAllGuestBoards(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const boards = await this.boardsService.getAllGuestBoards(req.user.id);
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

    async updateBoardInfo({ body, files, params, ...req }: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const boardId = parseInt(params.boardId, 10);
            const boardData = body;
            if (!(boardData['name'] || files?.photo)) {
                this.error(res, 422, 'The request must have at least one of the following properties: name, photo (file)');
                return;
            }

            const board = await this.boardsService.getBoardInfo(boardId);

            if (!board) {
                this.error(res, 404, 'The board doesn\'t exist!');
                return;
            }

            boardData.previewImage = await new Promise((rej) => {
                if (files && Object.keys(files).length >= 1) {
                    if (board.previewImage) unlink(join(__dirname, '../public', board.previewImage), (err) => err && this.loggerservice.error(err));

                    const photo = files.photo as fileUpload.UploadedFile;
                    const photoId = uuidv4();
                    const uploadPath = join(__dirname, '../public/uploads', `boardPhoto_${photoId}${extname(photo.name)}`);

                    photo.mv(uploadPath, async (err) => {
                        if (err) {
                            rej(undefined);
                        }
                        rej(`/uploads/boardPhoto_${photoId}${extname(photo.name)}`);
                    });
                } else {
                    rej(undefined);
                }
            })
            const updatedBoard = await this.boardsService
                .updateBoardInfo(
                    boardId,
                    { name: boardData.name, previewImage: boardData.previewImage }
                );

            if (updatedBoard) {
                this.ok(res, updatedBoard);

                const participants = await this.boardsService.getParticipants(boardId);
                if(!participants) return;
                const clientsIds = getClietntsIds(req.user.id, participants.users);
                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/updateBoardInfo', body: updatedBoard });
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

            if (!board) {
                this.error(res, 404, 'The board doesn\'t exist!');
                return;
            }
            if (board.previewImage) unlink(join(__dirname, '../public', board.previewImage), (err) => err && this.loggerservice.error(err));

            if(board.columns?.length) {
                for(const column of board.columns) {
                    const cards = await this.columnsServices.getCardsByColumnId(column.id);

                    for(const card of cards) {
                        const folderPath = join(__dirname, '../public/uploads/', `cardId_${card.cardId}`);
                        if(existsSync(folderPath)) {
                            rm(folderPath, { recursive: true, force: true }, (err) => {
                                if(err) this.loggerservice.error(err);
                            });
                        }
                    }
                }
            }

            const participants = await this.boardsService.getParticipants(boardId);
            const success = await this.boardsService.deleteBoard(boardId);

            if (success) {
                this.ok(res, { message: 'Board deleted successfully.' });
                if(!participants) return;
                const clientsIds = getClietntsIds(req.user.id, participants.users);
                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/deleteBoard', body: { boardId, message: `Board by id-${boardId} had deleted` } });
            } else {
                this.error(res, 404, 'Board is not found.');
            }
        } catch (error) {
            console.log(error);
            
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

    async addParticipantToBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const boardId = parseInt(req.params.boardId, 10);
            const board = await this.boardsService.getBoardInfo(boardId);
            if (!board) {
                this.error(res, 404, 'Board is not found.');
                return;
            }

            const userId = parseInt(req.params.userId, 10);
            const user = await this.usersServices.getUserInfo(userId);
            if(!user) {
                this.error(res, 404, 'User is not found.');
                return;
            }
            if(!board.participants) {
                this.error(res, 500, 'Something went wrong, please try again later.');
                return;
            }
            const result = await this.boardsService.addParticipant(board.participants.id, userId);
            this.ok(res, result);

            const participants = await this.boardsService.getParticipants(boardId);
            const updatedBoard = await this.boardsService.getBoardInfo(boardId);
            if(!participants || !updatedBoard) return;
            const clientsIds = getClietntsIds(req.user.id, participants.users);
            this.wsSender.sendMessage(clientsIds, { type: 'ws/api/addParticipantToBoard', body: updatedBoard });
        } catch (error) {
            this.error(res, 500, 'Something went wrong, please try again later.');
        }
    }
    async getBoardParticipants(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const boardId = parseInt(req.params.boardId, 10);
            const board = await this.boardsService.getBoardInfo(boardId);

            if (!board) {
                this.error(res, 404, 'Board is not found.');
                return;
            }
            const participants = await this.boardsService.getParticipants(boardId);
            if(participants) {
                this.ok(res, participants);
            } else {
                this.error(res, 404, 'Participants are not found');
            }
        } catch (error) {
            this.error(res, 500, 'Something went wrong, please try again later.');
        }
    }
    async removeParticipantFromBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const boardId = parseInt(req.params.boardId, 10);
            const board = await this.boardsService.getBoardInfo(boardId);
            if (!board) {
                this.error(res, 404, 'Board is not found.');
                return;
            }

            const userId = parseInt(req.params.userId, 10);
            const user = await this.usersServices.getUserInfo(userId);
            if(!user) {
                this.error(res, 404, 'User is not found.');
                return;
            }

            if(board.createdBy.id === userId) {
                this.error(res, 400, 'Can\'t remove board owner');
                return;
            }

            if(!board.participants) {
                this.error(res, 500, 'Something went wrong, please try again later.');
                return;
            }
            const participants = await this.boardsService.getParticipants(boardId);

            const result = await this.boardsService.removeParticipant(board.participants.id, userId);
            this.ok(res, result);

            if(!participants) return;
            const clientsIds = getClietntsIds(req.user.id, participants.users);
            this.wsSender.sendMessage(clientsIds, { type: 'ws/api/removeParticipantFromBoard', body: {
                removedUserId: userId,
                participants: result
            } });
        } catch (error) {
            this.error(res, 500, 'Something went wrong, please try again later.');
        }
    }
}