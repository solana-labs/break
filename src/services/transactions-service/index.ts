import {ITransactionsService, TransactionServiceInfo} from "./model";
import * as w3 from '@solana/web3.js';
import {sendAndConfirmRecentTransaction} from '@solana/web3.js';


export default class TransactionsService implements ITransactionsService {
    account?: w3.Account;
    connection = new w3.Connection('http://testnet.solana.com:8899/', 'recent');

    async initialize(): Promise<void> {
        let secretKey;
        const secretKeyString = localStorage.getItem('secretKey');
        if (!secretKeyString) {
            const account = new w3.Account();
            secretKey = account.secretKey;
            localStorage.setItem('secretKey', secretKey.toString());
            await this.connection.requestAirdrop(account.publicKey, 100000000000);
        } else {
            secretKey = Buffer.from(secretKeyString);
        }

        this.account = new w3.Account(secretKey);
        const balance = await this.connection.getBalance(this.account.publicKey);
        console.log('balance - ', balance);
    };

    makeTransaction = async (id: number): Promise<TransactionServiceInfo> => {
        if (!this.account) {
            throw new Error('Account not initialized');
        }

        const keypair = new w3.Account();
        const lamportsCount = id + 1;
        const transaction = w3.SystemProgram.transfer(
            this.account.publicKey,
            keypair.publicKey,
            lamportsCount,
        );

        const t1 = performance.now();
        const signature = await sendAndConfirmRecentTransaction(this.connection, transaction, this.account);
        const t2 = performance.now();
        const confirmationTime = parseFloat(((t2 - t1) / 1000).toFixed(3));

        return {
            signature,
            confirmationTime,
            lamportsCount,
        };
    };
}