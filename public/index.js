import {h, render} from 'preact';
import {SearchWorkerDemo} from "./lists/SearchWorkerDemo";
import {SelectionsDemo} from "./lists/SelectionsDemo";
import {ActiveLinkage, useRouter} from "@iosio/react-router";
// note: ActiveLinkage is experimental

const pathMap = {
    '/': {
        title: 'Iosio Hooks',
        Route: () => {
            return (
                <h1>Iosio Hooks</h1>
            )
        }
    },
    '/search-worker': {
        title: 'Search Worker',
        Route: SearchWorkerDemo
    },
    '/selections': {
        title: 'Selections',
        Route: SelectionsDemo
    }
}


const App = () => {

    const {Route} = useRouter({pathMap});

    return (
        <>
            <nav>
                {Object.keys(pathMap).map((key) => (
                    <ActiveLinkage to={key} key={key}>
                        {((label) => key === '/' ? <b>{label}</b> : label)(pathMap[key].title)}
                    </ActiveLinkage>
                ))}
            </nav>
            <main style={{padding: 16}}>
                <Route/>
            </main>
        </>
    )
}

render(<App/>, document.body);
