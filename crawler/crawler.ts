import {fetchHtmlDom} from "./html";
import * as fs from "fs";
import {Readable} from "stream";
import {finished} from 'stream/promises';

const url = 'https://www.takaratomy.co.jp/products/conan-cardgame/cardlist'

const result = await fetchHtmlDom(url)
const cards = [];
for (const cardImage of result.querySelectorAll('#cardList img')) {
    const data = JSON.parse(cardImage.getAttribute('data') || '')
    cards.push(data)

    const imagePath = '../website/assets/cards/' + data.id + '.ja.jpg'
    if (!fs.existsSync(imagePath)) {
        const res = await fetch(cardImage.getAttribute('src'))
        const fileStream = fs.createWriteStream(imagePath, { flags: 'w' })
        await finished(Readable.fromWeb(res.body).pipe(fileStream))
    }
}

const targetPath = '../website/data/cards_ja.json'
const sortedCards = cards.sort((a, b) => Number(a.card_num) < Number(b.card_num) ? -1 : 1)
fs.writeFileSync(targetPath, JSON.stringify(sortedCards))