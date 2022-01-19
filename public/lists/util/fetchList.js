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

const fetchData = async () => {
    if (!data.length) data = await import('./data.json');

    id = data.length;

    [...Array(10000)].forEach((_, i) => {
        addItem('rando-' + (data.length + i));
    });

    await wait(200)
}


let first = true;
export const fetchList = () => {
    return new Promise(r => {

        setTimeout(() => {


        }, 200);
    });
};