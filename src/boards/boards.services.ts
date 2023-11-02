import { injectable, inject, id } from "inversify";
import 'reflect-metadata';
import { TYPES } from "../types";
import { PrismaService } from "../database/prisma.service";
import { IBoardModel, ICreatedBoard, IParticipantsModel } from "./boards.types";
import { IColumnModel } from "../columns/columns.types";

@injectable()
export class BoardsServices {
    constructor(
        @inject(TYPES.PrismaService) private prismaService: PrismaService,
    ) { }

    async createBoard(userId: number, name: string, photoUrl: string | null): Promise<ICreatedBoard> {
        const board = await this.prismaService.client.boardModel.create({
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
    }

    async getAllBoards(userId: number): Promise<object[]> {
        const boards = await this.prismaService.client.boardModel.findMany({
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
                },
                columns: true
            }
        });
        return boards;
    }

    async getAllGuestBoards(userId: number): Promise<object[]> {
        const user = await this.prismaService.client.userModel.findUnique({
            where: {
                id: userId
            },
            include: {
                participantOfBoards: true
            }
        });
        const boards: object[] = [];
        if(user && user.participantOfBoards.length) {
            for(const participant of user.participantOfBoards) {
                const board = await this.prismaService.client.boardModel.findUnique({
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
                        },
                        columns: true
                    }
                });

                if(board) {
                    boards.push(board);
                }
            }
        }
        return boards;
    }

    async getBoardInfo(boardId: number): Promise<IBoardModel | null> {
        const foundBoard = await this.prismaService.client.boardModel.findUnique({
            where: {
                id: boardId
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
                },
                columns: true,
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                        login: true,
                        profilePhoto: true,
                    }
                }
            }
        });
        if(foundBoard) {
            const board: IBoardModel = {
                id: foundBoard.id,
                name: foundBoard.name,
                createdBy: foundBoard.createdBy,
                previewImage: foundBoard.previewImage,
                participants: foundBoard.participants as IParticipantsModel | null,
                columns: foundBoard.columns as unknown as IColumnModel[]
            }
            return board;
        } else {
            return null;
        }
    }

    async updateBoardInfo(boardId: number, boardData: { name?: string, previewImage?: string }): Promise<IBoardModel | null> {
        const updatedBoard = await this.prismaService.client.boardModel.update({
            where: { id: boardId },
            data: boardData,
            include: {
                createdBy: true,
                participants: {
                    include: {
                        users: true
                    }
                },
                columns: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if(updatedBoard) {
            const board: IBoardModel = {
                id: updatedBoard.id,
                name: updatedBoard.name,
                createdBy: updatedBoard.createdBy,
                previewImage: updatedBoard.previewImage,
                participants: updatedBoard.participants as IParticipantsModel | null,
                columns: updatedBoard.columns as unknown as IColumnModel[]
            }
            return board;
        } else {
            return null;
        }
    }

    async deleteBoard(boardId: number): Promise<boolean> {
        const deletedBoard = await this.prismaService.client.boardModel.delete({
            where: {
                id: boardId,
            }
        });
        return !!deletedBoard;
    }

    async getColumnsByBoardId(boardId: number): Promise<IColumnModel[]> {
        const board = await this.prismaService.client.boardModel.findUnique({
            where: { id: boardId },
            include: {
                columns: {
                    orderBy: { order: 'asc' }
                }
            }
        });
        if(board) {
            return board.columns;
        } else {
            return []
        }
    }

    async addParticipant(participantId: number, userId: number) {
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
        
    }
    async removeParticipant(participantId: number, userId: number) {
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
        
    }
    async getParticipants(boardId: number) {
        return this.prismaService.client.participantsModel.findFirst({
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
        
    }
}