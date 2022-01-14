import {createState} from '../src';

const initialState = {
    derp: {
        foo: 123,
    },
    bar: 456,
    some: {
        nested: {
            state: 'baz',
            blob: 1,
            arr: [0]
        }
    },
};


const state = createState(initialState, {persist: {key: 'stateDemo'}});

const Foo = () => {
    const [foo, merge] = state.useSelector('derp.foo');
    console.log('foo updated')
    return (
        <h1>
            Foo: {foo}
        </h1>
    )
};

const Bar = () => {
    const [bar, merge] = state.useSelector('bar');
    console.log('bar updated');
    return (
        <h1>
            Bar: {JSON.stringify(bar)}
        </h1>
    )
};

const SomeNestedState = () => {

    const [{s, blob, arr, arr0}, merge] = state.useSelector(() => ({
        s: 'some.nested.state',
        blob: 'some.nested.blob',
        arr: 'some.nested.arr',
        arr0: 'some.nested.arr[0]'
    }));

    console.log('some nested state updated', arr);

    return (
        <>
            <br/>
            <h1>
                Some Nested State: {s}
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
            <br/>
        </>
    )
}


const Arr = () => {
    const [bar, merge] = state.useSelector(
        'some.nested.state,'
    );
    console.log('Arr updated');
    return (
        <h1>
            Arr: {JSON.stringify(bar)}
        </h1>
    )
};

let derp = 0;
export default function StatePage() {

    return (
        <>
            <Foo/>
            <Bar/>
            <SomeNestedState/>

            <Arr/>
            <br/>


            <button onClick={() => state.mergeState(s => ({derp: {foo: s.derp.foo + 1}}))}>
                FOO
            </button>
            <button onClick={() => state.mergeState(s => ({bar: s.bar + 1}))}>
                BAR
            </button>

            <button onClick={() => state.mergeInPath(() => ({
                'derp.foo': 500,
                'some.nested.state': derp++,
                'some.nested.blob': _ => _ + 1,
                'some.nested.arr': arr => {
                    return [...arr, derp];
                }
            }))}>
                BAZ
            </button>

            <br/>

            <button onClick={() => state.mergeInPath({'some.nested.arr[0]': arr0 => (arr0 + 1)})}>
                inc arr0
            </button>
            <br/>
            <button onClick={() => state.reset({initialState})}>
                reset
            </button>
        </>
    );
}

