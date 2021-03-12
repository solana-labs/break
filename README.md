## Break Solana Game [![Build Status](https://travis-ci.org/solana-labs/break.svg?branch=master)](https://travis-ci.org/solana-labs/break)

### How it works

The Break Solana Game consists of a 3 parts: a web client frontend, a web server backend, and an on-chain Solana program. The web server backend
is not strictly required but it helps with certain performance improvements.

At a basic level, the Break Solana Game allows a player to send simple smart contract transactions as fast as they can to showcase Solana's speed.
The web frontend is responsible for creating, sending, and confirming transactions and displays the status of each transaction in a colored grid.
The web backend helps out by acting as a fast relay for transactions. It will forward transactions directly to the TPU (transaction processing unit)
UDP port of the current cluster leader node (typically transactions are first sent to an RPC API node for forwarding). It also helps by creating a
supply of game accounts ahead of time to speed up game setup time (these accounts can be tracked across server restarts using Redis).

Rather than subscribing to each transaction signature, the web client subscribes to account data updates. Each transaction will set a bit in the state
within a Break program account, so each transaction can be uniquely identified by the bit it sets.

### Prerequisites

For running this application you need to have [NodeJs](https://nodejs.org/en/) and [NPM](https://www.npmjs.com/).
We recommend to use [NVM](https://github.com/creationix/nvm) for managing NodeJs versions
For NVM installation please refer to [manual](https://github.com/creationix/nvm#install--update-script)

### Install

```
npm install
```

### Run Server

_Note: If the cluster you connect to doesn't provide a faucet, you will need to supply the server with a payer key. (See 'Configuration' below)._

```
cd server

# Start local node
npm run localnet:up

# Connect to local node
npm run start:dev
```

_Note: It may be necessary to pull the required docker image if `npm run localnet:up` fails with the message `Unable to find image 'solanalabs/solana:edge' locally`. Run the below command if that is the case, then try again._ 
```
# Pull the docker image
docker pull solanalabs/solana:edge
```

#### Configuration

By default, the Break server will connect to a local node for RPC and will use a faucet to fund game play. To configure this behavior, set the following environment variables when running the server:

##### `PORT`

Set this option to specify the port for the API server. Default is 8080.

```
PORT=80 npm run start:dev
```

##### `RPC_URL`

Set this option to connect to a specific remote RPC API server.

```
RPC_URL=http://api.mainnet-beta.solana.com npm run start:dev
```

##### `LIVE`

Enable this option to connect to a remote cluster. The default cluster is devnet.

```
LIVE=true npm run start:dev
```

##### `CLUSTER`

Enable this option along with `LIVE=true` to connect to a specific remote cluster.

```
LIVE=true CLUSTER=devnet npm run start:dev
LIVE=true CLUSTER=testnet npm run start:dev
LIVE=true CLUSTER=mainnet-beta npm run start:dev
```

##### `ENCODED_PAYER_KEY`

Set this option if the chosen cluster doesn't provide a faucet. The provided key must be a Base64 encoded private key and it will be used to fund game play.

```
ENCODED_PAYER_KEY=<BASE64 ENCODED PRIVATE KEY> npm run start:dev
```

##### `ENCODED_PROGRAM_KEY`

Set this option to deploy the Break Solana program. The provided key must be a Base64 encoded private key and the corresponding public key will be used to store the executable program. If the program is already deployed, the existing program will be used.

```
ENCODED_PROGRAM_KEY=<BASE64 ENCODED PRIVATE KEY> npm run start:dev
```

##### `DEPLOYED_PROGRAM_ADDRESS`

Set this option to use an existing loaded Break Solana program rather than load a new version.  If the program doesn't exist, the server will exit with an error.

```
DEPLOYED_PROGRAM_ADDRESS=<BASE58 ENCODED ADDRESS> npm run start:dev
```

To use the Break Solana program that's used on https://break.solana.com, use the following address:
```
DEPLOYED_PROGRAM_ADDRESS=BrEAK7zGZ6dM71zUDACDqJnekihmwF15noTddWTsknjC npm run start:dev
```

##### `REQUIRE_PAYMENT`

Enable this option to require the user to cover transaction fees before playing the game.

```
REQUIRE_PAYMENT=true npm run start:dev
```

##### `SEND_TO_RPC`

Enable this option to send transactions to the RPC API rather than directly to a validator TPU port.

```
SEND_TO_RPC=true npm run start:dev
```

##### `CREATE_ACCOUNT_BATCH_SIZE`

Set this option to modify how the server refills its supply of game accounts. The default is 10 accounts per batch for local clusters and 2 accounts for remote clusters.

```
CREATE_ACCOUNT_BATCH_SIZE=10 npm run start:dev
```

##### `TX_PER_ACCOUNT`

Set this option to modify the max number of transactions a single Break program account can track for confirmation. Default is 1000 accounts. The Break app tracks transaction confirmations with a bit vector in the account state, the default configuration will result in 125 byte program accounts.

```
TX_PER_ACCOUNT=1000 npm run start:dev
```

### Run Client

```
cd client
npm run start
```

#### Configuration

Client behavior can be modified with the usage of url parameters.

##### `cluster`

Set this parameter to pick a remote cluster. This parameter is automatically set when using the UI cluster selector.

```
https://break.solana.com/game?cluster=devnet
```

##### `commitment`

Set this parameter to set the commitment level used for confirming transactions. Default is `'singleGossip'` but `'single'`
and `'recent'` are also supported.

```
https://break.solana.com/game?commitment=recent
```

##### `debug`

Set this parameter to enable "debug mode" which will display a table of confirmation times instead of the colored grid.

```
https://break.solana.com/game?debug
```

##### `retry`

Set this parameter to disable retrying transactions which have not yet been confirmed. Retry behavior is enabled by default because
some transactions will be forwarded to a leader who skips their block slot.

```
https://break.solana.com/game?retry=disabled
```

##### `split`

Set this parameter to split transactions across multiple payer and program accounts to increase transaction parallelization. Default is 4.

```
https://break.solana.com/game?split=1
```

##### `test`

Set this parameter to enable "test mode" which will automatically send approximately 33 transactions per second.

```
https://break.solana.com/game?test
```

## Built With

- [React](https://github.com/facebook/react/) - Framework
- [TypeScript](https://www.typescriptlang.org/) - Primary language
- [Torus](https://tor.us/) - Wallet Key Management
