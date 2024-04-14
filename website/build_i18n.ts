// This script combines all localization files into one i18n file for Hugo

import * as fs from "fs";
import * as path from "path";

const targetPath = __dirname + '/../website/i18n/en.json'
const sourceDir = __dirname + '/../data/translations/';
const fullFile = {}
for (const file of fs.readdirSync(sourceDir)) {
    if (!file.endsWith('.en.json')) {
        continue
    }
    const fileContent = JSON.parse(fs.readFileSync(path.join(sourceDir, file)).toString())
    Object.assign(fullFile, fileContent)
}
fs.writeFileSync(targetPath, JSON.stringify(fullFile))