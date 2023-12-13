"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatePropertiesMiddleware = void 0;
class ValidatePropertiesMiddleware {
    constructor(validateProperties, someMode) {
        this.validateProperties = validateProperties;
        this.someMode = someMode;
    }
    execute(req, res, next) {
        if (this.someMode) {
            this.some(req, res, next);
        }
        else {
            this.every(req, res, next);
        }
    }
    some({ body }, res, next) {
        const requestKeys = Object.keys(body);
        if (requestKeys.length
            && requestKeys.every(key => {
                return this.validateProperties.includes(key);
            })) {
            next();
            return;
        }
        res.status(422).send({
            resultCode: 1,
            message: `Bad request or no fields match the following properties: ${this.validateProperties.join(', ')}`
        });
    }
    every({ body }, res, next) {
        const requestKeys = Object.keys(body);
        if (this.validateProperties.length === requestKeys.length
            && requestKeys.every(key => {
                return this.validateProperties.includes(key);
            })) {
            next();
        }
        else {
            res.status(422).send({
                resultCode: 1,
                message: `The request must have the following properties: ${this.validateProperties.join(', ')}`
            });
        }
    }
}
exports.ValidatePropertiesMiddleware = ValidatePropertiesMiddleware;
//# sourceMappingURL=validateProperties.middleware.js.map