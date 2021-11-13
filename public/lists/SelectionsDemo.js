import {useAsync, useMergeState, useSelectionHandler, useToggle} from "../../src";
import {fetchList} from "./util/fetchList";
import {excludeItemsFromAray, isArray} from "@iosio/util";
import {useEffect, useMemo} from "preact/hooks";


export const SelectionsDemo = () => {

    let {execute} = useAsync(fetchList);

    const [{leftList, rightList}, mergeState] = useMergeState({leftList: [], rightList: []});

    useEffect(() => {
        (async () => {
            const {data, error} = await execute();
            if (error) return;
            mergeState({
                leftList: [...data].splice(0, 20),
                rightList: [...data].splice(20, 20)
            });
        })()
    }, [])

    const leftSelector = useSelectionHandler({findById: 'id'});

    const rightSelector = useSelectionHandler({findById: 'id'});

    const move = ({from, to} = {}) => {
        const selectors = {left: leftSelector, right: rightSelector};
        const lists = {left: leftList, right: rightList};
        const {selections, setSelections} = selectors[from];
        mergeState({
            [`${from}List`]: excludeItemsFromAray(lists[from], selections, {findById: 'id'}),
            [`${to}List`]: [...lists[to], ...selections]
        });
        setSelections([]);
    }

    return (
        <div style={{marginLeft: 8, display: 'flex'}}>

            <List {...leftSelector} list={leftList}/>

            <div style={{display: 'flex', flexGrow: 1, alignItems: 'flex-start', justifyContent: 'center'}}>
                <button onClick={() => move({from: 'right', to: 'left'})}>
                    {'< MOVE LEFT'}
                </button>
                <button style={{marginLeft: 8}} onClick={() => move({from: 'left', to: 'right'})}>
                    {'MOVE RIGHT >'}
                </button>
            </div>

            <List {...rightSelector} list={rightList}/>

        </div>
    )
};

const List = ({list, isSelected, toggle, toggleAll, areAllSelected, selections}) => {

    const allAreSelected = areAllSelected(list);

    return (
        <div style={{display: 'flex', flexDirection: 'column', minWidth: 250}}>
            <div style={{padding: 8, borderBottom: '1px solid gray'}}>
                <label style={{paddingRight: 8}}>

                    <input
                        type={'checkbox'}
                        checked={allAreSelected}
                        onClick={() => toggleAll(list)}/>

                    <b style={{paddingLeft: 8}}>
                        Toggle all
                    </b>

                </label>

                {selections.length}/{list.length} {` Selected`}

            </div>
            <ul style={{padding: 8, listStyle: 'none'}}>
                {list.map((item) => {
                    const {id, first_name, last_name} = item;
                    return (
                        <li key={id} style={{padding: 8}}>

                            <label>
                                <input type={'checkbox'} checked={isSelected(item)} onClick={() => toggle(item)}/>

                                <span style={{paddingLeft: 8}}>
                                {`${first_name} ${last_name}`}
                            </span>
                            </label>

                        </li>
                    )
                })}
            </ul>
        </div>
    )
}