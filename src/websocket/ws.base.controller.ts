import { WsRouts } from "./ws.routs";
import { IWsRout } from "./ws.types";

export abstract class WsBaseController {
    private readonly _wsRouts: WsRouts;

    constructor() {
        this._wsRouts = WsRouts.get();
    }

    protected addRouts(routs: IWsRout[]) {
        this._wsRouts.addRouts(routs);
    }
}