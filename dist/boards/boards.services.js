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
exports.BoardsServices = void 0;
const inversify_1 = require("inversify");
require("reflect-metadata");
const types_1 = require("../types");
const prisma_service_1 = require("../database/prisma.service");
let BoardsServices = class BoardsServices {
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    createBoard(userId, name, photoUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const board = yield this.prismaService.client.boardModel.create({
                data: {
                    name,
                    createdBy: {
                        connect: {
                            id: userId
                        }
                    },
                    previewImage: photoUrl,
                    participants: {
                        create: {
                            users: {
                                connect: { id: userId },
                            }
                        }
                    }
                }
            });
            return board;
        });
    }
    getAllBoards(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const boards = yield this.prismaService.client.boardModel.findMany({
                where: {
                    createdById: userId
                },
                include: {
                    participants: {
                        include: {
                            users: {
                                select: {
                                    id: true,
                                    email: true,
                                    login: true,
                                    profilePhoto: true
                                }
                            }
                        }
                    }
                }
            });
            return boards;
        });
    }
    getAllGuestBoards(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.prismaService.client.userModel.findUnique({
                where: {
                    id: userId
                },
                include: {
                    participantOfBoards: true
                }
            });
            const boards = [];
            if (user && user.participantOfBoards.length) {
                for (const participant of user.participantOfBoards) {
                    const board = yield this.prismaService.client.boardModel.findUnique({
                        where: { id: participant.boardId },
                        include: {
                            participants: {
                                include: {
                                    users: {
                                        select: {
                                            id: true,
                                            email: true,
                                            login: true,
                                            profilePhoto: true
                                        }
                                    }
                                }
                            }
                        }
                    });
                    if (board) {
                        boards.push(board);
                    }
                }
            }
            return boards.filter(board => board.createdById !== (user === null || user === void 0 ? void 0 : user.id));
        });
    }
    getBoardInfo(boardId) {
        return __awaiter(this, void 0, void 0, function* () {
            const foundBoard = yield this.prismaService.client.boardModel.findUnique({
                where: {
                    id: boardId,
                },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            email: true,
                            login: true,
                            profilePhoto: true
                        }
                    },
                    participants: {
                        include: {
                            users: {
                                select: {
                                    id: true,
                                    email: true,
                                    login: true,
                                    profilePhoto: true
                                }
                            }
                        }
                    }
                }
            });
            if (foundBoard) {
                const board = {
                    id: foundBoard.id,
                    name: foundBoard.name,
                    createdBy: foundBoard.createdBy,
                    createdById: foundBoard.createdById,
                    previewImage: foundBoard.previewImage,
                    participants: foundBoard.participants,
                };
                return board;
            }
            else {
                return null;
            }
        });
    }
    updateBoardInfo(boardId, boardData) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedBoard = yield this.prismaService.client.boardModel.update({
                where: { id: boardId },
                data: boardData,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            email: true,
                            login: true,
                            profilePhoto: true
                        }
                    },
                    participants: {
                        include: {
                            users: true
                        }
                    }
                }
            });
            if (updatedBoard) {
                const board = {
                    id: updatedBoard.id,
                    name: updatedBoard.name,
                    createdBy: updatedBoard.createdBy,
                    createdById: updatedBoard.createdById,
                    previewImage: updatedBoard.previewImage,
                    participants: updatedBoard.participants,
                };
                return board;
            }
            else {
                return null;
            }
        });
    }
    deleteBoard(boardId) {
        return __awaiter(this, void 0, void 0, function* () {
            const deletedBoard = yield this.prismaService.client.boardModel.delete({
                where: {
                    id: boardId,
                }
            });
            return !!deletedBoard;
        });
    }
    getColumnsByBoardId(boardId) {
        return __awaiter(this, void 0, void 0, function* () {
            const board = yield this.prismaService.client.boardModel.findUnique({
                where: { id: boardId },
                include: {
                    columns: {
                        orderBy: { order: 'asc' },
                        include: {
                            cards: {
                                orderBy: { order: 'asc' },
                                include: {
                                    images: true,
                                    comments: {
                                        include: {
                                            readStatuses: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                }
            });
            if (board) {
                return board.columns;
            }
            else {
                return [];
            }
        });
    }
    addParticipant(participantId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prismaService.client.participantsModel.update({
                where: { id: participantId },
                data: {
                    users: {
                        connect: { id: userId }
                    }
                },
                include: {
                    users: {
                        select: {
                            id: true,
                            email: true,
                            login: true,
                            profilePhoto: true
                        }
                    }
                }
            });
        });
    }
    removeParticipant(participantId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prismaService.client.participantsModel.update({
                where: { id: participantId },
                data: {
                    users: {
                        disconnect: { id: userId }
                    }
                },
                include: {
                    users: {
                        select: {
                            id: true,
                            email: true,
                            login: true,
                            profilePhoto: true
                        }
                    }
                }
            });
        });
    }
    getParticipants(boardId) {
        return __awaiter(this, void 0, void 0, function* () {
            const participants = yield this.prismaService.client.participantsModel.findFirst({
                where: { boardId },
                include: {
                    users: {
                        select: {
                            id: true,
                            email: true,
                            login: true,
                            profilePhoto: true
                        }
                    }
                }
            });
            if (participants) {
                return {
                    id: participants.id,
                    boardId: participants.boardId,
                    users: participants.users
                };
            }
            else {
                return null;
            }
        });
    }
};
exports.BoardsServices = BoardsServices;
exports.BoardsServices = BoardsServices = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BoardsServices);
//# sourceMappingURL=boards.services.js.map