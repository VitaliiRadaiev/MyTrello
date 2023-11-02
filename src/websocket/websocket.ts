import { injectable, inject } from "inversify";
import 'reflect-metadata';
import { TYPES } from "../types";
import { Request } from 'express';
import ws, { RawData } from 'ws';
import url from 'node:url';
import { JwtPayload, verify } from "jsonwebtoken";
import { IConfigService } from "../config/config.service.interface";
import { IJwtPayload, IWebsocketClients } from './ws.types';
import { WsRouts } from "./ws.routs";
import { WsBoardController } from "./board/ws.board.controller";

@injectable()
export class Websocket {
    private _clients: IWebsocketClients = {};

    constructor(
        @inject(TYPES.ConfigService) private configService: IConfigService,
        ) {}

    get init() {
        new WsBoardController();

        return (ws: ws, req: Request) => {
            const token = url.parse(req.url, true).query.token as string;
            if(!token) {
                console.log(`Client has closed`);
                ws.close();
                return;
            }
            const jwtVerify = (): IJwtPayload | null => {
                try {
                    return verify(token, this.configService.get('SECRET')) as IJwtPayload; 
                } catch {
                    return null
                }
            }
            const userData = jwtVerify();
            
            if(!userData) {
                console.log(`Client has closed`);
                ws.close();
                return;
            }

            console.log('Client has conected');
            
            this._clients[userData.id] = ws;

            //ws.send(JSON.stringify({messages: 'test'}));

            const websocketRouts = WsRouts.get();

            ws.on('message', async (data) => {

                // const message = JSON.parse(data.toString());
                // const handler = websocketRouts.routs[message.type];
                // handler(this._clients, userData.id, message);
            })

            ws.on('close', () => {
                console.log('close slient');
                delete this._clients[userData.id]
            })
        }
    }
}