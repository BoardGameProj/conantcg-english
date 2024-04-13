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

    const imagePath = __dirname + '/../cards/images/' + data.id + '.ja.jpg'
    if (!fs.existsSync(imagePath)) {
        const res = await fetch(cardImage.getAttribute('src'))
        const fileStream = fs.createWriteStream(imagePath, { flags: 'w' })
        await finished(Readable.fromWeb(res.body).pipe(fileStream))
    }
}

const targetPath = __dirname + '/../cards/cards_ja.json'
const sortedCards = Object.fromEntries(Object.entries(cards).sort())
fs.writeFileSync(targetPath, JSON.stringify(sortedCards, null, '    '))