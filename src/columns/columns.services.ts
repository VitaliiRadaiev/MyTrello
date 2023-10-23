import { injectable, inject } from 'inversify';
import { PrismaService } from '../database/prisma.service';

import { TYPES } from '../types';
import { IColumnModel } from './columns.types';

@injectable()
export class ColumnsServices {
    constructor(
        @inject(TYPES.PrismaService) private prismaService: PrismaService,
    ) { }

    async createColumn(columnData: { name: string, boardId: number }): Promise<IColumnModel> {
        const columnsOfBoard = await this.prismaService.client.columnModel.findMany({
            where: { boardId: columnData.boardId }
        })

        const { name, boardId } = columnData;
        const createdColumn = await this.prismaService.client.columnModel.create({
            data: {
                board: { connect: { id: boardId } },
                name,
                order: columnsOfBoard.length + 1
            },
        });
        return createdColumn;
    }

    async getColumnById(columnId: number): Promise<object | null> {
        const column = await this.prismaService.client.columnModel.findUnique({
            where: { id: columnId },
            include: {
                cards: true
            }
        });
        return column;
    }

    async updateColumn(columnId: number, columnData: { name: string, order: number }): Promise<IColumnModel | null> {
        const currentColumn = await this.prismaService.client.columnModel.findUnique({
            where: { id: columnId }
        });
        if(!currentColumn) return null;

        if(currentColumn.order !== columnData.order) {
            const boardId = currentColumn.boardId;

            const columns = await this.prismaService.client.columnModel.findMany({
                where: { boardId },
                orderBy: { order: 'asc' },
            });
    
            const columnsWithoutCurrentColumn = columns.filter(column => column.id !== columnId);
            const columnsWithRightOrder = columnsWithoutCurrentColumn.slice();
            columnsWithRightOrder.splice(columnData.order - 1, 0, currentColumn);

            await this.setColumnsOrder(columnsWithRightOrder);
        }
        
        const updatedColumn = await this.prismaService.client.columnModel.update({
            where: { id: columnId },
            data: {
                name: columnData.name
            }
        });
        return updatedColumn;
    }

    async deleteColumn(columnId: number): Promise<boolean> {
        const deletedColumn = await this.prismaService.client.columnModel.delete({
            where: { id: columnId },
        });
        if(deletedColumn) {
            const boardId = deletedColumn.boardId;

            const columns = await this.prismaService.client.columnModel.findMany({
                where: { boardId },
                orderBy: { order: 'asc' },
            });

            await this.setColumnsOrder(columns);
        }
        return !!deletedColumn;
    }

    private async setColumnsOrder(columns: IColumnModel[]) {
        let countOrder = 1;
        for (const column of columns) {
            await this.prismaService.client.columnModel.update({
                where: {
                    id: column.id
                },
                data: {
                    order: countOrder
                }
            });
            countOrder++
        }
    }
}
