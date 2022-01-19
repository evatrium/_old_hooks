import {createState} from '../src';

const initialState = {
    array: [{id: 1, name: 'foo'}],
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
    // const [foo, merge] = state.useSelector('derp.foo');
    const [foo, merge] = state.useSelector(({derp}) => derp.foo);
    console.log('foo updated', foo)
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

    const [{s, blob, arr, arr0}, merge] = state.useSelector({
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
let derp = 0;
const MrArray = () => {
    const [arr] = state.useSelector('array');

    return (
        <>
            <h3>
                arrrraayyyy {JSON.stringify(arr)}
            </h3>
            <br/>
            <button onClick={() => {
                state.mergeInPath('array[0]', {id: 1, name: `bar ${derp++}`})
            }}>
                merge in path
            </button>

            <br/>
        </>
    )
}

const Arr = () => {
    const [bar, merge] = state.useSelector(
        'some.nested.state,'
    );
    console.log('some nested state updateddddd');
    return (
        <>
            <h1>
                Arr: {JSON.stringify(bar)}
            </h1>
        </>
    )
};

const unsub = state.subscribeToSelection('derp.foo', (state) => {
    console.log('******', state);
});

// setTimeout(()=>{
//     unsub();
// },2000);

export default function StatePage() {

    return (
        <>
            <Foo/>
            <Bar/>
            <SomeNestedState/>

            <Arr/>
            <br/>

            <MrArray/>
            <br/>


            <button onClick={() => {
                state.mergeState(s => ({
                        derp: {
                            foo:
                                s.derp.foo + 1
                        }
                    })
                );
            }}>
                FOO
            </button>
            <button onClick={() => state.mergeState(s => ({bar: s.bar + 1}))}>
                BAR
            </button>

            <button onClick={() => state.mergeInPath({
                'derp.foo': 500,
                'some.nested.state': derp++,
                'some.nested.blob': _ => _ + 1,
                'some.nested.arr': arr => [...arr, derp]
            })}>
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

