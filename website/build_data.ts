// This script builds the card data
// Data from official website may be incomplete, so we need to merge our additional data in there

import fs from "fs";
import path from "path";
import deepmerge from "deepmerge";

const jsonSourceFiles = [
    'cards_ja',
    'categories_ja',
    'products_ja',
    'colors_ja',
    'types_ja'
]

for (const file of jsonSourceFiles) {
    const targetPath = path.join('data/', file + '.json')
    const additionalDataFilePath = path.join('../data/', file + '.additional.json')

    const fileBuffer = fs.readFileSync(path.join('../data/', file + '.json'))
    let fileContent = JSON.parse(fileBuffer.toString())
    if (fs.existsSync(additionalDataFilePath)) {
        const additionalBuffer = fs.readFileSync(additionalDataFilePath)
        const additionalContent = JSON.parse(additionalBuffer.toString())
        fileContent = deepmerge(fileContent, additionalContent)
    }
    if (file === 'products_ja') {
        fileContent = Object.fromEntries(
            Object.entries(fileContent).sort(([k1], [k2]) => k1 < k2 ? -1 : 1),
        )
    }
    fs.writeFileSync(targetPath, JSON.stringify(fileContent))
}