import {fetchHtmlDom} from "./html";
import * as fs from "fs";
import {Readable} from "stream";
import config from "./config";

const url = 'https://www.takaratomy.co.jp/products/conan-cardgame/cardlist'

const responseToReadable = (response: Response) => {
    const reader = response.body.getReader();
    const rs = new Readable();
    rs._read = async () => {
        const result = await reader.read();
        if(!result.done){
            rs.push(Buffer.from(result.value));
        }else{
            rs.push(null);
            return;
        }
    };
    return rs;
};

const result = await fetchHtmlDom(url)
const cards = {};
for (const cardImage of result.querySelectorAll('#cardList img')) {
    const data = JSON.parse(cardImage.getAttribute('data') || '')
    cards[data.card_num] = data

    // Combine category fields...
    cards[data.card_num].categories = []
    for (const key of ['category1', 'category2', 'category3']) {
        if (data[key] !== null) {
            // data error? category1 can contain multiple categories separated by comma
            for (const c of data[key].split(',')) {
                cards[data.card_num].categories.push(c)
            }
        }
        delete cards[data.card_num][key]
    }
    // Make color an array, as there are multi-color stages
    const colorList = []
    if (data.color) {
        for (const c of data.color.split('')) {
            colorList.push(c)
        }
    }
    cards[data.card_num].color = colorList

    const imagePath = config.dataDir + '/images/cards/' + data.card_num + '.ja.jpg'
    if (!fs.existsSync(imagePath)) {
        const res = await fetch(cardImage.getAttribute('src'))
        responseToReadable(res).pipe(fs.createWriteStream(imagePath))
    }
}

const targetPath = config.dataDir + '/cards_ja.json'
const sortedCards = Object.fromEntries(Object.entries(cards).sort())
fs.writeFileSync(targetPath, JSON.stringify(sortedCards, null, '    '))

// Separate categories
const categoryFileContent = {}
for (const card of Object.values(cards)) {
    for (const c of card.categories) {
        const key = `categories.${c}`
        if (key in categoryFileContent) {
            continue
        }
        categoryFileContent[key] = c
    }
}
fs.writeFileSync(__dirname + '/../data/categories_ja.json', JSON.stringify(categoryFileContent, null, '    '))

// Separate type
const typesFileContent = {}
for (const c of Object.values(cards)) {
    if (!c.type) {
        continue
    }
    const key = `types.${c.type}`
    if (key in typesFileContent) {
        continue
    }
    typesFileContent[key] = c.type
}
fs.writeFileSync(__dirname + '/../data/types_ja.json', JSON.stringify(typesFileContent, null, '    '))

// Separate products
const productsFileContent = {}
for (const c of Object.values(cards)) {
    const key = `products.${c.package}`
    if (key in productsFileContent) {
        continue
    }
    productsFileContent[key] = c.package
}
fs.writeFileSync(__dirname + '/../data/products_ja.json', JSON.stringify(productsFileContent, null, '    '))

// Separate colors
const colorsFileContent = {}
for (const c of Object.values(cards)) {
    if (!c.color) {
        continue
    }
    for (const color of c.color) {
        if (color === ',') {
            continue;
        }
        const key = `colors.${color}`
        if (key in colorsFileContent) {
            continue
        }
        colorsFileContent[key] = color
    }
}
fs.writeFileSync(__dirname + '/../data/colors_ja.json', JSON.stringify(colorsFileContent, null, '    '))