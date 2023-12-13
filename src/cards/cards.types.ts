import { IUserModel } from "../users/users.types";

export interface ICardModel {
    cardId: number;
    title: string;
    description: string | null;
    columnId: number;
    order: number;
    images?: ICardImageModel[];
    comments?: ICommentModel[];
}

export interface ICardImageModel {
    id: number;
    photo: string;
    cardId: number;
}

export interface IUpdateCardData {
    columnId?: number;
    title?: string;
    description?: string;
    order?: number;
}

export interface IUploadImage {
    url: string,
    imageName: string
}

export interface ICommentModel {
    id: number;
    text: string;
    user: IUserModel;
    card: ICardModel;
    readStatuses: ICommentReadStatusModel[];
    createdAt: Date;
}

export interface ICommentReadStatusModel {
    id: number;
    messageId: number;
    userId: number;
    isRead: boolean;
    comment: ICommentModel;
    user: IUserModel;
}