import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { injectable, inject } from 'inversify';
import { join } from 'path';
import fileUpload from 'express-fileupload';
import { v4 as uuidv4 } from 'uuid';
import { unlink, existsSync, mkdirSync, rm } from 'fs';
import { TYPES } from '../types';
import { ILogger } from '../logger/logger.interface';
import { IConfigService } from '../config/config.service.interface';
import { AuthMiddleware } from '../common/auth.middleware';
import { ValidatePropertiesMiddleware } from '../common/validateProperties.middleware';
import { CardsServices } from './cards.services';
import { ColumnsServices } from '../columns/columns.services';
import { IUploadImage } from './cards.types';
import { CardImageModel } from '@prisma/client';
import { WsSender } from '../websocket/ws.sender';
import { BoardsServices } from '../boards/boards.services';
import { getClietntsIds } from '../utils/utils';


@injectable()
export class CardsController extends BaseController {
    constructor(
        @inject(TYPES.ILogger) private loggerservice: ILogger,
        @inject(TYPES.ConfigService) private configService: IConfigService,
        @inject(TYPES.CardsServices) private cardsServices: CardsServices,
        @inject(TYPES.ColumnsServices) private columnsServices: ColumnsServices,
        @inject(TYPES.BoardsServices) private boardsServices: BoardsServices,
        @inject(TYPES.WsSender) private wsSender: WsSender,
    ) {
        super(loggerservice);
        this.bindRoutes([
            { path: '/', method: 'post', func: this.createCard, middlewares: [new AuthMiddleware(this.configService.get('SECRET')), new ValidatePropertiesMiddleware(['columnId', 'title'])] },
            { path: '/:cardId', method: 'get', func: this.getCardById, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:cardId', method: 'put', func: this.updateCard, middlewares: [new AuthMiddleware(this.configService.get('SECRET')), new ValidatePropertiesMiddleware(['title', 'description', 'order'], true)] },
            { path: '/:cardId/column', method: 'put', func: this.setNewColumn, middlewares: [new AuthMiddleware(this.configService.get('SECRET')), new ValidatePropertiesMiddleware(['columnId', 'order'])] },
            { path: '/:cardId', method: 'delete', func: this.deleteCard, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },

            { path: '/:cardId/images', method: 'post', func: this.uploadImages, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:cardId/images', method: 'get', func: this.getCardImages, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/image/:imageId', method: 'get', func: this.getCardImageById, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/image/:imageId', method: 'delete', func: this.deleteCardImage, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },

            { path: '/:cardId/comment', method: 'post', func: this.createCardComment, middlewares: [new AuthMiddleware(this.configService.get('SECRET')), new ValidatePropertiesMiddleware(['text'])] },
            { path: '/:cardId/comments', method: 'get', func: this.getCardComments, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/comment/:commentId', method: 'put', func: this.updateCardComment, middlewares: [new AuthMiddleware(this.configService.get('SECRET')), new ValidatePropertiesMiddleware(['text'])] },
            { path: '/comment/:commentId', method: 'delete', func: this.deleteCardComment, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/comment/:commentId', method: 'get', func: this.getCardCommentById, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/comment/status/:statusId', method: 'put', func: this.setCardCommentsReadStatus, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
        ]);
    }

    async createCard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { columnId, title } = req.body;
            const column = await this.columnsServices.getColumnById(Number(columnId));
            if (!column) {
                this.error(res, 404, 'Column not found.');
                return;
            }

            const card = await this.cardsServices.createCard(Number(columnId), title);
            this.ok(res, card);

            const boardId = column.boardId;
            const participants = await this.boardsServices.getParticipants(boardId);
            if (!participants) return;
            const clientsIds = getClietntsIds(req.user.id, participants.users);
            const columns = await this.boardsServices.getColumnsByBoardId(boardId);
            this.wsSender.sendMessage(clientsIds, { type: 'ws/api/createCard', body: columns });
        } catch (error) {
            this.error(res, 500, 'Something went wrong while creating the card.');
        }
    }
    async getCardById(req: Request, res: Response, next: NextFunction): Promise<void> {
        const { cardId } = req.params;

        try {
            const card = await this.cardsServices.getCardById(Number(cardId));
            if (card) {
                this.ok(res, card);
            } else {
                this.error(res, 404, 'Card not found.');
            }
        } catch (error) {
            console.log(error);

            this.error(res, 500, 'Something went wrong while fetching the card.');
        }
    }
    async updateCard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { cardId } = req.params;

            const updatedCard = await this.cardsServices.updateCard(Number(cardId), req.body);
            if (updatedCard) {
                this.ok(res, updatedCard);

                const column = await this.columnsServices.getColumnById(updatedCard.columnId);
                if (!column) return;

                const boardId = column.boardId;
                const participants = await this.boardsServices.getParticipants(boardId);
                if (!participants) return;

                const clientsIds = getClietntsIds(req.user.id, participants.users);
                const columns = await this.boardsServices.getColumnsByBoardId(boardId);
                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/updateCard', body: columns });
            } else {
                this.error(res, 404, 'Card not found.');
            }
        } catch (error) {
            this.error(res, 500, 'Something went wrong while updating the card.');
        }
    }
    async setNewColumn(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { cardId } = req.params;

            const card = await this.cardsServices.getCardById(Number(cardId));
            if (!card) {
                this.error(res, 404, 'Card not found.');
                return;
            }

            const columnId = req.body.columnId;
            const column = await this.columnsServices.getColumnById(Number(columnId));
            if (!column) {
                this.error(res, 404, 'Column not found.');
                return;
            }

            const updatedCard = await this.cardsServices.setNewColumn(Number(cardId), Number(columnId), req.body.order);
            this.ok(res, updatedCard);

            const boardId = column.boardId;
            const participants = await this.boardsServices.getParticipants(boardId);
            if (!participants) return;

            const clientsIds = getClietntsIds(req.user.id, participants.users);
            const columns = await this.boardsServices.getColumnsByBoardId(boardId);
            this.wsSender.sendMessage(clientsIds, { type: 'ws/api/setNewColumn', body: columns });
        } catch (error) {
            console.log(error);

            this.error(res, 500, 'Something went wrong while updating the card.');
        }
    }
    async deleteCard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { cardId } = req.params;
            const card = await this.cardsServices.getCardById(Number(cardId));
            if (!card) {
                this.error(res, 404, 'Card not found.');
                return;
            }

            const folderPath = join(__dirname, '../public/uploads/', `cardId_${cardId}`);
            if (existsSync(folderPath)) {
                rm(folderPath, { recursive: true, force: true }, (err) => {
                    if (err) this.loggerservice.error(err);
                })
            }

            const deleted = await this.cardsServices.deleteCard(Number(cardId));
            if (deleted) {
                this.ok(res, { message: 'Card deleted successfully.' });

                const column = await this.columnsServices.getColumnById(card.columnId);
                if (!column) return;

                const boardId = column.boardId;
                const participants = await this.boardsServices.getParticipants(boardId);
                if (!participants) return;
    
                const clientsIds = getClietntsIds(req.user.id, participants.users);
                const columns = await this.boardsServices.getColumnsByBoardId(boardId);
                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/deleteCard', body: columns });
            } else {
                this.error(res, 404, 'Card not found.');
            }
        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }

    async uploadImages({ files, params, user }: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { cardId } = params;
            const card = await this.cardsServices.getCardById(Number(cardId));
            if (!card) {
                this.error(res, 404, 'Card not found.');
                return;
            }

            const transferredFiles = files?.images;

            if (transferredFiles) {
                let images = transferredFiles as fileUpload.UploadedFile[];
                if (!Array.isArray(transferredFiles)) {
                    images = [transferredFiles];
                }

                const downloads = images.map(image => {
                    return new Promise<IUploadImage | undefined>(rej => {
                        const folderPath = join(__dirname, '../public/uploads/', `cardId_${cardId}`);
                        if (!existsSync(folderPath)) {
                            mkdirSync(folderPath);
                        }
                        const imageId = uuidv4();
                        const uploadPath = join(folderPath, `/${imageId}${image.name}`);

                        image.mv(uploadPath, (err) => {
                            if (err) {
                                rej(undefined);
                            }
                            rej({
                                url: `/uploads/cardId_${cardId}/${imageId}${image.name}`,
                                imageName: image.name
                            });
                        })
                    })
                });

                const downloadsResults = await Promise.all(downloads);

                const sevePathesResults: (CardImageModel | null)[] = [];
                for (const imageData of downloadsResults) {
                    const restul = await this.cardsServices.uploadImage(Number(cardId), imageData);
                    sevePathesResults.push(restul);
                }

                this.ok(res, sevePathesResults);

                const column = await this.columnsServices.getColumnById(card.columnId);
                if (!column) return;

                const boardId = column.boardId;
                const participants = await this.boardsServices.getParticipants(boardId);
                if (!participants) return;
    
                const clientsIds = getClietntsIds(user.id, participants.users);
                const updatedCardcard = await this.cardsServices.getCardById(Number(cardId));
                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/uploadImages', body: updatedCardcard });
            } else {
                this.error(res, 400, 'Bad request or any files not found!');
            }

        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }
    async getCardImages(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { cardId } = req.params;
            const card = await this.cardsServices.getCardById(Number(cardId));
            if (!card) {
                this.error(res, 404, 'Card not found.');
                return;
            }

            const images = await this.cardsServices.getCardImages(Number(cardId));
            this.ok(res, images);
        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }
    async getCardImageById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { imageId } = req.params;
            const image = await this.cardsServices.getCardImageById(Number(imageId));
            if (image) {
                this.ok(res, image);
            } else {
                this.error(res, 404, 'Image not found.');
            }
        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }
    async deleteCardImage(req: Request, res: Response, next: NextFunction): Promise<void> {

        try {
            const { imageId } = req.params;
            const image = await this.cardsServices.getCardImageById(Number(imageId));
            if (!image) {
                this.error(res, 404, 'Image not found.');
                return;
            }
            unlink(join(__dirname, '../public', image.url), (err) => err && this.loggerservice.error(err));

            const deleted = await this.cardsServices.deleteImage(Number(imageId));
            if (deleted) {
                this.ok(res, { message: 'Image deleted successfully.' });

                const card = await this.cardsServices.getCardById(image.cardId);
                if (!card) return;

                const column = await this.columnsServices.getColumnById(card.columnId);
                if (!column) return;

                const boardId = column.boardId;
                const participants = await this.boardsServices.getParticipants(boardId);
                if (!participants) return;
    
                const clientsIds = getClietntsIds(req.user.id, participants.users);
                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/deleteCardImage', body: card });
            } else {
                this.error(res, 404, 'Image not found.');
            }
        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }

    async createCardComment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { cardId } = req.params;
            const card = await this.cardsServices.getCardById(Number(cardId));
            if (!card) {
                this.error(res, 404, 'Card not found.');
                return;
            }

            const comment = await this.cardsServices.createCardComment(req.user.id, Number(cardId), req.body.text);
            this.ok(res, comment);

            const updatedCard = await this.cardsServices.getCardById(Number(cardId));
            if (!updatedCard) return;
            const column = await this.columnsServices.getColumnById(updatedCard.columnId);
            if (!column) return;

            const boardId = column.boardId;
            const participants = await this.boardsServices.getParticipants(boardId);
            if (!participants) return;

            const clientsIds = getClietntsIds(req.user.id, participants.users);

            this.wsSender.sendMessage(clientsIds, { type: 'ws/api/createCardComment', body: updatedCard });
        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }
    async updateCardComment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { commentId } = req.params;
            const comment = await this.cardsServices.getCardCommentById(Number(commentId));
            if (!comment) {
                this.error(res, 404, 'Comment not found.');
                return;
            }
            const updatedComment = await this.cardsServices.updateCardComment(Number(commentId), req.body.text);
            this.ok(res, updatedComment);

            const updatedCard = await this.cardsServices.getCardById(Number(comment.cardId));
            if (!updatedCard) return;
            const column = await this.columnsServices.getColumnById(updatedCard.columnId);
            if (!column) return;

            const boardId = column.boardId;
            const participants = await this.boardsServices.getParticipants(boardId);
            if (!participants) return;

            const clientsIds = getClietntsIds(req.user.id, participants.users);

            this.wsSender.sendMessage(clientsIds, { type: 'ws/api/updateCardComment', body: updatedCard });
        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }
    async deleteCardComment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { commentId } = req.params;

            const comment = await this.cardsServices.getCardCommentById(Number(commentId));
            if (!comment) {
                this.error(res, 404, 'Comment not found.');
                return;
            }

            const deleted = await this.cardsServices.deleteCardComment(Number(commentId));

            if (deleted) {
                this.ok(res, { message: 'Comment deleted successfully.' });

                const updatedCard = await this.cardsServices.getCardById(Number(comment.cardId));
                if (!updatedCard) return;

                const column = await this.columnsServices.getColumnById(updatedCard.columnId);
                if (!column) return;

                const boardId = column.boardId;
                const participants = await this.boardsServices.getParticipants(boardId);
                if (!participants) return;
    
                const clientsIds = getClietntsIds(req.user.id, participants.users);

                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/deleteCardComment', body: updatedCard });
            } else {
                this.error(res, 404, 'Comment not found.');
            }
        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }
    async getCardComments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { cardId } = req.params;
            const comments = await this.cardsServices.getCardComments(Number(cardId));
            if (comments) {
                this.ok(res, comments);
            } else {
                this.error(res, 404, 'Card not found.');
            }
        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }
    async getCardCommentById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { commentId } = req.params;
            const comment = await this.cardsServices.getCardCommentById(Number(commentId));
            if (comment) {
                this.ok(res, comment);
            } else {
                this.error(res, 404, 'Comment not found.');
            }
        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }
    async setCardCommentsReadStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { statusId } = req.params;
            const updatedCommentReadStatus = await this.cardsServices.updateCommentReadStatus(Number(statusId));
            if (updatedCommentReadStatus) {
                this.ok(res, updatedCommentReadStatus);
            } else {
                this.error(res, 404, 'Comment Read Status not found.');
            }
        } catch (error) {
            this.error(res, 500, 'Something was wrong, please try again later!');
        }
    }
}