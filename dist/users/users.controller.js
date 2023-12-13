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
exports.UsersController = void 0;
const base_controller_1 = require("../common/base.controller");
const inversify_1 = require("inversify");
require("reflect-metadata");
const path_1 = require("path");
const types_1 = require("../types");
const jsonwebtoken_1 = require("jsonwebtoken");
const auth_middleware_1 = require("../common/auth.middleware");
const validateProperties_middleware_1 = require("../common/validateProperties.middleware");
const users_services_1 = require("./users.services");
let UsersController = class UsersController extends base_controller_1.BaseController {
    constructor(loggerservice, configService, usersService) {
        super(loggerservice);
        this.loggerservice = loggerservice;
        this.configService = configService;
        this.usersService = usersService;
        this.bindRoutes([
            { path: '/register', method: 'post', func: this.register, middlewares: [new validateProperties_middleware_1.ValidatePropertiesMiddleware(['email', 'login', 'password'])] },
            { path: '/login', method: 'post', func: this.login, middlewares: [new validateProperties_middleware_1.ValidatePropertiesMiddleware(['email', 'password'])] },
            { path: '/me', method: 'get', func: this.me, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/me', method: 'put', func: this.updateProfile, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/', method: 'get', func: this.getAllUsers, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
            { path: '/:userId', method: 'get', func: this.getUserInfo, middlewares: [new auth_middleware_1.AuthMiddleware(this.configService.get('SECRET'))] },
        ]);
    }
    register({ body }, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const isUserExist = yield this.usersService.checkUserExist(body.email);
                if (isUserExist) {
                    this.error(res, 422, 'This user already exists.');
                }
                else {
                    const user = yield this.usersService.createUser(body);
                    const { password } = user, rest = __rest(user, ["password"]);
                    this.ok(res, Object.assign({}, rest));
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    login({ body }, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const isUserExist = yield this.usersService.checkUserExist(body.email);
                if (!isUserExist) {
                    this.error(res, 422, 'This user does not exist, please register.');
                    return;
                }
                const result = yield this.usersService.validateUser(body);
                if (result) {
                    const jwt = yield this.signJWT(result.id, result.email, this.configService.get('SECRET'));
                    res.setHeader('X-JWT', jwt);
                    res.setHeader('Access-Control-Expose-Headers', 'X-JWT');
                    this.ok(res);
                }
                else {
                    this.error(res, 401, 'Authorisation Error [login].');
                    return;
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    signJWT(id, email, secret) {
        return new Promise((resolve, reject) => {
            (0, jsonwebtoken_1.sign)({
                id,
                email,
                iat: Math.floor(Date.now() / 1000),
            }, secret, {
                algorithm: 'HS256'
            }, (err, token) => {
                if (err)
                    reject(err);
                resolve(token);
            });
        });
    }
    me(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.usersService.getUserInfo(req.user.id);
                if (user) {
                    this.ok(res, user);
                }
                else {
                    this.error(res, 404, 'User is not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    updateProfile({ body, files, user }, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const profileData = body;
                if (!(profileData['login'] || (files === null || files === void 0 ? void 0 : files.photo))) {
                    this.error(res, 422, 'The request must have at least one of the following properties: login, photo (file)');
                    return;
                }
                profileData.profilePhoto = yield new Promise((rej) => {
                    if (files && Object.keys(files).length >= 1) {
                        const photo = files.photo;
                        const uploadPath = (0, path_1.join)(__dirname, '../public/uploads', `profilePhoto_userId=${user.id}${(0, path_1.extname)(photo.name)}`);
                        photo.mv(uploadPath, (err) => __awaiter(this, void 0, void 0, function* () {
                            if (err) {
                                rej(undefined);
                            }
                            rej(`/uploads/profilePhoto_userId=${user.id}${(0, path_1.extname)(photo.name)}`);
                        }));
                    }
                    else {
                        rej(undefined);
                    }
                });
                const updatedProfile = yield this.usersService
                    .updateProfile(user.id, { login: profileData.login, profilePhoto: profileData.profilePhoto });
                if (updatedProfile) {
                    this.ok(res, updatedProfile);
                }
                else {
                    this.error(res, 404, 'User is not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    getAllUsers(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield this.usersService.getAllUsers();
                this.ok(res, users);
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
    getUserInfo(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = parseInt(req.params.userId, 10);
                const user = yield this.usersService.getUserInfo(userId);
                if (user) {
                    this.ok(res, user);
                }
                else {
                    this.error(res, 404, 'User is not found.');
                }
            }
            catch (error) {
                this.error(res, 500, 'Something was wrong, please try again later!');
            }
        });
    }
};
exports.UsersController = UsersController;
exports.UsersController = UsersController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.ILogger)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.ConfigService)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.UsersServices)),
    __metadata("design:paramtypes", [Object, Object, users_services_1.UsersServices])
], UsersController);
//# sourceMappingURL=users.controller.js.map