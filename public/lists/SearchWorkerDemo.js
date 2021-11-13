import {useAsync, useSearchWorker} from "../../src";
import PreactVirtualList from "./util/preact-virtual-list";
import {fetchList} from "./util/fetchList";

const Row = ({id, ...item}) => {
    const keys = Object.keys(item);
    return (
        <div key={id} className={'row'}>
            {keys.map((it, i) => (
                <div className={'col'} key={i}>
                    {item[it]}
                </div>
            ))}
        </div>
    );
};

const List = ({list, pending}) => {


    const {bind, results} = useSearchWorker({
        list, keys: 'first_name,last_name,page,city,ip',
    });

    // const {bind, results} = useSearchWorkerUncontrolledInput({
    //     list, keys: 'first_name,last_name,page,city,ip',
    // })

    return (
        <>
            <h3>showing ({results?.length || 0}) item{results?.length !== 1 ? 's' : ''}</h3>

            <input autoFocus={true} {...bind} style={{marginBottom: 8}}/>

            <PreactVirtualList
                sync
                class="list"
                data={results}
                rowHeight={30}
                renderRow={Row}
            />
        </>
    );
};

const EMPTY_ARRAY = [];

export const SearchWorkerDemo = () => {

    const {data: list, error, pending, execute, useExecuteEffect} = useAsync(fetchList);

    useExecuteEffect();

    return (
        <>
            <h1>Super fast text search App 🤪 {pending ? '...fake loading' : ''}</h1>
            <button onClick={execute}>
                Load more!!
            </button>
            <List list={list || EMPTY_ARRAY} pending={pending}/>
        </>
    );
};
