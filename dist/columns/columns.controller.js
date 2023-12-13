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
exports.ColumnsController = void 0;
const base_controller_1 = require("../common/base.controller");
const inversify_1 = require("inversify");
const path_1 = require("path");
const fs_1 = require("fs");
const types_1 = require("../types");
const columns_services_1 = require("./columns.services");
const auth_middleware_1 = require("../common/auth.middleware");
const boards_services_1 = require("../boards/boards.services");
const validateProperties_middleware_1 = require("../common/validateProperties.middleware");
const ws_sender_1 = require("../websocket/ws.sender");
const utils_1 = require("../utils/utils");
let ColumnsController = class ColumnsController extends base_controller_1.BaseController {
    constructor(loggerservice, configService, columnsServices, boardsServices, wsSender) {
        super(loggerservice);
        this.loggerservice = loggerservice;
        this.configService = configService;
        this.columnsServices = columnsServices;
        this.boardsServices = boardsServices;
        this.wsSender = wsSender;
        this.bindRoutes([
            { path: '/', method: 'post', func: this.createColumn, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET')), new validateProperties_middleware_1.ValidatePropertiesMiddleware(['boardId', 'name'])] },
            { path: '/:columnId', method: 'get', func: this.getColumnById, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:columnId', method: 'put', func: this.updateColumn, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET')), new validateProperties_middleware_1.ValidatePropertiesMiddleware(['name', 'order'], true)] },
            { path: '/:columnId', method: 'delete', func: this.deleteColumn, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:columnId/cards', method: 'get', func: this.getCardsByColumnId, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
        ]);
    }
    createColumn({ body, user }, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const boardId = body.boardId;
                const board = yield this.boardsServices.getBoardInfo(Number(boardId));
                if (!board) {
                    this.error(res, 404, 'Board is not found.');
                    return;
                }
                const column = yield this.columnsServices.createColumn(body);
                this.ok(res, column);
                const participants = yield this.boardsServices.getParticipants(boardId);
                if (!participants)
                    return;
                const clientsIds = (0, utils_1.getClietntsIds)(user.id, participants.users);
                const columns = yield this.boardsServices.getColumnsByBoardId(boardId);
                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/createColumn', body: columns });
            }
            catch (error) {
                this.loggerservice.error(error);
                this.error(res, 500, 'Something went wrong, please try again later.');
            }
        });
    }
    getColumnById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const columnId = parseInt(req.params.columnId, 10);
                const column = yield this.columnsServices.getColumnById(columnId);
                if (column) {
                    this.ok(res, column);
                }
                else {
                    this.error(res, 404, 'Column not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something went wrong, please try again later.');
            }
        });
    }
    updateColumn(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const columnId = parseInt(req.params.columnId, 10);
                const updatedColumn = yield this.columnsServices.updateColumn(columnId, req.body);
                if (updatedColumn) {
                    this.ok(res, updatedColumn);
                    const boardId = updatedColumn.boardId;
                    const participants = yield this.boardsServices.getParticipants(boardId);
                    if (!participants)
                        return;
                    const clientsIds = (0, utils_1.getClietntsIds)(req.user.id, participants.users);
                    const columns = yield this.boardsServices.getColumnsByBoardId(boardId);
                    this.wsSender.sendMessage(clientsIds, { type: 'ws/api/updateColumn', body: columns });
                }
                else {
                    this.error(res, 404, 'Column not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something went wrong, please try again later.');
            }
        });
    }
    deleteColumn(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const columnId = parseInt(req.params.columnId, 10);
                const column = yield this.columnsServices.getColumnById(columnId);
                if (!column) {
                    this.error(res, 404, 'Column not found.');
                    return;
                }
                const cards = yield this.columnsServices.getCardsByColumnId(columnId);
                for (const card of cards) {
                    const folderPath = (0, path_1.join)(__dirname, '../public/uploads/', `cardId_${card.cardId}`);
                    if ((0, fs_1.existsSync)(folderPath)) {
                        (0, fs_1.rm)(folderPath, { recursive: true, force: true }, (err) => {
                            if (err)
                                this.loggerservice.error(err);
                        });
                    }
                }
                yield this.columnsServices.deleteColumn(columnId);
                this.ok(res, { message: 'Column deleted successfully.' });
                const boardId = column.boardId;
                const participants = yield this.boardsServices.getParticipants(boardId);
                if (!participants)
                    return;
                const clientsIds = (0, utils_1.getClietntsIds)(req.user.id, participants.users);
                const columns = yield this.boardsServices.getColumnsByBoardId(boardId);
                this.wsSender.sendMessage(clientsIds, { type: 'ws/api/deleteColumn', body: columns });
            }
            catch (error) {
                this.error(res, 500, 'Something went wrong, please try again later.');
            }
        });
    }
    getCardsByColumnId(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const columnId = parseInt(req.params.columnId, 10);
                const column = yield this.columnsServices.getColumnById(columnId);
                if (!column) {
                    this.error(res, 404, 'Column is not found.');
                    return;
                }
                const cards = yield this.columnsServices.getCardsByColumnId(columnId);
                this.ok(res, cards);
            }
            catch (error) {
                console.log(error);
                this.error(res, 500, 'Something went wrong while fetching cards.');
            }
        });
    }
};
exports.ColumnsController = ColumnsController;
exports.ColumnsController = ColumnsController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.ILogger)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.ConfigService)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.ColumnsServices)),
    __param(3, (0, inversify_1.inject)(types_1.TYPES.BoardsServices)),
    __param(4, (0, inversify_1.inject)(types_1.TYPES.WsSender)),
    __metadata("design:paramtypes", [Object, Object, columns_services_1.ColumnsServices,
        boards_services_1.BoardsServices,
        ws_sender_1.WsSender])
], ColumnsController);
//# sourceMappingURL=columns.controller.js.map