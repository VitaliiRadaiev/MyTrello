import { Response, Router } from 'express';
import { injectable } from 'inversify';
import { ExpressReturnType, IControllerRoute } from './route.interface';
import { ILogger } from '../logger/logger.interface';
import 'reflect-metadata';

@injectable()
export abstract class BaseController {
    private readonly _router: Router;

    constructor(private logger: ILogger) {
        this._router = Router();
    }

    get router(): Router {
        return this._router;
    }

    public send(res: Response, code: number, body: object): ExpressReturnType {
		res.type('application/json');
		return res.status(code).json(body);
	}

	public ok(res: Response, data?: object): ExpressReturnType {
		return this.send(res, 200, { resultCode: 0, data });
	}

	public created(res: Response): ExpressReturnType {
		return res.sendStatus(201);
	}

	public error<T>(res: Response, code: number, message: T): ExpressReturnType {
		return this.send(res, code, { resultCode: 1, message });
	}

	protected bindRoutes(routes: IControllerRoute[]): void {
		for (const route of routes) {
			this.logger.log(`[${route.method}] ${route.path}`);
			const middleware = route.middlewares?.map((m) => m.execute.bind(m));
			const handler = route.func.bind(this);
			const pipeline = middleware ? [...middleware, handler] : handler;
			this.router[route.method](route.path, pipeline);
		}
	}
}