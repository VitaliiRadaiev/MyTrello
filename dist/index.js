"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.appContainer = exports.appBindings = void 0;
const inversify_1 = require("inversify");
const app_1 = require("./app");
const types_1 = require("./types");
const prisma_service_1 = require("./database/prisma.service");
const logger_service_1 = require("./logger/logger.service");
const exeption_filter_1 = require("./errors/exeption.filter");
const config_service_1 = require("./config/config.service");
const users_controller_1 = require("./users/users.controller");
const users_services_1 = require("./users/users.services");
const boards_controller_1 = require("./boards/boards.controller");
const boards_services_1 = require("./boards/boards.services");
const columns_controller_1 = require("./columns/columns.controller");
const columns_services_1 = require("./columns/columns.services");
const cards_controller_1 = require("./cards/cards.controller");
const cards_services_1 = require("./cards/cards.services");
const websocket_1 = require("./websocket/websocket");
const ws_sender_1 = require("./websocket/ws.sender");
const ws_clients_1 = require("./websocket/ws.clients");
exports.appBindings = new inversify_1.ContainerModule((bind) => {
    bind(types_1.TYPES.Application).to(app_1.App);
    bind(types_1.TYPES.ExeptionFilter).to(exeption_filter_1.ExeptionFilter).inRequestScope();
    bind(types_1.TYPES.ILogger).to(logger_service_1.LoggerService).inRequestScope();
    bind(types_1.TYPES.PrismaService).to(prisma_service_1.PrismaService).inRequestScope();
    bind(types_1.TYPES.ConfigService).to(config_service_1.ConfigService).inRequestScope();
    bind(types_1.TYPES.UsersController).to(users_controller_1.UsersController).inRequestScope();
    bind(types_1.TYPES.UsersServices).to(users_services_1.UsersServices).inRequestScope();
    bind(types_1.TYPES.BoardsController).to(boards_controller_1.BoardsController).inRequestScope();
    bind(types_1.TYPES.BoardsServices).to(boards_services_1.BoardsServices).inRequestScope();
    bind(types_1.TYPES.ColumnsController).to(columns_controller_1.ColumnsController).inRequestScope();
    bind(types_1.TYPES.ColumnsServices).to(columns_services_1.ColumnsServices).inRequestScope();
    bind(types_1.TYPES.CardsController).to(cards_controller_1.CardsController).inRequestScope();
    bind(types_1.TYPES.CardsServices).to(cards_services_1.CardsServices).inRequestScope();
    bind(types_1.TYPES.Websocket).to(websocket_1.Websocket).inRequestScope();
    bind(types_1.TYPES.WsSender).to(ws_sender_1.WsSender).inRequestScope();
    bind(types_1.TYPES.WsClients).to(ws_clients_1.WsClients).inSingletonScope();
});
function bootstrap() {
    const appContainer = new inversify_1.Container();
    appContainer.load(exports.appBindings);
    const app = appContainer.get(types_1.TYPES.Application);
    app.init();
    return { appContainer, app };
}
_a = bootstrap(), exports.appContainer = _a.appContainer, exports.app = _a.app;
//# sourceMappingURL=index.js.map