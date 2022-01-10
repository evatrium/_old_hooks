import {createGlobalState} from '../src';


const initialState = {
    derp: {
        foo: 123,
    },
    bar: 456,
    some: {
        nested: {
            state: 'baz',
            blob: 1
        }
    }
};


const state = createGlobalState(initialState);

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
            Bar: {bar}
        </h1>
    )
};

const SomeNestedState = () => {

    const [{asdf, blob}, merge] = state.useSelector(() => ({
        asdf: 'some.nested.state',
        blob: 'some.nested.blob'
    }));

    console.log('some nested state updated');

    return (
        <>
            <h1>
                Some Nested State: {asdf}
            </h1>
            <h2>
                blob: {blob}
            </h2>
        </>
    )
}


let derp = 0;
export default function StatePage() {

    return (
        <>
            <Foo/>
            <Bar/>
            <SomeNestedState/>
            <button onClick={() => state.mergeState(s => ({derp: {foo: s.derp.foo + 1}}))}>
                FOO
            </button>
            <button onClick={() => state.mergeState(s => ({bar: s.bar + 1}))}>
                BAR
            </button>

            <button onClick={() => state.mergeInPath(() => ({
                'derp.foo': 500,
                'some.nested.state': derp++,
                'some.nested.blob': _ => _ + 1
            }))}>
                BAZ
            </button>
        </>
    );
}

