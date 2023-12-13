import { IUserModel } from "../users/users.types";

export function getClietntsIds(currentUserId: number, users: IUserModel[]) {
    return users.map(user => user.id).filter(id => id !== currentUserId);
}