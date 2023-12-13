"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const http_error_class_1 = require("../errors/http-error.class");
class AuthMiddleware {
    constructor(secret) {
        this.secret = secret;
    }
    execute(req, res, next) {
        if (req.headers.authorization) {
            let resutl = (0, jsonwebtoken_1.verify)(req.headers.authorization.split(' ')[1], this.secret);
            if (resutl.id) {
                req.user = {
                    id: resutl.id
                };
                next();
            }
            else {
                next(new http_error_class_1.HTTPError(401, 'error of authorisation'));
            }
        }
        else {
            next(new http_error_class_1.HTTPError(401, 'error of authorisation'));
        }
    }
}
exports.AuthMiddleware = AuthMiddleware;
//# sourceMappingURL=auth.middleware.js.map