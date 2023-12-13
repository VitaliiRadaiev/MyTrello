import { injectable, inject } from "inversify";
import 'reflect-metadata';
import { TYPES } from "../types";
import { Request } from 'express';
import ws from 'ws';
import url from 'node:url';
import { verify } from "jsonwebtoken";
import { IConfigService } from "../config/config.service.interface";
import { IJwtPayload } from './ws.types';
import { WsClients } from "./ws.clients";

@injectable()
export class Websocket {
    constructor(
        @inject(TYPES.ConfigService) private configService: IConfigService,
        @inject(TYPES.WsClients) private wsClients: WsClients,
        ) {}

    get init() {
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

            this.wsClients.add(userData.id, ws);

            ws.on('close', () => {
                console.log('Client has closed');
                this.wsClients.remove(userData.id);
            })
        }
    }
}