import {fetchHtmlDom} from "./html";
import * as fs from "fs";
import {Readable} from "stream";
import {finished} from 'stream/promises';

const url = 'https://www.takaratomy.co.jp/products/conan-cardgame/cardlist'

const result = await fetchHtmlDom(url)
const cards = {};
for (const cardImage of result.querySelectorAll('#cardList img')) {
    const data = JSON.parse(cardImage.getAttribute('data') || '')
    cards[data.id] = data

    // Combine category fields...
    cards[data.id].categories = []
    for (const key of ['category1', 'category2', 'category3']) {
        if (data[key] !== null) {
            // data error? category1 can contain multiple categories separated by comma
            for (const c of data[key].split(',')) {
                cards[data.id].categories.push(c)
            }
        }
        delete cards[data.id][key]
    }

    const imagePath = __dirname + '/../data/images/cards/' + data.id + '.ja.jpg'
    if (!fs.existsSync(imagePath)) {
        const res = await fetch(cardImage.getAttribute('src'))
        const fileStream = fs.createWriteStream(imagePath, { flags: 'w' })
        await finished(Readable.fromWeb(res.body).pipe(fileStream))
    }
}

const targetPath = __dirname + '/../data/cards_ja.json'
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
    const key = `colors.${c.color}`
    if (key in colorsFileContent) {
        continue
    }
    colorsFileContent[key] = c.color
}
fs.writeFileSync(__dirname + '/../data/colors_ja.json', JSON.stringify(colorsFileContent, null, '    '))