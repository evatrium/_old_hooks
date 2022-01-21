import {wait} from "@iosio/util";

let data = []
let id = 0;

const makeItem = (first_name) => ({
    'id': id++,
    first_name,
    'last_name': 'Jones',
    'age': id,
    'city': 'Flavieside',
    'ip': `63.66.189.${id}`
});

const addItem = (first_name) => data.push(makeItem(first_name));

export const fetchList = async (cb) => {
    if (!data.length) {
        const results = await import('./data.json');
        data = results.default
    }

    id = data.length;

    [...Array(10000)].forEach((_, i) => {
        addItem('rando-' + (data.length + i));
    });

    await wait(200);

    data = [...data];

    return data;
}