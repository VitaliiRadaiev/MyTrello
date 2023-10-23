import { IMiddleware } from "./middleware.interface";
import { Request, Response, NextFunction } from "express";

export class ValidatePropertiesMiddleware implements IMiddleware {

    constructor(private validateProperties: string[]) { }

    execute({ body }: Request, res: Response, next: NextFunction): void {
        const requestKeys = Object.keys(body);
        if (
            this.validateProperties.length === requestKeys.length
            && requestKeys.every(key => {
                return this.validateProperties.includes(key);
            })
        ) {
            next();
        } else {
            res.status(422).send({ resultCode: 1, message: `The request must have the following properties: ${this.validateProperties.join(', ')}`});
        }
    }
}