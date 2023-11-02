import { IMiddleware } from "./middleware.interface";
import { Request, Response, NextFunction } from "express";

export class ValidatePropertiesMiddleware implements IMiddleware {

    constructor(private validateProperties: string[], private someMode?: boolean) { }

    execute(req: Request, res: Response, next: NextFunction): void {
        if (this.someMode) {
            this.some(req, res, next);
        } else {
            this.every(req, res, next);
        }
    }

    private some({ body }: Request, res: Response, next: NextFunction) {
        const requestKeys = Object.keys(body);
        if (
            requestKeys.length
            && requestKeys.every(key => {
                return this.validateProperties.includes(key);
            })
        ) {
            next();
            return;
        }
        res.status(422).send({
            resultCode: 1,
            message:
                `Bad request or no fields match the following properties: ${this.validateProperties.join(', ')}`
        });
    }

    private every({ body }: Request, res: Response, next: NextFunction) {
        const requestKeys = Object.keys(body);
        if (
            this.validateProperties.length === requestKeys.length
            && requestKeys.every(key => {
                return this.validateProperties.includes(key);
            })
        ) {
            next();
        } else {
            res.status(422).send({
                resultCode: 1,
                message:
                    `The request must have the following properties: ${this.validateProperties.join(', ')}`
            });
        }
    }
}