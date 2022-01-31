import {isArray, API, wait, pluck} from "@iosio/util";
import {AsyncState} from '../src';


const api = API({
    API_URL: 'https://jsonplaceholder.typicode.com',
    getFetchOptions: ({method, url, body}) => ({
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        }
    })
});

const getTodos = async ({id} = {}) => {
    await wait(500)
    return api`get:/todos/${id}`;
}

const todos = AsyncState(getTodos)

const definitions = {
    initialPending: 'will be true if the args passed are unique (or the first time this has been called) and there is no cache',
    pending: 'any time an asynchronous event is active',
    refreshing: 'if there is cache on state and data is pending again',
    cache: 'the previous data on state that match the arguments (while pending). cache will be current with data when data is resolved',
    lastRefreshDate: 'the date (Date.now()) when the latest response was stored in state',
    data: 'the results of a successful asynchronous call',
    cacheThenData: 'cache will exist on this property if it exists then it will be replaced with the latest results once it resolves',
    completed: 'will be true once an asynchronous event is resolved or rejected',
    error: 'the error that is returned from a failed/rejected response'
}

export default function AsyncStatePage() {

    let [
        {cacheThenData, completed, refreshing, initialPending, pending, cache, data, error, lastRefreshDate},
        {execute}
    ] = todos.use({immediate: true, args: [{id: 1}]});


    const states = {
        initialPending,
        pending,
        refreshing,
        cache,
        lastRefreshDate,
        data,
        cacheThenData,
        completed,
        error,
    };


    if (cacheThenData) {
        cacheThenData = isArray(cacheThenData) ? cacheThenData : [cacheThenData]
    }
    let responseError = {}
    if (error?.response) {
        responseError = pluck(['status', 'ok', 'statusText'], error.response);
    }
    return (
        <div>

            <h1>Async State</h1>

            {Object.keys(states).map(key => {
                const active = !!states[key]
                return (
                    <div key={key}>
                        <h2 style={{color: active ? 'var(--primary)' : 'white'}}>{key}</h2>
                        <h4>{definitions[key]}</h4>
                    </div>
                )
            })}

            {Object.keys(responseError).map((key) => (
                <h4 style={{color: 'red'}} key={key}>{`${key}:${responseError[key]}`}</h4>
            ))}

            <button disabled={pending} onClick={() => {
                execute({id: 1})
            }}>
                fetch single
            </button>

            <button disabled={pending} style={{marginLeft: 8}} onClick={() => {
                execute()
            }}>
                fetch all
            </button>

            <button disabled={pending} style={{marginLeft: 8}} onClick={() => {
                execute({id: '---foo-bar'})
            }}>
                Bad Request
            </button>
            <ul style={{listStyle: 'none'}}>
                {cacheThenData && cacheThenData.map(({id, title, completed}) => (
                    <li key={id} style={{padding: 8}}>
                        <input type={'checkbox'} checked={completed}/>
                        <span style={{paddingLeft: 8}}>{title}</span>
                    </li>
                ))}

            </ul>
        </div>
    )
}