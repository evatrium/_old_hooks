import {data} from "./data";

let id = data.length;

const makeItem = (first_name) => ({
    'id': id++,
    first_name,
    'last_name': 'Jones',
    'age': id,
    'city': 'Flavieside',
    'ip': `63.66.189.${id}`
});

const addItem = (first_name) => data.push(makeItem(first_name));

[...Array(10000)].forEach((_, i) => {
    addItem('rando-' + (data.length + i));
});

let first = true;
export const fetchList = () => {
    return new Promise(r => {
        setTimeout(() => {
            if (first) {
                r(data);
                first = false;
            } else {
                const morrreeepllzz = [...Array(10000)].map((_, i) =>
                    makeItem('more-rando-' + (data.length + i)));
                r([...data, ...morrreeepllzz]);
            }

        }, 200);
    });
};