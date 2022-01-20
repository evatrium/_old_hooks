import {createState} from '../src';
import {deepMerge, getIn, isArray, isEqual, isFunc, isObject, isPrimitive, localStore} from "@iosio/util";


const createInitialState = () => ({
    funky: () => 0,
    array: [{id: 1, name: 'foo'}],
    derp: {
        foo: 123,
    },
    bar: 456,
    some: {
        nested: {
            state: 0,
            blob: 1,
            arr: [0]
        }
    },
});

let initialState = createInitialState();
const storeKey = 'state.some';
const some = localStore.getItem(storeKey);
if (some) initialState.some = deepMerge(initialState.some, some);
const store = createState(initialState);
store.subscribeToSelection('some', (state, prev) => {
    localStore.setItemDebounced(storeKey, state)
});
localStore.subscribeToKey(storeKey, (data) => {
    store.setInPath('some', data || createInitialState().some)
});
const reset = () => {
    localStore.removeItem(storeKey);
    store.reset();
}

const updateFoo = () => {
    store.mergeState(s => ({
        derp: {
            foo: s.derp.foo + 1
        }
    }));
};

const Foo = () => {
    // const [foo, merge] = state.useSelector('derp.foo');
    const [foo, merge] = store.useSelector(({derp}) => derp.foo);
    console.log('foo updated', foo)
    return (
        <>
            <h1>
                Foo: {foo}
            </h1>

            <button onClick={updateFoo}>
                FOO
            </button>
        </>
    )
};

const Bar = () => {
    const [bar, merge] = store.useSelector('bar');
    console.log('bar updated');
    return (
        <>
            <h1>
                Bar: {JSON.stringify(bar)}
            </h1>
            <button onClick={() => store.mergeState(s => ({bar: s.bar + 1}))}>
                BAR
            </button>
        </>
    )
};

const SomeNestedState = () => {

    const [{s, blob, arr, arr0}, merge] = store.useSelector({
        s: 'some.nested.state',
        blob: 'some.nested.blob',
        arr: 'some.nested.arr',
        arr0: 'some.nested.arr[0]'
    });

    console.log('super specific state selections updated', arr);

    return (
        <>
            <br/>
            <h1>
                Multi Nested State: {s}
            </h1>
            <br/>
            <h2>
                blob: {blob}
            </h2>
            <br/>
            <h3>
                arr: {JSON.stringify(arr)}
            </h3>
            <br/>
            <h3>
                arr[0]: {arr0}
            </h3>
            <div style={{display: 'flex'}}>

                <button onClick={() =>
                    store.setInPath({'some.nested.arr[0]': arr0 => (arr0 + 1)})
                }>
                    inc arr0
                </button>
                <button onClick={() => store.setInPath({
                    'some.nested.state': num => (num + 2),
                    'some.nested.blob': _ => _ + 1,
                    'some.nested.arr': arr => [...arr, arr.length]
                })}>
                    BAZ
                </button>
            </div>
            <br/>
        </>
    )
}
let derp = 0;
const MrArray = () => {
    const [arr] = store.useSelector('array');
    console.log('array updated')
    return (
        <>
            <h3>
                arrrraayyyy {JSON.stringify(arr)}
            </h3>
            <br/>
            <button onClick={() => {
                store.setInPath('array[0]', (obj) => ({
                    ...obj,
                    id: obj.id + 1,
                    name: `foo`,
                    bar: 'baz'
                }))
            }}>
                set in path
            </button>

            <br/>
        </>
    )
}

const unsub = store.subscribeToSelection('derp.foo', (state) => {
    console.log('subscription to derp.foo ******', store.getState());
});

export default function StatePage() {

    return (
        <>
            <Foo/>
            <Bar/>
            <SomeNestedState/>

            <br/>

            <MrArray/>
            <br/>

            <br/>


            <br/>

            <button onClick={reset}>
                reset
            </button>
        </>
    );
}

