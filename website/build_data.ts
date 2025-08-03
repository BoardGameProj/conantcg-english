// This script builds the card data
// Data from official website may be incomplete, so we need to merge our additional data in there

import fs from "fs";
import path from "path";
import deepmerge from "deepmerge";

const jsonSourceFiles = [
    'cards_ja',
    'categories_ja',
    'products_ja',
    'illustrators_ja',
    'colors_ja',
    'types_ja'
]

for (const file of jsonSourceFiles) {
    const targetPath = path.join('data/', file + '.json');
    const additionalDataDir = path.join('../data/');

    const mainDataPath = path.join(additionalDataDir, file + '.json');
    const fileBuffer = fs.readFileSync(mainDataPath);
    let fileContent = JSON.parse(fileBuffer.toString());

    // 查找所有匹配的补充文件（如 *.additional1.json, *.additional2.json 等）
    const additionalFiles = fs.readdirSync(additionalDataDir)
        .filter(additionalFile =>
            additionalFile.startsWith(file + '.additional') &&
            additionalFile.endsWith('.json') &&
            additionalFile !== (file + '.json') // 排除主文件
        );


    for (const additionalFile of additionalFiles) {
        const additionalPath = path.join(additionalDataDir, additionalFile);
        try {
            const additionalBuffer = fs.readFileSync(additionalPath)
            const additionalContent = JSON.parse(additionalBuffer.toString());
            fileContent = deepmerge(fileContent, additionalContent)
            console.log(`Merged: ${additionalFile}`);
        } catch (err) {
            console.error(`Error merging ${additionalFile}:`, err)
        }
    }

    // 特殊处理 products_ja 和 types_ja
    if (file === 'products_ja') {
        fileContent = Object.fromEntries(
            Object.entries(fileContent).sort(([k1], [k2]) => k1 < k2 ? -1 : 1),
        );
        delete fileContent["products.PRカード"]
    } else if (file === 'types_ja') {
        delete fileContent['types.null']
    }


    fs.writeFileSync(targetPath, JSON.stringify(fileContent))
}