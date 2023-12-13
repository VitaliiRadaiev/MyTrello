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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersServices = void 0;
const inversify_1 = require("inversify");
require("reflect-metadata");
const types_1 = require("../types");
const prisma_service_1 = require("../database/prisma.service");
const user_entity_1 = require("./user.entity");
let UsersServices = class UsersServices {
    constructor(configService, prismaService) {
        this.configService = configService;
        this.prismaService = prismaService;
    }
    checkUserExist(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prismaService.client.userModel.findFirst({
                where: {
                    email
                }
            });
        });
    }
    createUser({ email, login, password }) {
        return __awaiter(this, void 0, void 0, function* () {
            const newUser = new user_entity_1.User(email, login);
            const salt = this.configService.get('SALT');
            yield newUser.setPassword(password, Number(salt));
            const user = yield this.prismaService.client.userModel.create({
                data: {
                    email: newUser.email,
                    login: newUser.login,
                    password: newUser.password
                }
            });
            return user;
        });
    }
    validateUser({ email, password }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.prismaService.client.userModel.findFirst({
                where: {
                    email
                }
            });
            if (!user)
                return null;
            const newUser = new user_entity_1.User(user.email, user.login, user.password);
            const isValidate = yield newUser.comparePassword(password);
            return isValidate ? user : null;
        });
    }
    updateProfile(userId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updatedUser = yield this.prismaService.client.userModel.update({
                    where: { id: userId },
                    data: updateData
                });
                const { password } = updatedUser, rest = __rest(updatedUser, ["password"]);
                return rest;
            }
            catch (error) {
                throw error;
            }
        });
    }
    getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield this.prismaService.client.userModel.findMany();
            return users.map(user => {
                const { password } = user, rest = __rest(user, ["password"]);
                return rest;
            });
        });
    }
    getUserInfo(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.prismaService.client.userModel.findFirst({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    email: true,
                    login: true,
                    profilePhoto: true
                }
            });
            if (user) {
                return user;
            }
            else {
                return null;
            }
        });
    }
};
exports.UsersServices = UsersServices;
exports.UsersServices = UsersServices = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.ConfigService)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.PrismaService)),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService])
], UsersServices);
//# sourceMappingURL=users.services.js.map