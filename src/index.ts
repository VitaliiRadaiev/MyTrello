import { Container, ContainerModule, interfaces } from "inversify";
import { App } from "./app";
import { TYPES } from "./types";
import { PrismaService } from "./database/prisma.service";
import { ILogger } from "./logger/logger.interface";
import { LoggerService } from "./logger/logger.service";
import { IExeptionFilter } from "./errors/exeption.filter.interface";
import { ExeptionFilter } from "./errors/exeption.filter";
import { IConfigService } from "./config/config.service.interface";
import { ConfigService } from "./config/config.service";
import { UsersController } from "./users/users.controller";
import { UsersServices } from "./users/users.services";
import { BoardsController } from "./boards/boards.controller";
import { BoardsServices } from "./boards/boards.services";
import { ColumnsController } from "./columns/columns.controller";
import { ColumnsServices } from "./columns/columns.services";

export interface IBootstrapReturn {
    appContainer: Container,
    app: App
}

export const appBindings = new ContainerModule((bind: interfaces.Bind) => {
    bind<App>(TYPES.Application).to(App);
    bind<IExeptionFilter>(TYPES.ExeptionFilter).to(ExeptionFilter).inRequestScope();
    bind<ILogger>(TYPES.ILogger).to(LoggerService).inRequestScope();
    bind<PrismaService>(TYPES.PrismaService).to(PrismaService).inRequestScope();
    bind<IConfigService>(TYPES.ConfigService).to(ConfigService).inRequestScope();
    bind<UsersController>(TYPES.UsersController).to(UsersController).inRequestScope();
    bind<UsersServices>(TYPES.UsersServices).to(UsersServices).inRequestScope();
    bind<BoardsController>(TYPES.BoardsController).to(BoardsController).inRequestScope();
    bind<BoardsServices>(TYPES.BoardsServices).to(BoardsServices).inRequestScope();
    bind<ColumnsController>(TYPES.ColumnsController).to(ColumnsController).inRequestScope();
    bind<ColumnsServices>(TYPES.ColumnsServices).to(ColumnsServices).inRequestScope();
})

function bootstrap(): IBootstrapReturn {
    const appContainer = new Container();
    appContainer.load(appBindings);

    const app = appContainer.get<App>(TYPES.Application);
    app.init();
    return { appContainer, app };
}

export const { appContainer, app } = bootstrap();