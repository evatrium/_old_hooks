import {
    copyDeep as deepCopy,
    getIn,
    getStateUpdate, isArray,
    isFunc,
    isObj,
    isString,
    setIn, isEqual, deepMerge,
} from "@iosio/util";
import {useEffect, useState} from "react";
import {useIsMounted} from "./hooks";


const isNotEqual = (a, b) => !isEqual(a, b);

export const createState = (state = {}, {
    merger = deepMerge,
    selectorShouldUpdate = isNotEqual,
    onChange
} = {}) => {

    const originalState = deepCopy(state);
    state = deepCopy(state);

    let listeners = [];

    let prevState = {...state};

    const getState = () => state;

    const reset = ({initialState, ignoreNotify = false,} = {}) => {
        const nextState = deepCopy(initialState || originalState);
        setState(nextState, ignoreNotify);
    };

    const unsubscribe = f => {
        listeners = listeners.filter(l => l !== f);
    };

    const subscribe = f => {
        listeners.push(f);
        return () => unsubscribe(f);
    };

    const notify = () => {
        for (let l in listeners) listeners[l](state, prevState);
    };

    const _setState = (next) => {
        prevState = state;
        state = next;
        onChange && onChange(state, prevState);
    };

    const setState = (updater, ignoreNotify = false,) => {
        const copyToMutate = deepCopy(state);
        const nextState = getStateUpdate(updater, copyToMutate);
        _setState(nextState);
        if (!ignoreNotify) notify();
    };

    const mergeState = (updater, ignoreNotify = false) => {
        const copyToMutate = deepCopy(state);
        const update = getStateUpdate(updater, copyToMutate);
        const nextState = merger(copyToMutate, update);
        _setState(nextState)
        if (!ignoreNotify) notify();
    };

    const select = (selector, copyToMutate) => {
        copyToMutate = copyToMutate || deepCopy(copyToMutate || state);
        if (!selector) return copyToMutate;
        if (isFunc(selector)) return selector(copyToMutate);
        if (isObj(selector)) {
            let out = {};
            for (let key in selector) out[key] = select(selector[key], copyToMutate);
            return out;
        }
        if (isArray(selector)) return selector.map(s => select(s, copyToMutate));
        if (isString(selector)) {
            let possibleMany = selector.split(',').map(s => s.trim()).filter(Boolean);
            if (possibleMany.length > 1) return select(possibleMany, copyToMutate);
            return getIn(copyToMutate, possibleMany[0], copyToMutate);
        }
    };

    const _setInState = (copyToMutate, path, updater) => {
        let branchUpdate = updater;
        if (isFunc(updater)) branchUpdate = updater(getIn(state, path, state));
        return setIn(copyToMutate, path, branchUpdate);
    };

    const setInPath = (path, updater, ignoreNotify = false) => {
        let copyToMutate = deepCopy(state);
        // let originalCopyOfState = deepCopy(state);
        if (isFunc(path)) path = path(copyToMutate);
        if (isString(path)) copyToMutate = _setInState(copyToMutate, path, updater);
        if (isObj(path)) for (let key in path) copyToMutate = _setInState(copyToMutate, key, path[key]);
        _setState(copyToMutate);
        if (!ignoreNotify) notify();
    };

    Object.assign(mergeState, {setInPath, setState, mergeState});

    const subscribeToSelection = (selector, cb, {shouldUpdate = selectorShouldUpdate} = {}) => {
        const listener = (newState, prev) => {
            const prevState = selector ? select(selector, prev) : prev;
            const nextState = selector ? select(selector, newState) : newState
            if (shouldUpdate(prevState, nextState)) cb(nextState, prevState);
        };
        return subscribe(listener);
    }

    const useSelector = (selector, {shouldUpdate = selectorShouldUpdate} = {}) => {
        const mountedState = useIsMounted();
        const [value, setValue] = useState(() => select(selector, state));
        const set = x => mountedState.current && setValue(x);
        useEffect(() => subscribeToSelection(selector, set, {shouldUpdate}), []);
        return [value, mergeState]; //destructure for more options: [value, {mergeState, setInPath, setState}]
    };

    return {
        select,
        subscribeToSelection,
        subscribe, unsubscribe,
        notify,
        getState, setState, mergeState, setInPath,
        useSelector,
        reset,
        deepMerge
    }
}