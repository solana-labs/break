import {ITransactionsService, TransactionInfoService} from "./model";

const solanaWeb3 = require('@solana/web3.js');
import {Account} from '@solana/web3.js';

export default class TransactionsService implements ITransactionsService {
    account: any;
    connection: any;
    keypair: any;

    setConnection = async () => {
        const url = 'http://testnet.solana.com:8899';
        const {Account, Connection} = solanaWeb3;

        try {
            this.account = new Account(); // http://localhost:8899
            this.connection = new Connection(url);
            this.keypair = new Account();

        } catch (e) {
            console.log('error - ', e);
        }
    };

    makeTransaction = async (id: string) => {
        const {SystemProgram} = solanaWeb3;
        const transactionInfo: TransactionInfoService = {
            signature: '',
            confirmationTime: 0
        };

        try {
            const transaction = await SystemProgram.transfer(
              this.account.publicKey,
              //SYSVAR_RENT_PUBKEY,
              this.keypair.publicKey,
              50000
            );

            const t1 = performance.now();
            const response = await this.connection.sendTransaction(transaction, this.keypair);
            const t2 = performance.now();

            const time = parseFloat(((t2 - t1) / 1000).toFixed(3));

            transactionInfo.confirmationTime = time;
            transactionInfo.signature = response;

        } catch (e) {
            console.log('error - ', e);
        }

        return transactionInfo;
    };
}