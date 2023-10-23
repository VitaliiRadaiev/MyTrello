import { injectable, inject } from "inversify";
import 'reflect-metadata';
import { TYPES } from "../types";
import { PrismaService } from "../database/prisma.service";
import { IUserLoginRequest, IUserModel, IUserRegisterRequest } from "./users.types";
import { IConfigService } from "../config/config.service.interface";
import { User } from "./user.entity";

@injectable()
export class UsersServices {
    constructor(
        @inject(TYPES.ConfigService) private configService: IConfigService,
        @inject(TYPES.PrismaService) private prismaService: PrismaService,
    ) { }

    async checkUserExist(email: string): Promise<IUserModel | null> {
        return this.prismaService.client.userModel.findFirst({
            where: {
                email
            }
        })
    }

    async createUser({ email, login, password }: IUserRegisterRequest): Promise<IUserModel> {
        const newUser = new User(email, login);
        const salt = this.configService.get('SALT');

        await newUser.setPassword(password, Number(salt));

        const user = await this.prismaService.client.userModel.create({
            data: {
                email: newUser.email,
                login: newUser.login,
                password: newUser.password
            }
        });

        return user;
    }

    async validateUser({ email, password }: IUserLoginRequest): Promise<IUserModel | null> {
        const user = await this.prismaService.client.userModel.findFirst({
            where: {
                email
            }
        });

        if (!user) return null;

        const newUser = new User(user.email, user.login, user.password);
        const isValidate = await newUser.comparePassword(password);

        return isValidate ? user : null;
    }

    async getUser(id: number): Promise<IUserModel | null> {
        const user = await this.prismaService.client.userModel.findFirst({
            where: {
                id
            }
        })

        if (user) {
            const { password, ...rest } = user;
            return rest;
        } else {
            return null;
        }
    }

    async updateProfile(userId: number, updateData: { login: string, profilePhoto?: string | null }): Promise<IUserModel | null> {
        try {
            const data: { login: string, profilePhoto?: string | null } = {
                login: updateData.login,
            }
            if(updateData.profilePhoto) data.profilePhoto = updateData.profilePhoto;
        
            const updatedUser = await this.prismaService.client.userModel.update({
                where: { id: userId },
                data,
            });
            const { password, ...rest } = updatedUser;
            return rest;
        } catch (error) {
            throw error;
        }
    }

    async getAllUsers(): Promise<IUserModel[]> {
        const users = await this.prismaService.client.userModel.findMany();
        return users.map(user => {
            const {password, ...rest} = user;
            return rest;
        });
    }

    async getUserInfo(userId: number): Promise<IUserModel | null> {
        const user = await this.prismaService.client.userModel.findFirst({
            where: {
                id: userId,
            },
        });
        if(user) {
            const {password, ...rest} = user;
            return rest;
        } else {
            return null;
        }
    }
}