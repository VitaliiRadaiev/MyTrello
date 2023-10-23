import { IBoardModel, ICardModel } from "../boards/boards.types";

export interface IColumnModel {
    id: number;
    name: string;
    boardId: number;
    order: number;
    cards?: ICardModel[];
}