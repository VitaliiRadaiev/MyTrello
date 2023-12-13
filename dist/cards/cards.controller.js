"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardsController = void 0;
const base_controller_1 = require("../common/base.controller");
const inversify_1 = require("inversify");
const path_1 = require("path");
const uuid_1 = require("uuid");
const fs_1 = require("fs");
const types_1 = require("../types");
const auth_middleware_1 = require("../common/auth.middleware");
const validateProperties_middleware_1 = require("../common/validateProperties.middleware");
const cards_services_1 = require("./cards.services");
const columns_services_1 = require("../columns/columns.services");
const ws_sender_1 = require("../websocket/ws.sender");
const boards_services_1 = require("../boards/boards.services");
const utils_1 = require("../utils/utils");
let CardsController = class CardsController extends base_controller_1.BaseController {
    constructor(loggerservice, configService, cardsServices, columnsServices, boardsServices, wsSender) {
        super(loggerservice);
        this.loggerservice = loggerservice;
        this.configService = configService;
        this.cardsServices = cardsServices;
        this.columnsServices = columnsServices;
        this.boardsServices = boardsServices;
        this.wsSender = wsSender;
        this.bindRoutes([
            { path: '/', method: 'post', func: this.createCard, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET')), new validateProperties_middleware_1.ValidatePropertiesMiddleware(['columnId', 'title'])] },
            { path: '/:cardId', method: 'get', func: this.getCardById, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:cardId', method: 'put', func: this.updateCard, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET')), new validateProperties_middleware_1.ValidatePropertiesMiddleware(['title', 'description', 'order'], true)] },
            { path: '/:cardId/column', method: 'put', func: this.setNewColumn, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET')), new validateProperties_middleware_1.ValidatePropertiesMiddleware(['columnId', 'order'])] },
            { path: '/:cardId', method: 'delete', func: this.deleteCard, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:cardId/images', method: 'post', func: this.uploadImages, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:cardId/images', method: 'get', func: this.getCardImages, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/image/:imageId', method: 'get', func: this.getCardImageById, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/image/:imageId', method: 'delete', func: this.deleteCardImage, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:cardId/comment', method: 'post', func: this.createCardComment, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET')), new validateProperties_middleware_1.ValidatePropertiesMiddleware(['text'])] },
            { path: '/:cardId/comments', method: 'get', func: this.getCardComments, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/comment/:commentId', method: 'put', func: this.updateCardComment, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET')), new validateProperties_middleware_1.ValidatePropertiesMiddleware(['text'])] },
            { path: '/comment/:commentId', method: 'delete', func: this.deleteCardComment, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/comment/:commentId', method: 'get', func: this.getCardCommentById, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/comment/status/:statusId', method: 'put', func: this.setCardCommentsReadStatus, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
        ]);
    }
    createCard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { columnId, title } = req.body;
                const column = yield this.columnsServices.getColumnById(Number(columnId));
                if (!column) {
                    this.error(res, 404, 'Column not found.');
                    return;
                }
                const card = yield this.cardsServices.createCard(Number(columnId), title);
                this.ok(res, card);
                const boardId = column.boardId;
                const participants = yield this.boardsServices.getParticipants(boardId);
                if (!participants)
                    return;
                const clientsIds = (0, utils_1.getClietntsIds)(req.user.id, participants.users);
                const columns = yield this.boardsServices.getColumnsByBoardId(boardId);
                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/createCard', body: columns });
            }
            catch (error) {
                this.error(res, 500, 'Something went wrong while creating the card.');
            }
        });
    }
    getCardById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { cardId } = req.params;
            try {
                const card = yield this.cardsServices.getCardById(Number(cardId));
                if (card) {
                    this.ok(res, card);
                }
                else {
                    this.error(res, 404, 'Card not found.');
                }
            }
            catch (error) {
                console.log(error);
                this.error(res, 500, 'Something went wrong while fetching the card.');
            }
        });
    }
    updateCard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { cardId } = req.params;
                const updatedCard = yield this.cardsServices.updateCard(Number(cardId), req.body);
                if (updatedCard) {
                    this.ok(res, updatedCard);
                    const column = yield this.columnsServices.getColumnById(updatedCard.columnId);
                    if (!column)
                        return;
                    const boardId = column.boardId;
                    const participants = yield this.boardsServices.getParticipants(boardId);
                    if (!participants)
                        return;
                    const clientsIds = (0, utils_1.getClietntsIds)(req.user.id, participants.users);
                    const columns = yield this.boardsServices.getColumnsByBoardId(boardId);
                    this.wsSender.sendMessage(clientsIds, { type: 'ws/api/updateCard', body: columns });
                }
                else {
                    this.error(res, 404, 'Card not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something went wrong while updating the card.');
            }
        });
    }
    setNewColumn(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { cardId } = req.params;
                const card = yield this.cardsServices.getCardById(Number(cardId));
                if (!card) {
                    this.error(res, 404, 'Card not found.');
                    return;
                }
                const columnId = req.body.columnId;
                const column = yield this.columnsServices.getColumnById(Number(columnId));
                if (!column) {
                    this.error(res, 404, 'Column not found.');
                    return;
                }
                const updatedCard = yield this.cardsServices.setNewColumn(Number(cardId), Number(columnId), req.body.order);
                this.ok(res, updatedCard);
                const boardId = column.boardId;
                const participants = yield this.boardsServices.getParticipants(boardId);
                if (!participants)
                    return;
                const clientsIds = (0, utils_1.getClietntsIds)(req.user.id, participants.users);
                const columns = yield this.boardsServices.getColumnsByBoardId(boardId);
                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/setNewColumn', body: columns });
            }
            catch (error) {
                console.log(error);
                this.error(res, 500, 'Something went wrong while updating the card.');
            }
        });
    }
    deleteCard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { cardId } = req.params;
                const card = yield this.cardsServices.getCardById(Number(cardId));
                if (!card) {
                    this.error(res, 404, 'Card not found.');
                    return;
                }
                const folderPath = (0, path_1.join)(__dirname, '../public/uploads/', `cardId_${cardId}`);
                if ((0, fs_1.existsSync)(folderPath)) {
                    (0, fs_1.rm)(folderPath, { recursive: true, force: true }, (err) => {
                        if (err)
                            this.loggerservice.error(err);
                    });
                }
                const deleted = yield this.cardsServices.deleteCard(Number(cardId));
                if (deleted) {
                    this.ok(res, { message: 'Card deleted successfully.' });
                    const column = yield this.columnsServices.getColumnById(card.columnId);
                    if (!column)
                        return;
                    const boardId = column.boardId;
                    const participants = yield this.boardsServices.getParticipants(boardId);
                    if (!participants)
                        return;
                    const clientsIds = (0, utils_1.getClietntsIds)(req.user.id, participants.users);
                    const columns = yield this.boardsServices.getColumnsByBoardId(boardId);
                    this.wsSender.sendMessage(clientsIds, { type: 'ws/api/deleteCard', body: columns });
                }
                else {
                    this.error(res, 404, 'Card not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    uploadImages({ files, params, user }, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { cardId } = params;
                const card = yield this.cardsServices.getCardById(Number(cardId));
                if (!card) {
                    this.error(res, 404, 'Card not found.');
                    return;
                }
                const transferredFiles = files === null || files === void 0 ? void 0 : files.images;
                if (transferredFiles) {
                    let images = transferredFiles;
                    if (!Array.isArray(transferredFiles)) {
                        images = [transferredFiles];
                    }
                    const downloads = images.map(image => {
                        return new Promise(rej => {
                            const folderPath = (0, path_1.join)(__dirname, '../public/uploads/', `cardId_${cardId}`);
                            if (!(0, fs_1.existsSync)(folderPath)) {
                                (0, fs_1.mkdirSync)(folderPath);
                            }
                            const imageId = (0, uuid_1.v4)();
                            const uploadPath = (0, path_1.join)(folderPath, `/${imageId}${image.name}`);
                            image.mv(uploadPath, (err) => {
                                if (err) {
                                    rej(undefined);
                                }
                                rej({
                                    url: `/uploads/cardId_${cardId}/${imageId}${image.name}`,
                                    imageName: image.name
                                });
                            });
                        });
                    });
                    const downloadsResults = yield Promise.all(downloads);
                    const sevePathesResults = [];
                    for (const imageData of downloadsResults) {
                        const restul = yield this.cardsServices.uploadImage(Number(cardId), imageData);
                        sevePathesResults.push(restul);
                    }
                    this.ok(res, sevePathesResults);
                    const column = yield this.columnsServices.getColumnById(card.columnId);
                    if (!column)
                        return;
                    const boardId = column.boardId;
                    const participants = yield this.boardsServices.getParticipants(boardId);
                    if (!participants)
                        return;
                    const clientsIds = (0, utils_1.getClietntsIds)(user.id, participants.users);
                    const updatedCardcard = yield this.cardsServices.getCardById(Number(cardId));
                    this.wsSender.sendMessage(clientsIds, { type: 'ws/api/uploadImages', body: updatedCardcard });
                }
                else {
                    this.error(res, 400, 'Bad request or any files not found!');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    getCardImages(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { cardId } = req.params;
                const card = yield this.cardsServices.getCardById(Number(cardId));
                if (!card) {
                    this.error(res, 404, 'Card not found.');
                    return;
                }
                const images = yield this.cardsServices.getCardImages(Number(cardId));
                this.ok(res, images);
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    getCardImageById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { imageId } = req.params;
                const image = yield this.cardsServices.getCardImageById(Number(imageId));
                if (image) {
                    this.ok(res, image);
                }
                else {
                    this.error(res, 404, 'Image not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    deleteCardImage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { imageId } = req.params;
                const image = yield this.cardsServices.getCardImageById(Number(imageId));
                if (!image) {
                    this.error(res, 404, 'Image not found.');
                    return;
                }
                (0, fs_1.unlink)((0, path_1.join)(__dirname, '../public', image.url), (err) => err && this.loggerservice.error(err));
                const deleted = yield this.cardsServices.deleteImage(Number(imageId));
                if (deleted) {
                    this.ok(res, { message: 'Image deleted successfully.' });
                    const card = yield this.cardsServices.getCardById(image.cardId);
                    if (!card)
                        return;
                    const column = yield this.columnsServices.getColumnById(card.columnId);
                    if (!column)
                        return;
                    const boardId = column.boardId;
                    const participants = yield this.boardsServices.getParticipants(boardId);
                    if (!participants)
                        return;
                    const clientsIds = (0, utils_1.getClietntsIds)(req.user.id, participants.users);
                    this.wsSender.sendMessage(clientsIds, { type: 'ws/api/deleteCardImage', body: card });
                }
                else {
                    this.error(res, 404, 'Image not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    createCardComment(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { cardId } = req.params;
                const card = yield this.cardsServices.getCardById(Number(cardId));
                if (!card) {
                    this.error(res, 404, 'Card not found.');
                    return;
                }
                const comment = yield this.cardsServices.createCardComment(req.user.id, Number(cardId), req.body.text);
                this.ok(res, comment);
                const updatedCard = yield this.cardsServices.getCardById(Number(cardId));
                if (!updatedCard)
                    return;
                const column = yield this.columnsServices.getColumnById(updatedCard.columnId);
                if (!column)
                    return;
                const boardId = column.boardId;
                const participants = yield this.boardsServices.getParticipants(boardId);
                if (!participants)
                    return;
                const clientsIds = (0, utils_1.getClietntsIds)(req.user.id, participants.users);
                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/createCardComment', body: updatedCard });
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    updateCardComment(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { commentId } = req.params;
                const comment = yield this.cardsServices.getCardCommentById(Number(commentId));
                if (!comment) {
                    this.error(res, 404, 'Comment not found.');
                    return;
                }
                const updatedComment = yield this.cardsServices.updateCardComment(Number(commentId), req.body.text);
                this.ok(res, updatedComment);
                const updatedCard = yield this.cardsServices.getCardById(Number(comment.cardId));
                if (!updatedCard)
                    return;
                const column = yield this.columnsServices.getColumnById(updatedCard.columnId);
                if (!column)
                    return;
                const boardId = column.boardId;
                const participants = yield this.boardsServices.getParticipants(boardId);
                if (!participants)
                    return;
                const clientsIds = (0, utils_1.getClietntsIds)(req.user.id, participants.users);
                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/updateCardComment', body: updatedCard });
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    deleteCardComment(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { commentId } = req.params;
                const comment = yield this.cardsServices.getCardCommentById(Number(commentId));
                if (!comment) {
                    this.error(res, 404, 'Comment not found.');
                    return;
                }
                const deleted = yield this.cardsServices.deleteCardComment(Number(commentId));
                if (deleted) {
                    this.ok(res, { message: 'Comment deleted successfully.' });
                    const updatedCard = yield this.cardsServices.getCardById(Number(comment.cardId));
                    if (!updatedCard)
                        return;
                    const column = yield this.columnsServices.getColumnById(updatedCard.columnId);
                    if (!column)
                        return;
                    const boardId = column.boardId;
                    const participants = yield this.boardsServices.getParticipants(boardId);
                    if (!participants)
                        return;
                    const clientsIds = (0, utils_1.getClietntsIds)(req.user.id, participants.users);
                    this.wsSender.sendMessage(clientsIds, { type: 'ws/api/deleteCardComment', body: updatedCard });
                }
                else {
                    this.error(res, 404, 'Comment not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    getCardComments(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { cardId } = req.params;
                const comments = yield this.cardsServices.getCardComments(Number(cardId));
                if (comments) {
                    this.ok(res, comments);
                }
                else {
                    this.error(res, 404, 'Card not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    getCardCommentById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { commentId } = req.params;
                const comment = yield this.cardsServices.getCardCommentById(Number(commentId));
                if (comment) {
                    this.ok(res, comment);
                }
                else {
                    this.error(res, 404, 'Comment not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    setCardCommentsReadStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { statusId } = req.params;
                const updatedCommentReadStatus = yield this.cardsServices.updateCommentReadStatus(Number(statusId));
                if (updatedCommentReadStatus) {
                    this.ok(res, updatedCommentReadStatus);
                }
                else {
                    this.error(res, 404, 'Comment Read Status not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
};
exports.CardsController = CardsController;
exports.CardsController = CardsController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.ILogger)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.ConfigService)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.CardsServices)),
    __param(3, (0, inversify_1.inject)(types_1.TYPES.ColumnsServices)),
    __param(4, (0, inversify_1.inject)(types_1.TYPES.BoardsServices)),
    __param(5, (0, inversify_1.inject)(types_1.TYPES.WsSender)),
    __metadata("design:paramtypes", [Object, Object, cards_services_1.CardsServices,
        columns_services_1.ColumnsServices,
        boards_services_1.BoardsServices,
        ws_sender_1.WsSender])
], CardsController);
//# sourceMappingURL=cards.controller.js.map