import { ICardModel } from "../cards/cards.types";

export interface IColumnModel {
    id: number;
    name: string;
    boardId: number;
    order: number;
    cards?: ICardModel[];
}

export interface IMappedCards {
    comments: {
        items: {
            id: number;
            text: string;
            userId: number;
            cardId: number;
        }[];
        totalCount: number;
    };
    images: {
        id: number;
        url: string;
        imageName: string;
        cardId: number;
    }[];
    cardId: number;
    title: string;
    description: string | null;
    columnId: number;
    order: number;
}
