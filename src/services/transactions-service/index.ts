import {ITransactionsService, TransactionInfoService} from "./model";

export default class TransactionsService implements ITransactionsService {

    makeTransaction = async (id: string) => {
        function randomTimeout() {
            const ms = Math.floor(Math.random() * (3000 - 100)) + 100;
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        const transactionInfo: TransactionInfoService = {
            description: `this is description of ${id} transaction`
        };

        await randomTimeout();

        return transactionInfo;
    };
}
