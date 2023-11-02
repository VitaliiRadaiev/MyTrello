import { WsBaseController } from "../ws.base.controller";
import { IWebsocketClients, IWsMessageRequest } from "../ws.types";
import { ValidateMessageDataMiddleware } from "../ws.validate.message.data.middleware";
import { injectable, inject } from "inversify";
import 'reflect-metadata';

@injectable()
export class WsBoardController extends WsBaseController {
    constructor() {
        super()

        this.addRouts([
            { type: 'ws/api/updateBoard', func: this.updateBoard, middlewares: [new ValidateMessageDataMiddleware()] },
        ])
    }

    async updateBoard(wsClients: IWebsocketClients, userId: number, message: IWsMessageRequest) {
        console.log(wsClients);
        console.log(userId);
        console.log(message);
        
    }
}