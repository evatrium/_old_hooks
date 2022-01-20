// import {
//     CreateLocalStore,
//     copyDeep as deepCopy,
//     getIn,
//     getStateUpdate, isArray,
//     isFunc,
//     isObj,
//     isString,
//     jsonParse,
//     setIn, isEqual, deepMerge,
//     isObject, isPrimitive
// } from "@iosio/util";
// import {useEffect, useState} from "react";
// import {useIsMounted} from "./hooks";
//
//
// const isNotEqual = (a, b) => !isEqual(a, b);
//
// export const hydrateFunctions = (target, source) => {
//     if (isPrimitive(target) || isPrimitive(source)) {
//         return source;
//     }
//     for (const key in source) {
//         const targetValue = target[key];
//         const sourceValue = source[key];
//
//         const bothAreObjectsOrBothAreArrays =
//             (isObject(targetValue) && isObject(sourceValue))
//             || (isArray(targetValue) && isArray(sourceValue));
//
//         if (bothAreObjectsOrBothAreArrays) {
//             target[key] = deepMerge(targetValue, sourceValue);
//         } else if (isFunc(sourceValue)) {
//             target[key] = sourceValue
//         }
//     }
//
//     return target;
// }
//
// export const createState = (state = {}, {
//     merger = deepMerge,
//     selectorShouldUpdate = isNotEqual,
//     persist,
//     onChange
// } = {}) => {
//
//     const originalState = deepCopy(state);
//     state = deepCopy(state);
//
//     let storage;
//     let {persistor, debounceSet, key: storageKey, namespace} = persist || {};
//     let unsubscribeStorage = () => 0;
//     let resetting = false;
//
//     const isPersisted = isObj(persist) && isString(storageKey);
//
//     const onStorageChange = ({storageArea, key, newValue} = {}) => {
//         if (resetting) return;
//         if (storageArea === localStorage && key === storageKey) {
//             const oldValue = JSON.stringify(state);
//             if (oldValue !== newValue) {
//                 let {data} = jsonParse(newValue);
//                 console.log({newValue: data})
//                 // data = isObj(data) && hydrateFunctions(data, originalState);
//                 setState(data && hydrateFunctions(data, originalState) || originalState);
//             } else {
//                 console.log('value is the same');
//             }
//         }
//     };
//
//     const subscribeStorage = () => {
//         unsubscribeStorage();
//         unsubscribeStorage = storage?.subscribe ? storage?.subscribe(onStorageChange) : () => 0;
//     }
//
//     if (isPersisted) {
//         storage = persistor || CreateLocalStore({
//             namespace: namespace || '',
//             // debounceSet: debounceSet || 200
//             debounceSet: 0
//         });
//         const stored = storage.getItem(storageKey);
//         if (isObj(stored)) state = hydrateFunctions(stored, originalState);
//         subscribeStorage();
//     }
//
//     const clearStorageKey = () => storage.removeItem(storageKey);
//
//     let listeners = [];
//
//     let prevState = {...state};
//
//     const getState = () => state;
//
//     const reset = (
//         {
//             initialState,
//             clearStorageKey: clear = true,
//             ignoreNotify = false,
//             unsubscribeStorage: unsub
//         } = {}) => {
//         resetting = true;
//         isPersisted && unsub && unsubscribeStorage();
//         const nextState = deepCopy(initialState || originalState);
//         isPersisted && clear && clearStorageKey();
//         setState(nextState, ignoreNotify);
//         resetting = false;
//     };
//
//
//     const unsubscribe = f => {
//         listeners = listeners.filter(l => l !== f);
//     };
//
//     const subscribe = f => {
//         listeners.push(f);
//         return () => unsubscribe(f);
//     };
//
//     const notify = () => {
//         for (let l in listeners) listeners[l](state, prevState);
//         isPersisted && !resetting && storage.setItem(storageKey, state);
//     };
//
//     const _setState = (next) => {
//         prevState = state;
//         state = next;
//         onChange && onChange(state, prevState);
//     };
//
//     const setState = (updater, ignoreNotify = false,) => {
//         const copyToMutate = deepCopy(state);
//         const nextState = getStateUpdate(updater, copyToMutate);
//         _setState(nextState);
//         if (!ignoreNotify) notify();
//     };
//
//     const mergeState = (updater, ignoreNotify = false) => {
//         const copyToMutate = deepCopy(state);
//         const update = getStateUpdate(updater, copyToMutate);
//         const nextState = merger(copyToMutate, update);
//         _setState(nextState)
//         if (!ignoreNotify) notify();
//     };
//
//     const select = (selector, state) => {
//         state = state || deepCopy(getState());
//         if (!selector) return state;
//         if (isFunc(selector)) return selector(state);
//         if (isObj(selector)) {
//             let out = {};
//             for (let key in selector) out[key] = select(selector[key], state);
//             return out;
//         }
//         if (isArray(selector)) return selector.map(s => select(s, state));
//         if (isString(selector)) {
//             let possibleMany = selector.split(',').map(s => s.trim()).filter(Boolean);
//             if (possibleMany.length > 1) return select(possibleMany, state);
//             return getIn(state, possibleMany[0], state);
//         }
//     };
//
//     const _setInState = (copyToMutate, path, updater, originalCopyOfState) => {
//         let branchUpdate = updater;
//         if (isFunc(updater)) branchUpdate = updater(getIn(state, path, originalCopyOfState));
//         return setIn(copyToMutate, path, branchUpdate);
//     };
//
//     const mergeInPath = (path, updater, ignoreNotify = false) => {
//         let copyToMutate = deepCopy(state);
//         // let originalCopyOfState = deepCopy(state);
//         if (isFunc(path)) path = path(copyToMutate);
//         if (isString(path)) copyToMutate = _setInState(copyToMutate, path, updater);
//         if (isObj(path)) for (let key in path) copyToMutate = _setInState(copyToMutate, key, path[key]);
//         _setState(copyToMutate);
//         console.log({copyToMutate})
//         if (!ignoreNotify) notify();
//     };
//
//     Object.assign(mergeState, {mergeInPath, setState, mergeState});
//
//     const subscribeToSelection = (selector, cb, {shouldUpdate = selectorShouldUpdate} = {}) => {
//         const listener = (newState, prev) => {
//             const prevState = selector ? select(selector, prev) : prev;
//             const nextState = selector ? select(selector, newState) : newState
//             if (shouldUpdate(prevState, nextState)) cb(nextState, prevState);
//         };
//         return subscribe(listener);
//     }
//
//     const useSelector = (selector, {shouldUpdate = selectorShouldUpdate} = {}) => {
//         const mountedState = useIsMounted();
//         const [value, setValue] = useState(() => select(selector, state));
//         const set = x => mountedState.current && setValue(x);
//         useEffect(() => subscribeToSelection(selector, set, {shouldUpdate}), []);
//         return [value, mergeState]; //destructure for more options: [value, {mergeState, mergeInPath, setState}]
//     };
//
//     return {
//         select,
//         subscribeToSelection,
//         subscribe, unsubscribe,
//         notify,
//         getState, setState, mergeState, mergeInPath,
//         useSelector,
//         reset,
//         subscribeStorage, unsubscribeStorage, clearStorageKey
//     }
// }