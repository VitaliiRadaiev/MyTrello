import { injectable, inject } from 'inversify';
import { PrismaService } from '../database/prisma.service';
import { TYPES } from '../types';
import { ICardModel, IUpdateCardData, IUploadImage } from './cards.types';
import { CardImageModel, CardModel, CommentModel, CommentReadStatusModel } from '@prisma/client';

@injectable()
export class CardsServices {
    constructor(
        @inject(TYPES.PrismaService) private prismaService: PrismaService,
    ) { }

    async createCard(columnId: number, title: string,): Promise<ICardModel> {
        const cardsOfColumn = await this.prismaService.client.cardModel.findMany({
            where: { columnId }
        });

        const createdCard = await this.prismaService.client.cardModel.create({
            data: {
                column: { connect: { id: columnId } },
                title,
                order: cardsOfColumn.length + 1,
            },
        });
        return await this.getCardById(createdCard.cardId); 
    }

    async getCardById(cardId: number): Promise<any | null> {
        const card = await this.prismaService.client.cardModel.findUnique({
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
            return {
                ...card,
                comments: card.comments.reverse()
            };
        } else {
            return null;
        }
    }

    async updateCard(cardId: number, cardData: IUpdateCardData): Promise<ICardModel | null> {
        const currentCard = await this.prismaService.client.cardModel.findUnique({
            where: { cardId }
        });
        if (!currentCard) return null;

        if (cardData.order && currentCard.order !== cardData.order) {
            const columnId = currentCard.columnId;

            const cards = await this.prismaService.client.cardModel.findMany({
                where: { columnId },
                orderBy: { order: 'asc' }
            });

            const cardsWithoutCurrentCard = cards.filter(card => card.cardId !== cardId);
            const cardsWithRightOrder = cardsWithoutCurrentCard.slice();
            cardsWithoutCurrentCard.splice(cardData.order - 1, 0, currentCard);

            await this.setCardsOrder(cardsWithoutCurrentCard);
        }

        const { order, ...data } = cardData;

        const updatedCard = await this.prismaService.client.cardModel.update({
            where: { cardId },
            data,
        });
        return updatedCard;
    }

    async setNewColumn(cardId: number, columnId: number, order: number) {

        const updateCard = await this.prismaService.client.cardModel.update({
            where: { cardId },
            data: {
                columnId,
                order
            }
        });

        const cards = await this.prismaService.client.cardModel.findMany({
            where: { columnId },
            orderBy: { order: 'asc' }
        });

        const cardsWithoutCurrentCard = cards.filter(card => card.cardId !== cardId);

        let calculatedOrder: number = order;
        if (cardsWithoutCurrentCard.length === 0) calculatedOrder = 1;
        if (order > cardsWithoutCurrentCard.length) calculatedOrder = cardsWithoutCurrentCard.length + 1;

        const cardsWithRightOrder = cardsWithoutCurrentCard.slice();

        cardsWithRightOrder.splice(calculatedOrder - 1, 0, updateCard);

        await this.setCardsOrder(cardsWithRightOrder);

        return updateCard;
    }

    async deleteCard(cardId: number): Promise<boolean> {
        const deletedCard = await this.prismaService.client.cardModel.delete({
            where: { cardId },
        });

        if (deletedCard) {
            const columnId = deletedCard.columnId;

            const cards = await this.prismaService.client.cardModel.findMany({
                where: { columnId },
                orderBy: { order: 'asc' }
            });

            await this.setCardsOrder(cards);
        }

        return !!deletedCard;
    }

    async uploadImage(cardId: number, imgData: IUploadImage | undefined): Promise<CardImageModel | null> {
        if (!imgData) return null;
        return this.prismaService.client.cardImageModel.create({
            data: {
                card: { connect: { cardId } },
                url: imgData.url,
                imageName: imgData.imageName
            }
        });
    }

    async getCardImages(cardId: number): Promise<CardImageModel[]> {
        return this.prismaService.client.cardImageModel.findMany({
            where: { cardId }
        });
    }
    async getCardImageById(imageId: number): Promise<CardImageModel | null> {
        return this.prismaService.client.cardImageModel.findUnique({
            where: { id: imageId }
        });
    }

    async deleteImage(imageId: number): Promise<boolean> {
        const deletedImage = await this.prismaService.client.cardImageModel.delete({
            where: { id: imageId }
        });

        return !!deletedImage;
    }

    private async setCardsOrder(cards: ICardModel[]) {
        let countOrder = 1;
        for (const card of cards) {
            await this.prismaService.client.cardModel.update({
                where: {
                    cardId: card.cardId
                },
                data: {
                    order: countOrder++
                }
            });
        }
    }

    async createCardComment(userId: number, cardId: number, text: string) {
        const card = await this.prismaService.client.cardModel.findUnique({
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

        const comment = await this.prismaService.client.commentModel.create({
            data: {
                text,
                user: { connect: { id: userId } },
                card: { connect: { cardId } },
                createdAt: new Date().toISOString(),
            }
        })

        const participants = card?.column.board.participants?.users;
        if (participants) {
            for (const participant of participants) {
                await this.prismaService.client.commentReadStatusModel.create({
                    data: {
                        user: { connect: { id: participant.id } },
                        comment: { connect: { id: comment.id } },
                        isRead: userId === participant.id ? true : false
                    }
                })
            }
        }
        return comment;
    }
    async getCardCommentById(commentId: number): Promise<CommentModel | null> {
        return this.prismaService.client.commentModel.findUnique({
            where: { id: commentId },
            include: {
                readStatuses: true
            }
        });
    }
    async getCardComments(cardId: number): Promise<CommentModel[] | null> {
        const card = await this.prismaService.client.cardModel.findUnique({
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
        } else {
            return null;
        }
    }
    async updateCardComment(commentId: number, text: string): Promise<CommentModel> {
        const comment = this.prismaService.client.commentModel.update({
            where: { id: commentId },
            data: {
                text
            }
        });
        return comment;
    }
    async deleteCardComment(commentId: number): Promise<boolean> {
        try {
            const deletedComment = await this.prismaService.client.commentModel.delete({
                where: { id: commentId }
            });
            return !!deletedComment;
            
        } catch (error) {
            return false;
        }
    }
    async updateCommentReadStatus(statusId: number): Promise<CommentReadStatusModel | null> {
        try {
            const updatedCommentReadStatus = await this.prismaService.client.commentReadStatusModel.update({
                where: {
                    id: statusId,
                },
                data: {
                    isRead: true
                }
            });
            return updatedCommentReadStatus;
        } catch (error) {
            return null;
        }
    }
}