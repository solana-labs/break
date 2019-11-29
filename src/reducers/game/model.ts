namespace IGame {
    export interface ModelStatistics {
        totalCount: number
        percentCapacity: number
    }

    export interface ModelState {
        status: string
        statistics: ModelStatistics
    }
}

export default IGame;