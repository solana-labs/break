import {ITransactionsService, TransactionInfoService} from "./model";

import * as solanaWeb3 from '@solana/web3.js';
import {sendAndConfirmRecentTransaction} from '@solana/web3.js';

export default class TransactionsService implements ITransactionsService {
    account: any;
    connection: any;
    keypair: any;

    setConnection = async () => {
        const url = 'https://testnet.solana.com:8443';
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
        const {SystemProgram, Account} = solanaWeb3;
        const transactionInfo: TransactionInfoService = {
            signature: '',
            confirmationTime: 0,
            lamportsCount: 1000
        };

        try {
            this.keypair = new Account();

            const transaction = await SystemProgram.transfer(
                this.account.publicKey,
                //SYSVAR_RENT_PUBKEY,
                this.keypair.publicKey,
                transactionInfo.lamportsCount
            );


            const t1 = performance.now();
            const response = await this.connection.sendTransaction(transaction, this.keypair);
            const confirm = await this.connection.confirmTransaction(response)
            const t2 = performance.now();

            console.log(response)
            console.log('confirm', confirm)

            //sendAndConfirmRecentTransaction method
            const response2 = await solanaWeb3.sendAndConfirmRecentTransaction(this.connection, transaction, this.keypair)

            const time = parseFloat(((t2 - t1) / 1000).toFixed(3));

            transactionInfo.confirmationTime = time;
            transactionInfo.signature = response;

        } catch (e) {
            console.log('error - ', e);
        }

        return transactionInfo;
    };
}