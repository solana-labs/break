import {ITransactionsService, TransactionInfoService} from "./model";
import * as solanaWeb3 from '@solana/web3.js';
import {sendAndConfirmRecentTransaction} from '@solana/web3.js';
import {setStatusLoader} from "../../actions/set-status-loader";

export default class TransactionsService implements ITransactionsService {
    account: any;
    connection: any;
    keypair: any;
    secretKey: any;

    setConnection = async () => {
        const url = 'https://testnet.solana.com:8443';
        //const url = 'https://testnet.solana.com:8899';
        const {Account, Connection} = solanaWeb3;

        try {
            this.connection = new Connection(url);

            let secKey = localStorage.getItem('secretKey2');


            if (!secKey) {
                const account = await new Account();
                secKey = account._keypair.secretKey;

                localStorage.setItem('secretKey2', JSON.stringify(secKey));

                this.secretKey = secKey;

                await this.connection.requestAirdrop(account.publicKey, 100000000000); // about 8 - 10 sec
            } else {
                this.secretKey = JSON.parse(secKey);
            }

            const secretKeyObj = this.secretKey;
            const bufferArray = Object.keys(secretKeyObj).map(function(key) {
                return secretKeyObj[key];
            });

            this.account = new Account(new Uint8Array(bufferArray));
        } catch (e) {
            console.log('error - ', e);
        }
    };

    makeTransaction = async (id: number) => {
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
                this.keypair.publicKey,
                transactionInfo.lamportsCount
            );

            const t1 = performance.now();
            const response = await sendAndConfirmRecentTransaction(this.connection, transaction, this.account);
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