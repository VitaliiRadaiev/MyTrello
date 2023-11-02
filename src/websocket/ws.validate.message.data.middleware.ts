import { IWebsocketClients, IWsMessageRequest, IWsMiddlewares } from "./ws.types";

export class ValidateMessageDataMiddleware implements IWsMiddlewares {

    constructor() { }

    execute(wsClients: IWebsocketClients, userId: number, message: IWsMessageRequest, next: () => void): void {
        const requestKeys = Object.keys(message);
        const validateProperties = ['type', 'body'];
        if (
            validateProperties.length === requestKeys.length
            && requestKeys.every(key => {
                return validateProperties.includes(key);
            })
        ) {
            next();
        } else {
            wsClients[userId].send(JSON.stringify(
                {
                    statusCode: 1,
                    status: 422,
                    message: `The request must have the following properties: ${validateProperties.join(', ')}`
                }
            ))
        }
    }

}