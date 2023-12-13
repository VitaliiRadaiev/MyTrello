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
exports.ColumnsServices = void 0;
const inversify_1 = require("inversify");
const prisma_service_1 = require("../database/prisma.service");
const types_1 = require("../types");
let ColumnsServices = class ColumnsServices {
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    createColumn(columnData) {
        return __awaiter(this, void 0, void 0, function* () {
            const columnsOfBoard = yield this.prismaService.client.columnModel.findMany({
                where: { boardId: columnData.boardId }
            });
            const { name, boardId } = columnData;
            const createdColumn = yield this.prismaService.client.columnModel.create({
                data: {
                    board: { connect: { id: boardId } },
                    name,
                    order: columnsOfBoard.length + 1,
                },
            });
            return Object.assign(Object.assign({}, createdColumn), { cards: [] });
        });
    }
    getColumnById(columnId) {
        return __awaiter(this, void 0, void 0, function* () {
            const column = yield this.prismaService.client.columnModel.findUnique({
                where: { id: columnId },
                include: {
                    cards: {
                        orderBy: { order: 'asc' }
                    }
                }
            });
            return column;
        });
    }
    updateColumn(columnId, columnData) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentColumn = yield this.prismaService.client.columnModel.findUnique({
                where: { id: columnId }
            });
            if (!currentColumn)
                return null;
            if (columnData.order && currentColumn.order !== columnData.order) {
                const boardId = currentColumn.boardId;
                const columns = yield this.prismaService.client.columnModel.findMany({
                    where: { boardId },
                    orderBy: { order: 'asc' },
                });
                const columnsWithoutCurrentColumn = columns.filter(column => column.id !== columnId);
                const columnsWithRightOrder = columnsWithoutCurrentColumn.slice();
                columnsWithRightOrder.splice(columnData.order - 1, 0, currentColumn);
                yield this.setColumnsOrder(columnsWithRightOrder);
            }
            const data = {};
            if (columnData.name) {
                data.name = columnData.name;
            }
            const updatedColumn = yield this.prismaService.client.columnModel.update({
                where: { id: columnId },
                data
            });
            return this.prismaService.client.columnModel.findUnique({
                where: {
                    id: columnId
                },
                include: {
                    cards: {
                        orderBy: { order: 'asc' }
                    }
                }
            });
        });
    }
    deleteColumn(columnId) {
        return __awaiter(this, void 0, void 0, function* () {
            const deletedColumn = yield this.prismaService.client.columnModel.delete({
                where: { id: columnId },
            });
            if (deletedColumn) {
                const boardId = deletedColumn.boardId;
                const columns = yield this.prismaService.client.columnModel.findMany({
                    where: { boardId },
                    orderBy: { order: 'asc' },
                });
                yield this.setColumnsOrder(columns);
            }
            return !!deletedColumn;
        });
    }
    getCardsByColumnId(columnId) {
        return __awaiter(this, void 0, void 0, function* () {
            const column = yield this.prismaService.client.columnModel.findUnique({
                where: { id: columnId },
                include: {
                    cards: {
                        orderBy: { order: 'asc' },
                        include: {
                            images: true,
                            comments: true
                        }
                    }
                }
            });
            if (column) {
                const cards = column.cards;
                const mappedCards = cards.map(card => {
                    return Object.assign(Object.assign({}, card), { comments: {
                            items: card.comments,
                            totalCount: card.comments.length
                        } });
                });
                return mappedCards;
            }
            else {
                return [];
            }
        });
    }
    setColumnsOrder(columns) {
        return __awaiter(this, void 0, void 0, function* () {
            let countOrder = 1;
            for (const column of columns) {
                yield this.prismaService.client.columnModel.update({
                    where: {
                        id: column.id
                    },
                    data: {
                        order: countOrder++
                    }
                });
            }
        });
    }
};
exports.ColumnsServices = ColumnsServices;
exports.ColumnsServices = ColumnsServices = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ColumnsServices);
//# sourceMappingURL=columns.services.js.map