import { JwtPayload, verify } from "jsonwebtoken";
import ws from "ws";

export interface IJwtPayload extends JwtPayload {
    email: string,
    id: number
}

export interface IWebsocketClients {
    [key: string]: ws
}

export interface IWsMessageRequest {
    type: string,
    body: object
}

export interface IWsMiddlewares {
    execute: (wsClients: IWebsocketClients, userId: number, message: IWsMessageRequest, next: () => void) => void;
}

export interface IWsRoutes {
    [key: string]: (wsClients: IWebsocketClients, userId: number, message: IWsMessageRequest) => void;
}

export interface IWsRout { 
    type: string; 
    func: (wsClients: IWebsocketClients, userId: number, message: IWsMessageRequest) => void; 
    middlewares: IWsMiddlewares[] | undefined; 
};