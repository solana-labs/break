import {ITransactionsService, TransactionInfoService} from "./model";
import * as solanaWeb3 from '@solana/web3.js';
import {sendAndConfirmRecentTransaction} from '@solana/web3.js';

const arrayRpcAddress = [
    '34.83.146.144:8899',
    '34.83.236.72:8899',
    '104.199.124.4:8899',
    '34.82.125.134:8899',
    '34.82.69.78:8899',
    '18.209.228.98:8899',
    '89.42.234.59:8899',
    '89.42.234.25:8899',
];

export default class TransactionsService implements ITransactionsService {
    account: any;
    keypair: any;
    secretKey: any;
    connectionArray: any;

    setConnection = async () => {
        const {Account, Connection} = solanaWeb3;

        try {
            this.connectionArray = [];

            arrayRpcAddress.forEach((rpc: string, index: number) => {
                this.connectionArray[index] = new Connection(`http://${rpc}`);
            });

            let secKey = localStorage.getItem('secretKey4');

            if (!secKey) {
                const account = await new Account();
                secKey = account._keypair.secretKey;

                localStorage.setItem('secretKey4', JSON.stringify(secKey));

                this.secretKey = secKey;

                await this.connectionArray[0].requestAirdrop(account.publicKey, 100000000000); // about 8 - 10 sec
            } else {
                this.secretKey = JSON.parse(secKey);
            }

            const secretKeyObj = this.secretKey;
            const bufferArray = Object.keys(secretKeyObj).map(function(key) {
                return secretKeyObj[key];
            });

            this.account = new Account(new Uint8Array(bufferArray));

            const balance = await this.connectionArray[0].getBalance(this.account.publicKey);
            //console.log('balance - ', balance);

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

        const index = id % arrayRpcAddress.length; // get index of rpc array
        const connection = this.connectionArray[index];

        this.keypair = new Account();

        const transaction = await SystemProgram.transfer(
            this.account.publicKey,
            this.keypair.publicKey,
            transactionInfo.lamportsCount
        );

        const t1 = performance.now();
        const response = await sendAndConfirmRecentTransaction(connection, transaction, this.account);
        const t2 = performance.now();

        const time = parseFloat(((t2 - t1) / 1000).toFixed(3));

        transactionInfo.confirmationTime = time;
        transactionInfo.signature = response;

        return transactionInfo;
    };
}