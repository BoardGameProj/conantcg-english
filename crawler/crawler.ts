import { fetchHtmlDom } from "./html";
import * as fs from "fs";
import { Readable } from "stream";
import config from "./config";

const url = 'https://www.takaratomy.co.jp/products/conan-cardgame/cardlist'

const responseToReadable = (response: Response) => {
    const reader = response.body.getReader();
    const rs = new Readable();
    rs._read = async () => {
        const result = await reader.read();
        if (!result.done) {
            rs.push(Buffer.from(result.value));
        } else {
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

    // 特殊处理：将 `B05005P` 改为 `B05005P1`
    // if (data.card_num === 'B05005P') {
    //     data.card_num = 'B05005P1';
    // }

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
            if (c !== ',') {
                colorList.push(c)
            }
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

// const qaFileContent = {}
// for (const card of Object.values(cards)) {
//     // 检查是否存在 q_a 字段且有内容
//     if (card.q_a && card.q_a.trim() !== '') {
//         const key = `q_a.${card.card_num}`
//         qaFileContent[key] = card.q_a.trim()
//     }
// }
// fs.writeFileSync(__dirname + '/../data/qa_ja.json', JSON.stringify(qaFileContent, null, '    '))

// const qaFileContent = {};
// const cardIdToUniqQA = {};
// for (const card of Object.values(cards)) {
//     if (card.q_a && card.q_a.trim() !== '') {
//         const trimmedQA = card.q_a.trim();
//         if (!cardIdToUniqQA[card.card_id]) {
//             cardIdToUniqQA[card.card_id] = new Set([trimmedQA]);
//         } else {
//             cardIdToUniqQA[card.card_id].add(trimmedQA);
//         }
//     }
// }
// for (const card of Object.values(cards)) {
//     if (card.q_a && card.q_a.trim() !== '') {
//         const trimmedQA = card.q_a.trim();
//         // 如果当前 card_id 的所有 q_a 完全一样（去重后只有1条）
//         if (cardIdToUniqQA[card.card_id].size === 1) {
//             const key = `q_a.${card.card_id}`;
//             // 只存储一次（避免重复）
//             if (!qaFileContent[key]) {
//                 qaFileContent[key] = trimmedQA;
//             }
//         }
//         // 如果当前 card_id 的 q_a 有不同的值（去重后 >1 条）
//         else {
//             const key = `q_a.${card.card_id}.${card.card_num}`;
//             qaFileContent[key] = trimmedQA;
//         }
//     }
// }
// fs.writeFileSync(__dirname + '/../data/qa_ja.json', JSON.stringify(qaFileContent, null, '    '));

const qaFileContent = {};
const cardIdToUniqQA = {};

// Helper function to normalize Q&A format
function normalizeQA(qa) {
    // Handle JSON-style Q&A format first
    if (qa.startsWith('{\"') && qa.endsWith('\"}')) {
        try {
            const jsonQA = JSON.parse(qa);
            let normalized = [];
            for (const [question, answer] of Object.entries(jsonQA)) {
                normalized.push(`Q：${question}\nA：${answer}`);
            }
            return normalized.join('\n\n');
        } catch (e) {
            // If parsing fails, keep original
        }
    }

    // Normalize line endings and spacing
    return qa.replace(/\r\n/g, '\n')  // Convert Windows line endings
        .replace(/\r/g, '\n')     // Convert old Mac line endings
        .replace(/\n \n/g, '\n\n')
        .replace(/Q. /g, 'Q：')
        .replace(/A. /g, 'A：')
        .replace(/？ /g, '？')
        .replace(/。 【/g, '。【')
        .replace(/か\nA/g, 'か？\nA')
        .trim();
}

for (const card of Object.values(cards)) {
    if (card.q_a && card.q_a.trim() !== '') {
        const normalizedQA = normalizeQA(card.q_a);
        if (!cardIdToUniqQA[card.card_id]) {
            cardIdToUniqQA[card.card_id] = new Set([normalizedQA]);
        } else {
            cardIdToUniqQA[card.card_id].add(normalizedQA);
        }
    }
}

for (const card of Object.values(cards)) {
    if (card.q_a && card.q_a.trim() !== '') {
        const normalizedQA = normalizeQA(card.q_a);

        if (cardIdToUniqQA[card.card_id].size === 1) {
            const key = `q_a.${card.card_id}`;
            if (!qaFileContent[key]) {
                qaFileContent[key] = normalizedQA;
            }
        } else {
            const key = `q_a.${card.card_id}.${card.card_num}`;
            qaFileContent[key] = normalizedQA;
        }
    }
}

fs.writeFileSync(__dirname + '/../data/qa_ja.json', JSON.stringify(qaFileContent, null, '    '));