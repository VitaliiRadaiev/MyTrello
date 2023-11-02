import { IMessageModel } from "../boards/boards.types";

export interface ICardModel {
    cardId: number;
    title: string;
    description: string | null;
    columnId: number;
    order: number;
    images?: ICardImageModel[];
    messages?: IMessageModel[];
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