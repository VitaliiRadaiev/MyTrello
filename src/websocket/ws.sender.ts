import { BoardsServices } from "../boards/boards.services";
import { IParticipantsModel } from "../boards/boards.types";
import { TYPES } from "../types";
import { WsClients } from "./ws.clients";
import { injectable, inject } from "inversify";
import 'reflect-metadata';

@injectable()
export class WsSender {
    constructor(
        @inject(TYPES.WsClients) private wsClients: WsClients,
        @inject(TYPES.BoardsServices) private boardsService: BoardsServices,
    ) {
    }

    async sendMessage(clientsIds: number[], data: { type: string, body: object }) {
        clientsIds.forEach(id => {
            const ws = this.wsClients.get(id);
            if (ws) ws.send(JSON.stringify(data));
        })
    }
}