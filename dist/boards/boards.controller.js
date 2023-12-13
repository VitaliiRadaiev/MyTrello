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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardsController = void 0;
const base_controller_1 = require("../common/base.controller");
const inversify_1 = require("inversify");
const path_1 = require("path");
const fs_1 = require("fs");
const types_1 = require("../types");
const boards_services_1 = require("./boards.services");
const auth_middleware_1 = require("../common/auth.middleware");
const validateProperties_middleware_1 = require("../common/validateProperties.middleware");
const uuid_1 = require("uuid");
const columns_services_1 = require("../columns/columns.services");
const users_services_1 = require("../users/users.services");
const ws_sender_1 = require("../websocket/ws.sender");
const utils_1 = require("../utils/utils");
let BoardsController = class BoardsController extends base_controller_1.BaseController {
    constructor(loggerservice, configService, boardsService, columnsServices, usersServices, wsSender) {
        super(loggerservice);
        this.loggerservice = loggerservice;
        this.configService = configService;
        this.boardsService = boardsService;
        this.columnsServices = columnsServices;
        this.usersServices = usersServices;
        this.wsSender = wsSender;
        this.bindRoutes([
            { path: '/', method: 'get', func: this.getAllBoards, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/guest', method: 'get', func: this.getAllGuestBoards, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:boardId', method: 'get', func: this.getBoardInfo, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/', method: 'post', func: this.createBoard, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET')), new validateProperties_middleware_1.ValidatePropertiesMiddleware(['name'])] },
            { path: '/:boardId', method: 'put', func: this.updateBoardInfo, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:boardId', method: 'delete', func: this.deleteBoard, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:boardId/columns', method: 'get', func: this.getColumnsByBoardId, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:boardId/participant/:userId', method: 'post', func: this.addParticipantToBoard, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:boardId/participants', method: 'get', func: this.getBoardParticipants, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:boardId/participant/:userId', method: 'delete', func: this.removeParticipantFromBoard, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
        ]);
    }
    createBoard({ body, files, user }, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                new Promise((rej) => {
                    if (files && Object.keys(files).length >= 1) {
                        const photo = files.photo;
                        const photoId = (0, uuid_1.v4)();
                        const uploadPath = (0, path_1.join)(__dirname, '../public/uploads', `boardPhoto_${photoId}${(0, path_1.extname)(photo.name)}`);
                        photo.mv(uploadPath, (err) => __awaiter(this, void 0, void 0, function* () {
                            if (err) {
                                rej(null);
                            }
                            rej(`/uploads/boardPhoto_${photoId}${(0, path_1.extname)(photo.name)}`);
                        }));
                    }
                    else {
                        rej(null);
                    }
                })
                    .then((photoUrl) => __awaiter(this, void 0, void 0, function* () {
                    const board = yield this.boardsService.createBoard(user.id, body.name, photoUrl);
                    this.ok(res, board);
                }));
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    getAllBoards(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const boards = yield this.boardsService.getAllBoards(req.user.id);
                this.ok(res, boards);
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    getAllGuestBoards(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const boards = yield this.boardsService.getAllGuestBoards(req.user.id);
                this.ok(res, boards);
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    getBoardInfo(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const boardId = parseInt(req.params.boardId, 10);
                const board = yield this.boardsService.getBoardInfo(boardId);
                if (board) {
                    this.ok(res, board);
                }
                else {
                    this.error(res, 404, 'Board is not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    updateBoardInfo(_a, res, next) {
        var { body, files, params } = _a, req = __rest(_a, ["body", "files", "params"]);
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const boardId = parseInt(params.boardId, 10);
                const boardData = body;
                if (!(boardData['name'] || (files === null || files === void 0 ? void 0 : files.photo))) {
                    this.error(res, 422, 'The request must have at least one of the following properties: name, photo (file)');
                    return;
                }
                const board = yield this.boardsService.getBoardInfo(boardId);
                if (!board) {
                    this.error(res, 404, 'The board doesn\'t exist!');
                    return;
                }
                boardData.previewImage = yield new Promise((rej) => {
                    if (files && Object.keys(files).length >= 1) {
                        if (board.previewImage)
                            (0, fs_1.unlink)((0, path_1.join)(__dirname, '../public', board.previewImage), (err) => err && this.loggerservice.error(err));
                        const photo = files.photo;
                        const photoId = (0, uuid_1.v4)();
                        const uploadPath = (0, path_1.join)(__dirname, '../public/uploads', `boardPhoto_${photoId}${(0, path_1.extname)(photo.name)}`);
                        photo.mv(uploadPath, (err) => __awaiter(this, void 0, void 0, function* () {
                            if (err) {
                                rej(undefined);
                            }
                            rej(`/uploads/boardPhoto_${photoId}${(0, path_1.extname)(photo.name)}`);
                        }));
                    }
                    else {
                        rej(undefined);
                    }
                });
                const updatedBoard = yield this.boardsService
                    .updateBoardInfo(boardId, { name: boardData.name, previewImage: boardData.previewImage });
                if (updatedBoard) {
                    this.ok(res, updatedBoard);
                    const participants = yield this.boardsService.getParticipants(boardId);
                    if (!participants)
                        return;
                    const clientsIds = (0, utils_1.getClietntsIds)(req.user.id, participants.users);
                    this.wsSender.sendMessage(clientsIds, { type: 'ws/api/updateBoardInfo', body: updatedBoard });
                }
                else {
                    this.error(res, 404, 'Board is not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    deleteBoard(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const boardId = parseInt(req.params.boardId, 10);
                const board = yield this.boardsService.getBoardInfo(boardId);
                if (!board) {
                    this.error(res, 404, 'The board doesn\'t exist!');
                    return;
                }
                if (board.previewImage)
                    (0, fs_1.unlink)((0, path_1.join)(__dirname, '../public', board.previewImage), (err) => err && this.loggerservice.error(err));
                if ((_a = board.columns) === null || _a === void 0 ? void 0 : _a.length) {
                    for (const column of board.columns) {
                        const cards = yield this.columnsServices.getCardsByColumnId(column.id);
                        for (const card of cards) {
                            const folderPath = (0, path_1.join)(__dirname, '../public/uploads/', `cardId_${card.cardId}`);
                            if ((0, fs_1.existsSync)(folderPath)) {
                                (0, fs_1.rm)(folderPath, { recursive: true, force: true }, (err) => {
                                    if (err)
                                        this.loggerservice.error(err);
                                });
                            }
                        }
                    }
                }
                const participants = yield this.boardsService.getParticipants(boardId);
                const success = yield this.boardsService.deleteBoard(boardId);
                if (success) {
                    this.ok(res, { message: 'Board deleted successfully.' });
                    if (!participants)
                        return;
                    const clientsIds = (0, utils_1.getClietntsIds)(req.user.id, participants.users);
                    this.wsSender.sendMessage(clientsIds, { type: 'ws/api/deleteBoard', body: { boardId, message: `Board by id-${boardId} had deleted` } });
                }
                else {
                    this.error(res, 404, 'Board is not found.');
                }
            }
            catch (error) {
                console.log(error);
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    getColumnsByBoardId(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const boardId = parseInt(req.params.boardId, 10);
                const board = yield this.boardsService.getBoardInfo(boardId);
                if (!board) {
                    this.error(res, 404, 'Board is not found.');
                    return;
                }
                const columns = yield this.boardsService.getColumnsByBoardId(boardId);
                this.ok(res, columns);
            }
            catch (error) {
                this.error(res, 500, 'Something went wrong, please try again later.');
            }
        });
    }
    addParticipantToBoard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const boardId = parseInt(req.params.boardId, 10);
                const board = yield this.boardsService.getBoardInfo(boardId);
                if (!board) {
                    this.error(res, 404, 'Board is not found.');
                    return;
                }
                const userId = parseInt(req.params.userId, 10);
                const user = yield this.usersServices.getUserInfo(userId);
                if (!user) {
                    this.error(res, 404, 'User is not found.');
                    return;
                }
                if (!board.participants) {
                    this.error(res, 500, 'Something went wrong, please try again later.');
                    return;
                }
                const result = yield this.boardsService.addParticipant(board.participants.id, userId);
                this.ok(res, result);
                const participants = yield this.boardsService.getParticipants(boardId);
                const updatedBoard = yield this.boardsService.getBoardInfo(boardId);
                if (!participants || !updatedBoard)
                    return;
                const clientsIds = (0, utils_1.getClietntsIds)(req.user.id, participants.users);
                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/addParticipantToBoard', body: updatedBoard });
            }
            catch (error) {
                this.error(res, 500, 'Something went wrong, please try again later.');
            }
        });
    }
    getBoardParticipants(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const boardId = parseInt(req.params.boardId, 10);
                const board = yield this.boardsService.getBoardInfo(boardId);
                if (!board) {
                    this.error(res, 404, 'Board is not found.');
                    return;
                }
                const participants = yield this.boardsService.getParticipants(boardId);
                if (participants) {
                    this.ok(res, participants);
                }
                else {
                    this.error(res, 404, 'Participants are not found');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something went wrong, please try again later.');
            }
        });
    }
    removeParticipantFromBoard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const boardId = parseInt(req.params.boardId, 10);
                const board = yield this.boardsService.getBoardInfo(boardId);
                if (!board) {
                    this.error(res, 404, 'Board is not found.');
                    return;
                }
                const userId = parseInt(req.params.userId, 10);
                const user = yield this.usersServices.getUserInfo(userId);
                if (!user) {
                    this.error(res, 404, 'User is not found.');
                    return;
                }
                if (board.createdBy.id === userId) {
                    this.error(res, 400, 'Can\'t remove board owner');
                    return;
                }
                if (!board.participants) {
                    this.error(res, 500, 'Something went wrong, please try again later.');
                    return;
                }
                const participants = yield this.boardsService.getParticipants(boardId);
                const result = yield this.boardsService.removeParticipant(board.participants.id, userId);
                this.ok(res, result);
                if (!participants)
                    return;
                const clientsIds = (0, utils_1.getClietntsIds)(req.user.id, participants.users);
                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/removeParticipantFromBoard', body: {
                        removedUserId: userId,
                        participants: result
                    } });
            }
            catch (error) {
                this.error(res, 500, 'Something went wrong, please try again later.');
            }
        });
    }
};
exports.BoardsController = BoardsController;
exports.BoardsController = BoardsController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.ILogger)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.ConfigService)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.BoardsServices)),
    __param(3, (0, inversify_1.inject)(types_1.TYPES.ColumnsServices)),
    __param(4, (0, inversify_1.inject)(types_1.TYPES.UsersServices)),
    __param(5, (0, inversify_1.inject)(types_1.TYPES.WsSender)),
    __metadata("design:paramtypes", [Object, Object, boards_services_1.BoardsServices,
        columns_services_1.ColumnsServices,
        users_services_1.UsersServices,
        ws_sender_1.WsSender])
], BoardsController);
//# sourceMappingURL=boards.controller.js.map