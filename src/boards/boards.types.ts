import { ICardModel } from "../cards/cards.types";
import { IColumnModel } from "../columns/columns.types";
import { IUserModel } from "../users/users.types";

export interface IBoardModel {
    id: number;
    name: string;
    createdById: number;
    createdBy: IUserModel;
    previewImage: string | null;
    participants: IParticipantsModel | null;
    columns?: IColumnModel[];
}

export interface ICreatedBoard {
    id: number;
    name: string;
    createdById: number;
    previewImage: string | null;
}

export interface IParticipantsModel {
    id: number;
    boardId: number;
    users: IUserModel[];
}

