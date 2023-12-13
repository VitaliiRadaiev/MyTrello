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
exports.CardsServices = void 0;
const inversify_1 = require("inversify");
const prisma_service_1 = require("../database/prisma.service");
const types_1 = require("../types");
let CardsServices = class CardsServices {
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    createCard(columnId, title) {
        return __awaiter(this, void 0, void 0, function* () {
            const cardsOfColumn = yield this.prismaService.client.cardModel.findMany({
                where: { columnId }
            });
            const createdCard = yield this.prismaService.client.cardModel.create({
                data: {
                    column: { connect: { id: columnId } },
                    title,
                    order: cardsOfColumn.length + 1,
                },
            });
            return yield this.getCardById(createdCard.cardId);
        });
    }
    getCardById(cardId) {
        return __awaiter(this, void 0, void 0, function* () {
            const card = yield this.prismaService.client.cardModel.findUnique({
                where: { cardId },
                include: {
                    images: true,
                    comments: {
                        include: {
                            readStatuses: true,
                            user: {
                                select: {
                                    id: true,
                                    login: true,
                                    profilePhoto: true,
                                    email: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'asc' },
                    }
                }
            });
            if (card) {
                return Object.assign(Object.assign({}, card), { comments: card.comments.reverse() });
            }
            else {
                return null;
            }
        });
    }
    updateCard(cardId, cardData) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentCard = yield this.prismaService.client.cardModel.findUnique({
                where: { cardId }
            });
            if (!currentCard)
                return null;
            if (cardData.order && currentCard.order !== cardData.order) {
                const columnId = currentCard.columnId;
                const cards = yield this.prismaService.client.cardModel.findMany({
                    where: { columnId },
                    orderBy: { order: 'asc' }
                });
                const cardsWithoutCurrentCard = cards.filter(card => card.cardId !== cardId);
                const cardsWithRightOrder = cardsWithoutCurrentCard.slice();
                cardsWithoutCurrentCard.splice(cardData.order - 1, 0, currentCard);
                yield this.setCardsOrder(cardsWithoutCurrentCard);
            }
            const { order } = cardData, data = __rest(cardData, ["order"]);
            const updatedCard = yield this.prismaService.client.cardModel.update({
                where: { cardId },
                data,
            });
            return updatedCard;
        });
    }
    setNewColumn(cardId, columnId, order) {
        return __awaiter(this, void 0, void 0, function* () {
            const updateCard = yield this.prismaService.client.cardModel.update({
                where: { cardId },
                data: {
                    columnId,
                    order
                }
            });
            const cards = yield this.prismaService.client.cardModel.findMany({
                where: { columnId },
                orderBy: { order: 'asc' }
            });
            const cardsWithoutCurrentCard = cards.filter(card => card.cardId !== cardId);
            let calculatedOrder = order;
            if (cardsWithoutCurrentCard.length === 0)
                calculatedOrder = 1;
            if (order > cardsWithoutCurrentCard.length)
                calculatedOrder = cardsWithoutCurrentCard.length + 1;
            const cardsWithRightOrder = cardsWithoutCurrentCard.slice();
            cardsWithRightOrder.splice(calculatedOrder - 1, 0, updateCard);
            yield this.setCardsOrder(cardsWithRightOrder);
            return updateCard;
        });
    }
    deleteCard(cardId) {
        return __awaiter(this, void 0, void 0, function* () {
            const deletedCard = yield this.prismaService.client.cardModel.delete({
                where: { cardId },
            });
            if (deletedCard) {
                const columnId = deletedCard.columnId;
                const cards = yield this.prismaService.client.cardModel.findMany({
                    where: { columnId },
                    orderBy: { order: 'asc' }
                });
                yield this.setCardsOrder(cards);
            }
            return !!deletedCard;
        });
    }
    uploadImage(cardId, imgData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!imgData)
                return null;
            return this.prismaService.client.cardImageModel.create({
                data: {
                    card: { connect: { cardId } },
                    url: imgData.url,
                    imageName: imgData.imageName
                }
            });
        });
    }
    getCardImages(cardId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prismaService.client.cardImageModel.findMany({
                where: { cardId }
            });
        });
    }
    getCardImageById(imageId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prismaService.client.cardImageModel.findUnique({
                where: { id: imageId }
            });
        });
    }
    deleteImage(imageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const deletedImage = yield this.prismaService.client.cardImageModel.delete({
                where: { id: imageId }
            });
            return !!deletedImage;
        });
    }
    setCardsOrder(cards) {
        return __awaiter(this, void 0, void 0, function* () {
            let countOrder = 1;
            for (const card of cards) {
                yield this.prismaService.client.cardModel.update({
                    where: {
                        cardId: card.cardId
                    },
                    data: {
                        order: countOrder++
                    }
                });
            }
        });
    }
    createCardComment(userId, cardId, text) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const card = yield this.prismaService.client.cardModel.findUnique({
                where: { cardId },
                include: {
                    column: {
                        include: {
                            board: {
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
                            }
                        }
                    }
                }
            });
            const comment = yield this.prismaService.client.commentModel.create({
                data: {
                    text,
                    user: { connect: { id: userId } },
                    card: { connect: { cardId } },
                    createdAt: new Date().toISOString(),
                }
            });
            const participants = (_a = card === null || card === void 0 ? void 0 : card.column.board.participants) === null || _a === void 0 ? void 0 : _a.users;
            if (participants) {
                for (const participant of participants) {
                    yield this.prismaService.client.commentReadStatusModel.create({
                        data: {
                            user: { connect: { id: participant.id } },
                            comment: { connect: { id: comment.id } },
                            isRead: userId === participant.id ? true : false
                        }
                    });
                }
            }
            return comment;
        });
    }
    getCardCommentById(commentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prismaService.client.commentModel.findUnique({
                where: { id: commentId },
                include: {
                    readStatuses: true
                }
            });
        });
    }
    getCardComments(cardId) {
        return __awaiter(this, void 0, void 0, function* () {
            const card = yield this.prismaService.client.cardModel.findUnique({
                where: { cardId },
                include: {
                    comments: {
                        include: {
                            readStatuses: true
                        }
                    }
                }
            });
            if (card) {
                return card.comments;
            }
            else {
                return null;
            }
        });
    }
    updateCardComment(commentId, text) {
        return __awaiter(this, void 0, void 0, function* () {
            const comment = this.prismaService.client.commentModel.update({
                where: { id: commentId },
                data: {
                    text
                }
            });
            return comment;
        });
    }
    deleteCardComment(commentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const deletedComment = yield this.prismaService.client.commentModel.delete({
                    where: { id: commentId }
                });
                return !!deletedComment;
            }
            catch (error) {
                return false;
            }
        });
    }
    updateCommentReadStatus(statusId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updatedCommentReadStatus = yield this.prismaService.client.commentReadStatusModel.update({
                    where: {
                        id: statusId,
                    },
                    data: {
                        isRead: true
                    }
                });
                return updatedCommentReadStatus;
            }
            catch (error) {
                return null;
            }
        });
    }
};
exports.CardsServices = CardsServices;
exports.CardsServices = CardsServices = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CardsServices);
//# sourceMappingURL=cards.services.js.map