export interface IUserModel {
    id: number;
    email: string;
    login: string;
    password?: string;
    profilePhoto: string | null;
}

export interface IUserRegisterRequest {
    email: string;
    login: string;
    password: string;
}
export interface IUserLoginRequest {
    email: string;
    password: string;
}