## Break Solana Game [![Build Status](https://travis-ci.org/solana-labs/break.svg?branch=master)](https://travis-ci.org/solana-labs/break)

### Prerequisites

For running this application you need to have [NodeJs](https://nodejs.org/en/) and [NPM](https://www.npmjs.com/).
We recommend to use [NVM](https://github.com/creationix/nvm) for managing NodeJs versions
For NVM installation please refer to [manual](https://github.com/creationix/nvm#install--update-script)

### Install

```
npm install
```

### Run Server

```
cd server

# Connect to local node
npm run start:dev

# Connect to specific node
RPC_URL=http://x.x.x.x npm run start:dev

# Connect to devnet cluster
LIVE=1 npm run start:dev

# Connect to testnet cluster
ENCODED_PAYER_KEY=(base 58 encoded key) CLUSTER=testnet LIVE=1 npm run start:dev
```

### Run Client

```
cd client
npm run start
```

## Built With

- [React.js](https://github.com/facebook/react/) - Component Library
- [TypeScript](https://www.typescriptlang.org/) - Primary language
- [Redux](https://github.com/reduxjs/react-redux) - State management library
