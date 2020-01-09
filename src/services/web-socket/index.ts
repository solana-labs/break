import {IDefaultWebSocketService} from "./model";
import appStore from "../../store";
import {setTransactionsPerSecond} from "../../actions/set-transactions-per-second";
import {hostname} from "os";

const devUrl = 'ws://localhost:8080/transactions';
const stagingUrl = 'ws://break-backend.herokuapp.com/transactions';
const prodUrl = 'ws://break-backend-prod.herokuapp.com/transactions';

export default class DefaultWebSocketService implements IDefaultWebSocketService {

    private sockInstance: any = null;

    private isProduction = () => {
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

    async webSocket() {
        if (this.sockInstance) {
            this.sockInstance.close();
            this.sockInstance = null;
        }

        const url = this.isProduction();

        this.sockInstance = new WebSocket(url);

        this.sockInstance.onopen = () => {
            console.log('connection established.');
        };

        this.sockInstance.onmessage = (event: any) => {
            //console.log('ws - ', event.data);
            appStore.dispatch(setTransactionsPerSecond(+event.data))
        };

        this.sockInstance.onerror = (event: any) => {
            console.log('error - ', event.data);
        };

        this.sockInstance.onclose = () => {
            console.log('closing connection');
        };
    }

   async sendInfo(tps: number) {
        if (this.sockInstance) {
            //console.log('send - ', tps);
            this.sockInstance.send(tps);
        }
    }
}