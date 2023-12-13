import ws, { RawData } from 'ws';
import { injectable, inject } from "inversify";
import 'reflect-metadata';

@injectable()
export class WsClients {
    private _clients: Map<number, ws> = new Map();

    public add(userId: number, ws: ws) {
        this._clients.set(userId, ws);
    }
    public remove(userId: number) {
        this._clients.delete(userId);
    }
    public get(userId: number) {
        return this._clients.get(userId);
    }
}