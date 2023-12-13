"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
const express_1 = require("express");
const inversify_1 = require("inversify");
require("reflect-metadata");
let BaseController = class BaseController {
    constructor(logger) {
        this.logger = logger;
        this._router = (0, express_1.Router)();
    }
    get router() {
        return this._router;
    }
    send(res, code, body) {
        res.type('application/json');
        return res.status(code).json(body);
    }
    ok(res, data) {
        return this.send(res, 200, { resultCode: 0, data });
    }
    created(res) {
        return res.sendStatus(201);
    }
    error(res, code, message) {
        return this.send(res, code, { resultCode: 1, message });
    }
    bindRoutes(routes) {
        var _a;
        for (const route of routes) {
            this.logger.log(`[${route.method}] ${route.path}`);
            const middleware = (_a = route.middlewares) === null || _a === void 0 ? void 0 : _a.map((m) => m.execute.bind(m));
            const handler = route.func.bind(this);
            const pipeline = middleware ? [...middleware, handler] : handler;
            this.router[route.method](route.path, pipeline);
        }
    }
};
exports.BaseController = BaseController;
exports.BaseController = BaseController = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [Object])
], BaseController);
//# sourceMappingURL=base.controller.js.map