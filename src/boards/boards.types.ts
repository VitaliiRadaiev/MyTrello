import { IColumnModel } from "../columns/columns.types";
import { IUserModel } from "../users/users.types";

export interface IBoardModel {
    id: number;
    name: string;
    createdById: number;
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
    board: IBoardModel;
    users?: IUserModel[];
}

export interface ICardModel {
    id: number;
    title: string;
    description: string;
    column: IColumnModel;
    order: number;
    photos: ICardPhotoModel[];
    messages: IMessageModel[];
}

export interface ICardPhotoModel {
    id: number;
    photo: string;
    card: ICardModel;
}

// IMessageModel
export interface IMessageModel {
    id: number;
    text: string;
    user: IUserModel;
    card: ICardModel;
    readStatuses: IMessageReadStatusModel[];
}

export interface IMessageReadStatusModel {
    id: number;
    messageId: number;
    userId: number;
    isRead: boolean;
    message: IMessageModel;
    user: IUserModel;
}