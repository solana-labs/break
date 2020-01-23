import {IDefaultWebSocketService} from "./model";
import appStore from "../../store";
import {setTransactionsPerSecond} from "../../actions/set-transactions-per-second";

const devUrl = 'ws://localhost:8080/transactions';
const stagingUrl = 'wss://break-backend.herokuapp.com/transactions';
const prodUrl = 'wss://break-backend-prod.herokuapp.com/transactions';

export default class DefaultWebSocketService implements IDefaultWebSocketService {

    private sockInstance?: WebSocket;

    private isProduction = (): string => {
        switch(process.env.NODE_ENV) {
            case 'development':
                return devUrl;
            case 'production':
                if(location.hostname.match('staging')) {
                    return stagingUrl;
                } else {
                    return prodUrl;
                }
            default:
                return '';
        }
    };

    async webSocket(): Promise<void> {
        if (this.sockInstance) {
            this.sockInstance.close();
            this.sockInstance = undefined;
        }

        const url = this.isProduction();

        this.sockInstance = new WebSocket(url);

        this.sockInstance.onopen = () => {
            console.log('connection established.');
        };

        this.sockInstance.onmessage = (event: any) => {
            appStore.dispatch(setTransactionsPerSecond(+event.data))
        };

        this.sockInstance.onerror = (event: any) => {
            console.log('error - ', event.data);
        };

        this.sockInstance.onclose = () => {
            console.log('closing connection');
        };
    }

   async sendInfo(tps: number): Promise<void> {
        if (this.sockInstance) {
            this.sockInstance.send(tps);
        }
    }
}