import {Maybe} from "../../toolbox/custom-types";

namespace ITransaction {
    export interface Model {
        id: string
        status: string
        info: TransactionInfo
    }

    export interface TransactionInfo {
        description: string
    }

    export interface ModelState {
        transactions: Model[]
    }
}

export default ITransaction;