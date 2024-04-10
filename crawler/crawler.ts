import {fetchHtmlDom} from "./html";
import * as fs from "fs";
import {Readable} from "stream";
import {finished} from 'stream/promises';

const url = 'https://www.takaratomy.co.jp/products/conan-cardgame/cardlist';

const result = await fetchHtmlDom(url)
for (const cardImage of result.querySelectorAll('#cardList img')) {
    const res = await fetch(cardImage.getAttribute('src'))

    const data = JSON.parse(cardImage.getAttribute('data') || '')
    fs.writeFileSync('../cards/' + data.id + '.ja.json', JSON.stringify(data, null, 4))

    const fileStream = fs.createWriteStream('../cards/' + data.id + '.ja.jpg', { flags: 'w' });
    await finished(Readable.fromWeb(res.body).pipe(fileStream))
}