import {useRef, useCallback, useMemo} from 'react';
import {useDeepEqualEffect, useIsMounted, useMergeState, useUpdatedRef, useWillUnmount} from "./hooks";
import {createState} from './createState';
import {getStateUpdate, isFunc} from "@iosio/util";

export const asyncStateTemplate = (next = {}) => ({
    pending: false,
    initialPending: false,
    refreshing: false,
    cache: undefined,
    data: undefined,
    cacheThenData: undefined,
    error: undefined,
    completed: false,
    lastRefreshDate: undefined,
    ...next
});

export const pendingAsyncState = ({cache, lastRefreshDate, keepCacheOnData} = {}) =>
    asyncStateTemplate({
        pending: true,
        initialPending: !!!cache,
        refreshing: !!cache,
        data: keepCacheOnData ? cache : undefined,
        lastRefreshDate,
        cache,
        cacheThenData: cache,
        error: undefined,
        completed: false
    });

export const successAsyncState = ({data, lastRefreshDate} = {}) =>
    asyncStateTemplate({
        data,
        cache: data,
        lastRefreshDate,
        cacheThenData: data,
        completed: true,
    });

export const failAsyncState = ({error, cache} = {}) =>
    asyncStateTemplate({
        error,
        cache,
        cacheThenData: cache,
        completed: true,
    });


export const AsyncState = (
    asyncFunc,
    {
        formatter = (data, args) => data,
        formatError = (error, args) => error,
        stateOptions = {},
        singleLifeCycle,
    } = {}) => {

    let _asyncFunc = asyncFunc;

    const store = createState({}, stateOptions);

    const {
        reset,
        getState,
        mergeState,
        subscribe
    } = store;

    // -------------------------------------

    const _getSet = async ({args, argsKey, formatter: altFormatter, formatError: altFormatError} = {}) => {
        altFormatter = altFormatter || formatter;
        altFormatError = altFormatError || formatError;
        argsKey = argsKey || JSON.stringify(args);
        const prevState = getState();
        const current = prevState[argsKey] || asyncStateTemplate();
        const {cache, lastRefreshDate} = current; // items to persist through the lifecycle
        mergeState({
            [argsKey]: pendingAsyncState({
                cache,
                lastRefreshDate
            })
        });

        try {
            let results = await _asyncFunc(...args);
            let data = await altFormatter(results, args);
            mergeState({
                [argsKey]: successAsyncState({
                    data,
                    lastRefreshDate: Date.now()
                })
            });
            return {data}
        } catch (error) {
            mergeState({
                [argsKey]: failAsyncState({
                    error: altFormatError(error, args),
                    cache,
                    lastRefreshDate
                })
            });
            return {error}
        }
    }

    // -------------------------------------

    const getSet = (...args) => _getSet({args});

    // -------------------------------------
    const ARGS_ARRAY = [];

    const use = ({immediate, args: altArgs = ARGS_ARRAY, If, formatter, formatError} = {}) => {
        const mountedRef = useIsMounted();
        const argsKeyRef = useRef(JSON.stringify(altArgs));
        const [localState, mergeLocal] = useMergeState(() => {
            let state = getState()[argsKeyRef.current] || asyncStateTemplate();
            if (immediate) state = pendingAsyncState(state);

            // silently initialize the state ????
            mergeState(
                {[argsKeyRef.current]: state},
                // true // ignore notify
            );
            return state;
        });

        const localStateRef = useUpdatedRef(localState);
        const unsubscribeRef = useRef(() => 0);
        const listenerRef = useRef();

        const mergeLocalState = useCallback((update) => {
            mountedRef.current && mergeLocal((prev) => {
                const next = getStateUpdate(update, prev);
                localStateRef.current = next;
                return next;
            });
        }, []);

        const initialize = useCallback(() => {
            unsubscribeRef.current && unsubscribeRef.current();
            listenerRef.current = newState => {
                const next = newState[argsKeyRef.current];
                const prev = localStateRef.current;
                for (let key in next) {
                    if (next[key] !== prev[key]) {
                        mergeLocalState(next);
                        break;
                    } //end if
                }//end for
            }//listener
            unsubscribeRef.current = subscribe(listenerRef.current);
        }, []);

        const execute = useCallback(async (...args) => {
            const argsKey = JSON.stringify(args);
            if (argsKeyRef.current !== argsKey) {
                argsKeyRef.current = argsKey;
                initialize();
            }
            return _getSet({argsKey, args, formatter, formatError});
        }, []);

        useMemo(initialize, []); //run on initial render only before mount

        useWillUnmount(() => {
            unsubscribeRef.current && unsubscribeRef.current();
        });

        useDeepEqualEffect(() => {
            if (immediate) isFunc(If) ? If(...altArgs) && execute(...altArgs) : execute(...altArgs);
        }, altArgs);

        // const executeEffectRef = useRef((...args) => {
        //     useDeepEqualEffect(() => {
        //         isFunc(If) ? If(...args) && execute(...args) : execute(...args);
        //     }, args);
        // });
        //
        // const useExecuteEffect = executeEffectRef.current;

        const useExecuteEffect = (...args) => {
            useDeepEqualEffect(() => {
                isFunc(If) ? If(...args) && execute(...args) : execute(...args);
            }, args);
        };

        return [localState, {execute, useExecuteEffect, mergeLocalState}];

    }; // use

    // -------------------------------------

    const setAsyncFunc = f => (_asyncFunc = f);

    // -------------------------------------

    const instance = {
        getSet,
        use,
        reset,
        setAsyncFunc,
        store,
    };

    !singleLifeCycle && AsyncState.allInstances.push(instance);

    return instance
};

AsyncState.allInstances = [];
AsyncState.resetAllInstances = () => AsyncState.allInstances.forEach(i => i.reset());


export const useAsyncState = (fn, {asyncFuncUpdates, ...options} = {}) => {
    const instance = useMemo(() => AsyncState(fn, {singleLifeCycle: true, ...options}), []);
    useMemo(() => asyncFuncUpdates && instance.setAsyncFunc(fn), [fn]);
    return instance.use();
}

