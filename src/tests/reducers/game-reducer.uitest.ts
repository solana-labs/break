import gameReducer from "../../reducers/game";

describe('test function gameReducer', () => {
    it('set status game', () => {
        const expectedState = {
            status: 'started',
            statistics: {
                totalCount: 0,
                completedCount: 0,
                percentCapacity: 0
            }
        };

        const action = {
            payload: 'started',
            type: 'SET_STATUS_GAME',
        };

        const result = gameReducer(undefined, action);

        expect(result).toEqual(expectedState);
    });

    it('set status game - 2', () => {
        const initState = {
            status: 'started',
            statistics: {
                totalCount: 10,
                completedCount: 9,
                percentCapacity: 0.0001
            }
        };

        const expectedState = {
            status: 'finished',
            statistics: {
                totalCount: 10,
                completedCount: 9,
                percentCapacity: 0.0001
            }
        };

        const action = {
            payload: 'finished',
            type: 'SET_STATUS_GAME',
        };

        const result = gameReducer(initState, action);

        expect(result).toEqual(expectedState);
    });

    it('set statistics game', () => {
        const expectedState = {
            status: 'unstarted',
            statistics: {
                totalCount: 10,
                completedCount: 10,
                percentCapacity: 0.0002
            }
        };

        const action = {
            payload: {
                totalCount: 10,
                completedCount: 10,
                percentCapacity: 0.0002
            },
            type: 'SET_STATISTICS_GAME',
        };

        const result = gameReducer(undefined, action);

        expect(result).toEqual(expectedState);
    });

    it('set statistics game - 2', () => {
        const initState = {
            status: 'started',
            statistics: {
                totalCount: 0,
                completedCount: 0,
                percentCapacity: 0
            }
        };

        const expectedState = {
            status: 'started',
            statistics: {
                totalCount: 10,
                completedCount: 10,
                percentCapacity: 0.0002
            }
        };

        const action = {
            payload: {
                totalCount: 10,
                completedCount: 10,
                percentCapacity: 0.0002
            },
            type: 'SET_STATISTICS_GAME',
        };

        const result = gameReducer(initState, action);

        expect(result).toEqual(expectedState);
    });

    it('reset statistics game', () => {
        const expectedState = {
            status: 'unstarted',
            statistics: {
                totalCount: 0,
                completedCount: 0,
                percentCapacity: 0
            }
        };

        const action = {
            type: 'RESET_STATISTICS_GAME',
        };

        const result = gameReducer(undefined, action);

        expect(result).toEqual(expectedState);
    });

    it('reset statistics game - 2', () => {
        const initState = {
            status: 'started',
            statistics: {
                totalCount: 100,
                completedCount: 100,
                percentCapacity: 0.001
            }
        };

        const expectedState = {
            status: 'unstarted',
            statistics: {
                totalCount: 0,
                completedCount: 0,
                percentCapacity: 0
            }
        };

        const action = {
            type: 'RESET_STATISTICS_GAME',
        };

        const result = gameReducer(initState, action);

        expect(result).toEqual(expectedState);
    });

    it('test with invalid action', () => {
        const expectedState = {
            status: 'unstarted',
            statistics: {
                totalCount: 0,
                completedCount: 0,
                percentCapacity: 0
            }
        };

        const action = {
            type: 'INVALID',
        };

        const result = gameReducer(undefined, action);

        expect(result).toEqual(expectedState);
    });

    it('test with invalid action - 2', () => {
        const initState = {
            status: 'started',
            statistics: {
                totalCount: 100,
                completedCount: 100,
                percentCapacity: 0.001
            }
        };

        const action = {
            type: 'INVALID',
        };

        const result = gameReducer(initState, action);

        expect(result).toEqual(initState);
    });
});