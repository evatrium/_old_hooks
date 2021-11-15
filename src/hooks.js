import {useRef, useEffect, useLayoutEffect, useCallback, useState, useMemo} from "react";
import {
    combineArraysAndDeduplicate,
    createIsInArray, excludeItemsFromAray,
    getItemsThatExistInBothArrays,
    getStateUpdate, isArray,
    isFunc, isObj,
    propsChanged,
    toggleSelection,
    debounce, stringify, deepMergeObj
} from "@iosio/util";

import {SearchWorker} from "search-worker";

/*################################
##################################

          MISC. UTIL

##################################
################################*/


let id = 1;
export const useId = () => useMemo(() => id++, []);
const EMPTY_ARRAY = [];

/*################################
##################################

           LIFE CYCLES

##################################
################################*/

export const useEnhancedEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const useIsMounted = () => {
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false;
        }
    }, []);

    return isMounted;
};

export const useWillMount = f => useMemo(f, [])

export const useDidMount = f => useEffect(f, []);

export const useDidUpdate = (cb, deps = []) => {
    const initialRef = useRef(true);
    useEffect(() => {
        if (!initialRef.current) cb(...deps);
        initialRef.current = false;
    }, [...deps])
}

export const useWillUnmount = f => useEffect(() => f, []);


const newObj = () => Object.create(null);
export const useForceUpdate = () => {
    const isMounted = useIsMounted();
    const [, set] = useState(newObj);
    return useCallback(() => isMounted.current && set(newObj()), [set, isMounted]);
}


/*################################
##################################

            STATE

##################################
################################*/

const shallowMerger = (prev, next) => ({...prev, ...next});
export const useMergeState = (initialState = {}, merger = shallowMerger) => {
    const [state, setState] = useState(initialState);

    const mergeState = useCallback(update => {
        setState(prev => {
            const next = getStateUpdate(update, prev);
            return merger(prev, next);
        })
    }, []);

    return [state, mergeState];
}


export const createGlobalState = (state = {}) => {

    let listeners = [];

    let prevState = {...state};

    const getState = () => state;

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
        state = next;
    };

    const setState = (updater, ignoreUpdate = false) => {
        const nextState = getStateUpdate(updater, state);
        _setState(nextState);
        if (!ignoreUpdate) notify();
    };

    const mergeState = (updater, ignoreUpdate = false) => {
        setState(deepMergeObj(state, getStateUpdate(updater, state)), ignoreUpdate);
    };

    const useSelector = (selector = x => x, {shouldUpdate = propsChanged} = {}) => {
        const mountedState = useIsMounted();
        const [value, setValue] = useState(() => selector(state))
        useEffect(() => {
            const listener = (newState, prev) => {
                if (!mountedState.current) return;
                const nextState = selector(newState);
                const prevState = selector(prev);
                if (shouldUpdate(prevState, nextState)) setValue(nextState);
            };
            return subscribe(listener);
        }, []);
        return [value, mergeState];
    };

    return {
        unsubscribe, subscribe, notify,
        setState, mergeState, useSelector, getState,
    }
}


/*################################
##################################

           DIFFING

##################################
################################*/


export const useShallowObjectChangedFlag = (obj, skipDiffProps, objChanged = propsChanged) => {
    const hasMounted = useIsMounted(); // only check if the component updated, not on mount
    const prev = useRef(obj);
    const changed = useRef(1)
    if (!skipDiffProps && hasMounted.current && objChanged(obj, prev.current)) {
        changed.current = changed.current === 1 ? 2 : 1;
    }
    prev.current = obj;
    return changed.current
}


/*################################
##################################

           TIMING

##################################
################################*/


export const useInterval = (func, {time = 1000, immediate} = {}) => {
    const isMounted = useIsMounted();
    const interval = useRef();
    const stop = useCallback(() => {
        clearInterval(interval.current);
    }, [interval]);
    const start = useCallback(() => {
        stop();
        interval.current = setInterval(() => {
            isMounted.current && isFunc(func) && func({start, stop});
        }, time);
    }, [stop, func, isMounted]);

    useEffect(() => {
        if (immediate) start();
        return stop;
    }, [start, stop, immediate]);

    return useMemo(() => ({start, stop}), [start, stop]);
}

export const useForceUpdateInterval = ({time = 1000, immediate} = {}) => {
    const fu = useForceUpdate();
    return useInterval(fu, {time, immediate});
}


/*################################
##################################

INPUTS, TOGGLE/CHECKBOX, MENU, ARIA

##################################
################################*/

export const useToggle = (defaultBool) => {
    const [bool, setBool] = useState(!!defaultBool);
    const toggle = useCallback((override) => {
        setBool(b => typeof override === 'boolean' ? override : !b);
    }, [setBool]);
    return useMemo(() => [bool, toggle], [bool, toggle]);
}


export const useAriaCheckboxState = (defaultBool) => {
    const [bool, toggle] = useToggle(defaultBool);

    return useMemo(() => {
        const bind = {role: 'checkbox', 'aria-checked': bool, onClick: toggle};
        return [bind, toggle, bool]
    }, [toggle, bool]);
};

export const useAriaMenuState = ({ariaName = 'menu', contents = 'items'} = {}) => {
    const ref = useRef(null);
    const id = useId();
    const ariaId = `${ariaName}-${id}`;
    const triggerId = `${ariaId}-trigger-${id}`;

    const [isOpen, setOpen] = useState(false);

    const open = useCallback(() => setOpen(true), [setOpen]);
    const close = useCallback(() => setOpen(false), [setOpen]);

    const triggerProps = {
        id: triggerId,
        'aria-haspopup': 'menu',
        ...(isOpen && {
            'aria-expanded': 'true',
            'aria-controls': ariaId
        }),
        ref,
        onClick: open,
        'aria-label': `${ariaName}. ${isOpen ? 'Menu expanded' : `Select to access ${contents}`}`,
    };

    const menuProps = {
        id: ariaId,
        'aria-labelledby': triggerId,
    };

    return {
        isOpen,
        open,
        close,
        triggerProps,
        menuProps,
    }
}


export const useUncontrolledInputValue = onChange => {
    const valueRef = useRef('');
    const ref = useRef(null);
    useEffect(() => {
        const onInput = e => {
            const value = e.target.value;
            valueRef.current = value;
            onChange && onChange(value);
        }
        const change = e => {
            const value = e.target.value;
            if (valueRef.current !== value) {
                onChange && onChange(value);
            }
            valueRef.current = value;
        };

        const _ref = ref.current;

        if (_ref) {
            _ref.addEventListener('input', onInput);
            _ref.addEventListener('change', change);
        }

        return () => {
            if (_ref) {
                _ref.removeEventListener('input', onInput);
                _ref.removeEventListener('change', change);
            }
        }
    }, [onChange]);

    return ref;
};


// const useField =
//     ({
//          label: initialLabel = '',
//          value: initialValue = '',
//          errorText: initialErrorText = '',
//          helperText: initialHelperText = '',
//
//      } = {}) => {
//
//         const [{label, value, errorText, helperText}, mergeState] = useMergeState({
//             label: initialLabel,
//             value: initialValue,
//             errorText: initialErrorText,
//             helperText: initialHelperText
//         });
//
//         const onChange = useCallback(e => mergeState({value: e.target.value}), []);
//
//         return {
//             label,
//             value,
//             errorText,
//             helperText,
//             mergeState,
//             onChange,
//             reset: () => mergeState({
//                 label: initialLabel,
//                 value: initialValue,
//                 errorText: initialErrorText,
//                 helperText: initialHelperText
//             }),
//             textFieldBind: {
//                 label,
//                 value,
//                 errorText,
//                 helperText
//             },
//             bind: {
//                 value,
//                 onChange,
//             },
//         }
//     }
/*################################
##################################

             ASYNC

##################################
################################*/

export const useAsync = (asyncFunc, options = {initialState: {}}) => {
    const isMountedRef = useIsMounted();
    let [{data, pending, error}, mergeState] = useMergeState({
        data: undefined, pending: false, error: undefined,
        ...options.initialState
    });
    const execute = useCallback(async (...args) => {
        isMountedRef.current && mergeState({pending: true, error: undefined});
        try {
            const result = await asyncFunc(...args);
            isMountedRef.current && mergeState({data: result, pending: false});
            return {data: result}
        } catch (error) {
            isMountedRef.current && mergeState({error, pending: false});
            return {error}
        }
    }, [asyncFunc, mergeState, isMountedRef]);

    const useExecuteEffect = (...args) => {
        useEffect(() => {
            execute(...args);
        }, [stringify(args)])
    };

    return {
        data, pending, error, execute,
        mergeState, useExecuteEffect,
    }
}


/*################################
##################################

        LISTS, SELECTIONS

##################################
################################*/

export const useSelectionHandler = ({findById, defaultSelections = [], additionalState} = {}) => {
    const [state, mergeState] = useMergeState({selections: defaultSelections, ...additionalState});

    const {selections} = state;

    const isInArray = useMemo(() => createIsInArray({findById}), [findById]);

    const getSelections = useCallback((items) => {
        return getItemsThatExistInBothArrays(selections, items, {findById})
    }, [selections, findById]);

    const numberOfSelections = useCallback((items) => getSelections(items).length, [getSelections]);

    const areAllSelected = useCallback((items) => {
        return numberOfSelections(items) === items.length && items.length !== 0
    }, [numberOfSelections]);

    const isIndeterminate = useCallback(items => {
        const num = numberOfSelections(items);
        return num !== items.length && num !== 0;
    }, [numberOfSelections]);

    const isSelected = useCallback((item) => isInArray(selections, item), [selections, isInArray]);

    const toggle = useCallback((item) => {
        mergeState({selections: [...toggleSelection(selections, item, {findById})]})
        return selections; // ???
    }, [mergeState, selections, findById]);

    const toggleAll = useCallback((items) => {
        const allAreSel = areAllSelected(items);
        const updated = allAreSel
            ? excludeItemsFromAray(selections, items, {findById})
            : combineArraysAndDeduplicate(selections, items, {findById});
        mergeState({selections: updated});
        return updated; // why??
    }, [areAllSelected, selections, mergeState]);

    const reset = useCallback(() => mergeState({selection: []}), [mergeState]);

    const deps = [
        selections,
        getSelections,
        numberOfSelections,
        areAllSelected,
        isIndeterminate,
        isSelected,
        toggle,
        toggleAll,
        mergeState,
        reset,
        state,
    ];

    return useMemo(() => ({
        selections,
        getSelections,
        numberOfSelections,
        areAllSelected,
        isIndeterminate,
        isSelected,
        toggle,
        toggleAll,
        setSelections: next => mergeState({selections: next}),
        mergeState,
        reset,
        state,
    }), deps);
};

const Searcher = (
    {
        list = [],
        searchOptions,
        debounceTime = 50,
        searchValue = '',
        resultsCallback,
    } = {}) => {

    let _list, _searchOptions, _debounce, _searchValue, _results, _instance;

    const init = () => {
        _list = [...list];
        _searchOptions = {...searchOptions};
        _debounce = debounceTime;
        _searchValue = searchValue;
        _results = [];
    }

    init();

    const cancelSearch = () => {
        _instance && _instance.cancel();
    };

    const createSearchInstance = () => {
        cancelSearch();
        _instance = SearchWorker(_list, _searchOptions);
    };

    const debouncedSearch = debounce(async () => {
        if (!_instance) createSearchInstance();
        _results = await _instance(_searchValue);
        resultsCallback && resultsCallback(_results);
        return _results;
    }, _debounce || 0);

    const update = async ({list, searchOptions} = {}) => {
        cancelSearch();
        if (isArray(list)) _list = _results = list;
        if (isObj(searchOptions)) _searchOptions = searchOptions;
        createSearchInstance();
        return await debouncedSearch()
    }

    const search = async text => {
        _searchValue = text;
        return await debouncedSearch();
    };

    const reset = () => {
        cancelSearch();
        _list = [];
        _searchOptions = {};
        _instance = SearchWorker([], {});
    }

    return {
        search,
        cancelSearch,
        update,
        reset,
    };
};

export const useSearchWorkerBase = ({list = EMPTY_ARRAY, keys, debounce} = {}) => {

    const [results, setResults] = useState(list);
    const mounted = useIsMounted();
    const resultsCallback = res => mounted.current && setResults(res);

    const instance = useMemo(() => Searcher({
        list: list,
        searchOptions: {keys},
        resultsCallback,
        debounce
    }), []);

    useDidUpdate(() => {
        console.log('did update');
        instance.update({searchOptions: {keys}, list});
    }, [keys, list]);

    useWillUnmount(instance.reset);

    return {
        results,
        search: instance.search
    }

};

export const useSearchWorker = ({list, keys, debounce, initialSearchValue = ''} = {}) => {
    const [value, setSearchValue] = useState(initialSearchValue);
    const {results, search} = useSearchWorkerBase({list, keys, debounce});

    const setValue = useCallback(value => {
        setSearchValue(value);
        search(value);
    }, [search, setSearchValue]);

    const onInput = useCallback((e) => {
        setValue(e.target.value)
    }, [setValue]);

    const bind = {onInput, value};

    return {
        bind,
        onInput,
        value,
        setValue,
        results
    }
}

export const useSearchWorkerUncontrolledInput = ({list, keys, debounce} = {}) => {
    const {results, search} = useSearchWorkerBase({list, keys, debounce});
    const ref = useUncontrolledInputValue(search);
    const bind = {ref};
    return {bind, ref, results}
}

/*################################
##################################

            REFS

##################################
################################*/

export const usePrevious = (value) => {
    const ref = useRef(value);
    useEffect(() => {
        ref.current = value;
    })
    return ref;
}

export const useUpdatedRef = (value) => {
    const v = useRef(value);
    v.current = value;
    return v;
}
export const setRef = (ref, value) => {
    if (typeof ref === 'function') {
        ref(value);
    } else if (ref) {
        ref.current = value;
    }
}

export const useForkRef = (refA, refB) => {
    /**
     * This will create a new function if the ref props change and are defined.
     * This means react will call the old forkRef with `null` and the new forkRef
     * with the ref. Cleanup naturally emerges from this behavior.
     */
    return useMemo(() => {
        if (refA == null && refB == null) {
            return null;
        }
        return (refValue) => {
            setRef(refA, refValue);
            setRef(refB, refValue);
        };
    }, [refA, refB]);
};


// export const useIsScrollable = () => {
//     const [{height, width}, set] = useMergeState({height: false, width: false});
//     const isMountedRef = useIsMounted();
// }

