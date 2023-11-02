import { IWebsocketClients, IWsMessageRequest, IWsRout, IWsRoutes } from './ws.types';

export class WsRouts {
    private static instance: WsRouts;
    _routs: IWsRoutes = {};

    private constructor() {}

    addRouts(routs: IWsRout[]): void {
        routs.forEach((rout) => {
            this._routs[rout.type] = async (wsClients: IWebsocketClients, userId: number, message: IWsMessageRequest) => {
                const pipline = rout.middlewares ? [...rout.middlewares, rout.func] : [rout.func];
    
                const runner = async (index: number) => {
                    const middleware = pipline[index];
    
                    if (typeof middleware === 'object') {
                        await middleware.execute(wsClients, userId, message, () => {
                            return runner(index + 1);
                        })
                    } else {
                        await middleware(wsClients, userId, message);
                    }
                }
    
                await runner(0);
            };
        })
    }

    get routs() {
        return this._routs;
    }

    public static get(): WsRouts {
        if (!WsRouts.instance) {
            WsRouts.instance = new WsRouts();
        }
        return WsRouts.instance;
    }
}

// const websocketRouts = WebsocketRouts.get();

// export class ValidateWSPropertiesMiddleware implements IWsMiddlewares {

//     constructor() { }

//     execute(ws: ws, body: object, next: () => void): void {
//         console.log('run middleware');
//         ws.send(JSON.stringify(
//             {
//                 type: 'ws/api/getColumns',
//                 statusCode: 1,
//                 message: 'something was wrong'
//             }
//         ))
//         //next();
//     }

// }
// export class ValidateWSPropertiesMiddleware2 implements IWsMiddlewares {

//     constructor() { }

//     execute(ws: ws, body: object, next: () => void): void {
//         console.log('run middleware 2');
//         next();
//     }

// }

// websocketRouts.addRout({ type: 'ws/api/getColumns', func: getColumns, middlewares: [new ValidateWSPropertiesMiddleware(), new ValidateWSPropertiesMiddleware2()] });

// function getColumns(ws: ws, body: object): void {
//     console.log('body', body);
// }

// interface IWSData {
//     type: string,
//     body: object
// }

// const backTake = {
//     type: 'ws/api/getColumns',
//     body: {
//         boardId: 7
//     }
// }
// const backSend = {
//     type: 'ws/api/getColumns',
//     statusColde: 0,
//     status: 200,
//     body: {
//         // columns
//     }
// }
// const backSendError = {
//     type: 'ws/api/getColumns',
//     statusColde: 1,
//     status: 500,
//     message: 'Ther request mast has follow properties: { type: strign, body: object }'
// }

// const frongTake = {
//     type: 'ws/api/getColumns',
//     body: {
//         boardId: 1
//     }
// }
// const frontSend = {
//     type: 'ws/api/updateColumns',
//     body: {
//         boardId: 1,
//         order: 2
//     }
// }

