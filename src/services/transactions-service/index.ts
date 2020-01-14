import {ITransactionsService, TransactionInfoService} from "./model";
import * as solanaWeb3 from '@solana/web3.js';
import {sendAndConfirmRecentTransaction} from '@solana/web3.js';


export default class TransactionsService implements ITransactionsService {
    account: any;
    keypair: any;
    secretKey: any;
    connectionArray: any;

    checkBlockHash = async (connection: any) => {
        const blockHash = await connection.getRecentBlockhash();
        const blockHash2 = await connection.getRecentBlockhash();

        // checking if it is possible to get a new blockHash
        if(blockHash[0] !== blockHash2[0]){
            // if it's valid url connection
            this.connectionArray.push(connection);
        }
    };

    setConnection = async () => {
        const {Account, Connection} = solanaWeb3;

        try {
            const connection = new Connection('https://testnet.solana.com:8443/');
            const clusterNodes = await connection.getClusterNodes();

            this.connectionArray = [];

            clusterNodes.forEach((obj: any) => {
                const connection = new Connection(`http://${obj.rpc}`);
                this.checkBlockHash(connection);
            });

            let secKey = localStorage.getItem('secretKey');

            if (!secKey) {
                const account = await new Account();
                secKey = account._keypair.secretKey;

                localStorage.setItem('secretKey', JSON.stringify(secKey));

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

            const balance = await connection.getBalance(this.account.publicKey);
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

        const index = id % this.connectionArray.length; // get index of rpc array
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