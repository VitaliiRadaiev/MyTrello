import { Request, Response, NextFunction } from "express";
import { BaseController } from "../common/base.controller";
import { injectable, inject } from "inversify";
import 'reflect-metadata';
import { join, extname } from 'path';
import { TYPES } from "../types";
import { ILogger } from "../logger/logger.interface";
import { IConfigService } from "../config/config.service.interface";
import { sign } from 'jsonwebtoken';
import { AuthMiddleware } from "../common/auth.middleware";
import { ValidatePropertiesMiddleware } from "../common/validateProperties.middleware";
import { UsersServices } from "./users.services";
import fileUpload from "express-fileupload";

@injectable()
export class UsersController extends BaseController {

	constructor(
		@inject(TYPES.ILogger) private loggerservice: ILogger,
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.UsersServices) private usersService: UsersServices,
	) {
		super(loggerservice);
		this.bindRoutes([
			{ path: '/register', method: 'post', func: this.register, middlewares: [new ValidatePropertiesMiddleware(['email', 'login', 'password'])] },
			{ path: '/login', method: 'post', func: this.login, middlewares: [new ValidatePropertiesMiddleware(['email', 'password'])] },
			{ path: '/me', method: 'get', func: this.me, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
			{ path: '/me', method: 'put', func: this.updateProfile, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
			{ path: '/', method: 'get', func: this.getAllUsers, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
			{ path: '/:userId', method: 'get', func: this.getUserInfo, middlewares: [new AuthMiddleware(this.configService.get('SECRET'))] },
		]);
	}

	async register({ body }: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const isUserExist = await this.usersService.checkUserExist(body.email);
			if (isUserExist) {
				this.error(res, 422, 'This user already exists.');
			} else {
				const user = await this.usersService.createUser(body);
				const { password, ...rest } = user;
				this.ok(res, { ...rest });
			}
		} catch (error) {
			this.error(res, 500, 'Something was wrong, please try again later!');
		}
	}

	async login({ body }: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const isUserExist = await this.usersService.checkUserExist(body.email);
			if (!isUserExist) {
				this.error(res, 422, 'This user does not exist, please register.');
				return;
			}

			const result = await this.usersService.validateUser(body);
			if (result) {
				const jwt = await this.signJWT(result.id, result.email, this.configService.get('SECRET'));
				res.setHeader('X-JWT', jwt);
				res.setHeader('Access-Control-Expose-Headers', 'X-JWT');
				this.ok(res);
			} else {
				this.error(res, 401, 'Authorisation Error [login].');
				return;
			}

		} catch (error) {
			this.error(res, 500, 'Something was wrong, please try again later!');
		}
	}

	private signJWT(id: number, email: string, secret: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			sign({
				id,
				email,
				iat: Math.floor(Date.now() / 1000),
			},
				secret,
				{
					algorithm: 'HS256'
				},
				(err, token) => {
					if (err) reject(err);
					resolve(token as string);
				});
		})
	}

	async me(req: Request, res: Response, next: NextFunction): Promise<void> {
		console.log(req.ip);
		
		try {
			const user = await this.usersService.getUserInfo(req.user.id)
			if (user) {
				this.ok(res, user);
			} else {
				this.error(res, 404, 'User is not found.');
			}

		} catch (error) {
			this.error(res, 500, 'Something was wrong, please try again later!');
		}
	}

	async updateProfile({ body, files, user }: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const profileData = body;
			if(!(profileData['login'] || files?.photo)) {
				this.error(res, 422, 'The request must have at least one of the following properties: login, photo (file)');
				return;
			}

			profileData.profilePhoto = await new Promise((rej) => {
				if (files && Object.keys(files).length >= 1) {
					const photo = files.photo as fileUpload.UploadedFile;
					const uploadPath = join(__dirname, '../public/uploads', `profilePhoto_userId=${user.id}${extname(photo.name)}`);

                    photo.mv(uploadPath, async (err) => {
                        if (err) {
                            rej(undefined);
                        }
                        rej(`/uploads/profilePhoto_userId=${user.id}${extname(photo.name)}`);
                    });
				} else {
                    rej(undefined);
                }
			})
			
			const updatedProfile = await this.usersService
			.updateProfile(
				user.id, 
				{ login: profileData.login, profilePhoto: profileData.profilePhoto }
			);

			if (updatedProfile) {
				this.ok(res, updatedProfile);
			} else {
				this.error(res, 404, 'User is not found.');
			}
		} catch (error) {
			this.error(res, 500, 'Something was wrong, please try again later!');
		}
	}

	async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const users = await this.usersService.getAllUsers();
			this.ok(res, users);
		} catch (error) {
			this.error(res, 500, 'Something was wrong, please try again later!');
		}
	}

	async getUserInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const userId = parseInt(req.params.userId, 10);
			const user = await this.usersService.getUserInfo(userId);

			if (user) {
				this.ok(res, user);
			} else {
				this.error(res, 404, 'User is not found.');
			}
		} catch (error) {
			this.error(res, 500, 'Something was wrong, please try again later!');
		}
	}
}