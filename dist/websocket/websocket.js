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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Websocket = void 0;
const inversify_1 = require("inversify");
require("reflect-metadata");
const types_1 = require("../types");
const node_url_1 = __importDefault(require("node:url"));
const jsonwebtoken_1 = require("jsonwebtoken");
const ws_clients_1 = require("./ws.clients");
let Websocket = class Websocket {
    constructor(configService, wsClients) {
        this.configService = configService;
        this.wsClients = wsClients;
    }
    get init() {
        return (ws, req) => {
            const token = node_url_1.default.parse(req.url, true).query.token;
            if (!token) {
                console.log(`Client has closed`);
                ws.close();
                return;
            }
            const jwtVerify = () => {
                try {
                    return (0, jsonwebtoken_1.verify)(token, this.configService.get('SECRET'));
                }
                catch (_a) {
                    return null;
                }
            };
            const userData = jwtVerify();
            if (!userData) {
                console.log(`Client has closed`);
                ws.close();
                return;
            }
            console.log('Client has conected');
            this.wsClients.add(userData.id, ws);
            ws.on('close', () => {
                console.log('Client has closed');
                this.wsClients.remove(userData.id);
            });
        };
    }
};
exports.Websocket = Websocket;
exports.Websocket = Websocket = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.ConfigService)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.WsClients)),
    __metadata("design:paramtypes", [Object, ws_clients_1.WsClients])
], Websocket);
//# sourceMappingURL=websocket.js.map