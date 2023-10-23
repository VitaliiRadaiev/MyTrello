import { injectable, inject } from "inversify";
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
                    create: {}
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
                participants: true,
                columns: true
            }
        });
        return boards;
    }

    async getBoardInfo(boardId: number): Promise<IBoardModel | null> {
        const foundBoard = await this.prismaService.client.boardModel.findUnique({
            where: {
                id: boardId
            },
            include: {
                participants: true,
                columns: true
            }
        });
        if(foundBoard) {
            const board: IBoardModel = {
                id: foundBoard.id,
                name: foundBoard.name,
                createdById: foundBoard.createdById,
                previewImage: foundBoard.previewImage,
                participants: foundBoard.participants as IParticipantsModel | null,
                columns: foundBoard.columns as unknown as IColumnModel[]
            }
            return board;
        } else {
            return null;
        }
    }

    async updateBoardInfo(boardId: number, boardData: { name: string, previewImage: string | null }): Promise<IBoardModel | null> {
        const data: { name: string, previewImage?: string | null } = {
            name: boardData.name,
        }
        if(boardData.previewImage) data.previewImage = boardData.previewImage;
        
        const updatedBoard = await this.prismaService.client.boardModel.update({
            where: { id: boardId },
            data,
            include: {
                createdBy: true,
                participants: true,
                columns: true
            }
        });

        if(updatedBoard) {
            const board: IBoardModel = {
                id: updatedBoard.id,
                name: updatedBoard.name,
                createdById: updatedBoard.createdById,
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
        try {
            await this.prismaService.client.boardModel.delete({
                where: {
                    id: boardId
                }
            });
            return true;
        } catch (error) {
            return false;
        }
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
}