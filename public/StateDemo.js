import {createState} from '../src';


const createInitialState = () => ({
    funky: () => 0,
    derp: {
        foo: 0,
        rando: 0,
    },
    bar: 0,
    bang: 0,
    some: {
        nested: {
            state: 0,
            blob: 0,
            arr: [0]
        }
    },
    array: [{id: 0, name: 'foo'}],
});

let initialState = createInitialState();

const store = createState(initialState, {
    persist: {
        key: 'state',
        /*
            key: 'state.some',
            selectPersistedState: ({some}) => some,
            hydrate: (state, storedState) => {
                console.log('hydrating stored state', storedState);
                if (!storedState) storedState = createInitialState().some
                return {...state, some: storedState}
            }
         */
    },
});

const Box = ({style, ...props}) =>
    <div style={{
        overflow: 'hidden',
        padding: 8,
        border: '1px solid var(--text)',
        marginTop: 8,
        marginBottom: 8,
        ...style
    }} {...props}/>

const updateRando = () => {
    store.mergeState(s => ({
        derp: {
            ...s.derp,
            rando: s.derp.rando + 1,
        }
    }));
};

const Rando = () => {
    const [rando] = store.use(({derp}) => derp.rando);
    console.log('rando updated', rando)
    return (
        <Box>
            <h1>
                Rando: {rando}
            </h1>

            <button onClick={updateRando}>
                DERP.RANDO
            </button>
        </Box>
    )
};

const updateFoo = () => {
    store.mergeState(s => ({
        derp: {
            ...s.derp,
            foo: s.derp.foo + 1
        }
    }));
};
const Foo = () => {
    const [foo] = store.use(({derp}) => derp.foo);
    console.log('foo updated', foo)
    return (
        <Box>
            <h1>
                Foo: {foo}
            </h1>

            <button onClick={updateFoo}>
                DERP.FOO
            </button>
        </Box>
    )
};

const Bar = () => {
    const [bar, merge] = store.use('bar');
    console.log('bar updated');
    return (
        <Box>
            <h1>
                Bar: {bar}
            </h1>
            <button onClick={() => merge(s => ({bar: s.bar + 1}))}>
                BAR
            </button>
        </Box>
    )
};
const Bang = () => {
    const [[bang], {setState}] = store.use(['bang']);
    console.log('bang updated');
    return (
        <Box>
            <h1>
                Bang: {bang}
            </h1>
            <button onClick={() => setState(s => ({
                ...s,
                bang: s.bang + 1
            }))}>
                BANG
            </button>
        </Box>
    )
};

const FooBarBang = () => {
    let [[foo, bar, bang], mergeState] = store.use('derp.foo,bar,bang');

    const inc = () => mergeState((s) => ({
        derp: {
            ...s.derp,
            foo: foo + 1
        },
        bar: bar + 1,
        bang: bang + 1
    }));

    return (
        <Box>
            <h3>
                {`Foo: ${foo} Bar: ${bar} Bang: ${bang}`}
            </h3>
            <button onClick={inc}>
                FOO BAR BANG
            </button>
        </Box>
    )
};

const SomeNestedState = () => {

    const [{s, blob, arr, arr0}, {setInPath}] = store.use({
        s: 'some.nested.state',
        blob: 'some.nested.blob',
        arr: 'some.nested.arr',
        arr0: 'some.nested.arr[0]'
    });

    console.log('super specific state selections updated', arr);

    return (
        <Box>
            <h3>
                Some Nested State: {s}
            </h3>

            <h3>
                Blob: {blob}
            </h3>

            <h3>
                Arr: {JSON.stringify(arr)}
            </h3>

            <h3>
                Arr[0]: {arr0}
            </h3>
            <div style={{display: 'flex'}}>

                <button style={{marginRight: 8}}
                        onClick={() => setInPath('some.nested.arr[0]', arr0 + 1)}>
                    Inc arr0
                </button>

                <button onClick={() => setInPath({
                    'some.nested.state': num => (num + 2),
                    'some.nested.blob': _ => _ + 1,
                    'some.nested.arr': arr => [...arr, arr.length]
                })}>
                    STATE BLOB ARR
                </button>
            </div>
            <br/>
        </Box>
    )
}

const MrArray = () => {
    const [arr] = store.use('array');
    console.log('array updated')
    return (
        <Box>
            <h3>
                Array: {JSON.stringify(arr)}
            </h3>

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
        </Box>
    )
}

const unsub = store.subscribeToSelection('derp.foo', (foo, prevFoo) => {
    console.log('subscription to derp.foo ******', {foo, prevFoo});
});
setTimeout(() => {
    unsub();
    console.log('setTimeout unsubscribed from selection subscription **state demo page**');
}, 5000)

export default function StatePage() {

    return (
        <>
            <Rando/>
            <Foo/>
            <Bar/>
            <Bang/>
            <FooBarBang/>
            <SomeNestedState/>
            <MrArray/>
            <Box>
                <button onClick={() => store.reset()}>
                    reset
                </button>
            </Box>
        </>
    );
}

