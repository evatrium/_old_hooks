import {
    CreateLocalStore,
    deepCopy,
    getIn,
    getStateUpdate,
    isFunc,
    isObj,
    isString,
    jsonParse, propsChanged,
    setIn
} from "@iosio/util";
import {useEffect, useState} from "react";
import {useIsMounted, shallowMerger} from "./hooks";


export const createState = (state = {}, {merger = shallowMerger, persist, onChange} = {}) => {

    const originalState = deepCopy(state);
    state = deepCopy(state);

    let storage;
    let {persistor, debounceSet, key: storageKey, namespace} = persist || {};
    let unsubscribeStorage = () => 0;
    let resetting = false;

    const isPersisted = isObj(persist) && isString(storageKey);

    const onStorageChange = ({storageArea, key, newValue} = {}) => {
        if (resetting) return;
        if (storageArea === localStorage && key === storageKey) {
            const oldValue = JSON.stringify(state);
            if (oldValue !== newValue) {
                const {data} = jsonParse(newValue);
                setState(data || originalState);
            }
        }
    };

    const subscribeStorage = () => {
        unsubscribeStorage();
        unsubscribeStorage = storage?.subscribe ? storage?.subscribe(onStorageChange) : () => 0;
    }

    if (isPersisted) {
        storage = persistor || CreateLocalStore({namespace: namespace || '', debounceSet: debounceSet || 200});
        const stored = storage.getItem(storageKey);
        if (isObj(stored)) state = stored;
        subscribeStorage();
    }

    const clearStorage = () => storage.removeItem(storageKey);

    let listeners = [];

    let prevState = {...(isFunc(state) ? state() : state)};

    const getState = () => state;

    const reset = (
        {
            initialState,
            clearStorage: clear = true,
            ignoreNotify = false,
            unsubscribeStorage: unsub
        } = {}) => {
        resetting = true;
        isPersisted && unsub && unsubscribeStorage();
        const nextState = initialState ? deepCopy(initialState) : deepCopy(originalState);
        isPersisted && clear && clearStorage();
        setState(nextState, ignoreNotify);
        resetting = false;
    };


    const unsubscribe = f => {
        listeners = listeners.filter(l => l !== f);
    };

    const subscribe = f => {
        listeners.push(f);
        return () => unsubscribe(f);
    };

    const notify = () => {
        for (let l in listeners) listeners[l](state, prevState)
    };

    const _setState = (next) => {
        prevState = {...state};
        isPersisted && !resetting && storage.setItemDebounced(storageKey, next);
        state = next;
        onChange && onChange(next, prevState);
    };

    const setState = (updater, ignoreNotify = false) => {
        const nextState = getStateUpdate(updater, state);
        _setState(nextState);
        if (!ignoreNotify) notify();
    };

    const mergeState = (updater, ignoreNotify = false) => {
        setState(merger(state, getStateUpdate(updater, state)), ignoreNotify);
    };

    const select = (selector, state = getState()) => {
        if (isFunc(selector)) return select(selector(state), state);
        if (isObj(selector)) {
            let out = {};
            for (let key in selector) out[key] = select(selector[key], state);
            return out;
        }
        if (isString(selector)) return getIn(state, selector, state)
    };

    const setInState = (nextState, path, updater) => {
        let branchUpdate = updater;
        if (isFunc(updater)) branchUpdate = updater(getIn(state, path, state));
        return setIn(nextState, path, branchUpdate);
    };

    const mergeInPath = (path, updater, ignoreNotify = false) => {
        let nextState = {...state};
        if (isFunc(path)) path = path(nextState);
        if (isString(path)) nextState = setInState(path, updater, nextState);
        if (isObj(path)) for (let key in path) nextState = setInState(nextState, key, path[key]);
        setState(nextState, ignoreNotify);
    };

    Object.assign(mergeState, {
        mergeInPath,
        setState,
        mergeState
    });

    const useSelector = (selector = x => x, {shouldUpdate = propsChanged} = {}) => {
        const mountedState = useIsMounted();
        const [value, setValue] = useState(() => select(selector, state));
        useEffect(() => {
            const listener = (newState, prev) => {
                if (!mountedState.current) return;
                const prevState = select(selector, prev);
                const nextState = select(selector, newState);
                if (isString(selector)) (prevState !== nextState) && setValue(nextState);
                else if (shouldUpdate(prevState, nextState)) setValue(nextState);
            };
            return subscribe(listener);
        }, []);
        return [value, mergeState]; //destructure for more options [value, {mergeState, mergeInPath, setState}]
    };

    const methods = {
        select,
        subscribe, unsubscribe, notify,
        getState, setState, mergeState, mergeInPath,
        useSelector,
        reset,
        subscribeStorage, unsubscribeStorage, clearStorage
    };

    const createProviderAndHook = (additionalMethods = {}) => {

        const value = Object.assign(methods, additionalMethods);

        const StateContext = createContext(value);

        const useStateContext = () => useContext(StateContext);

        const StateProvider = ({children}) => (
            <StateContext.Provider value={value}>
                {children}
            </StateContext.Provider>
        );

        return [StateProvider, useStateContext]
    };

    const [StateProvider, useStateContext] = createProviderAndHook();

    return {
        ...methods,
        createProviderAndHook,
        StateProvider,
        useStateContext
    }
}