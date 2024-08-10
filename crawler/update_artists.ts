import * as fs from "fs";
import config from "./config";

const originData = JSON.parse(fs.readFileSync(config.dataDir + '/cards_ja.json').toString())
const illustrators = new Map<string, any[]>()
for (const entry of Object.values(originData)) {
    if (entry.illustrator === null) {
        continue
    }
    if (!illustrators.has(entry.illustrator)) {
        illustrators.set(entry.illustrator, [])
    }
    illustrators.get(entry.illustrator).push(entry)
}
const targetPath = config.dataDir + '/illustrators_ja.json'
const illustratorData = []
illustrators.forEach((value, key) => {
    illustratorData.push({
        name: key,
        cardNum: value.length,
        cards: value.map(function (c) {
            return {
                "card_num": c.card_num,
                "title": c.title,
                "package": c.package
            }
        })
    })
})
fs.writeFileSync(targetPath, JSON.stringify(illustratorData, null, '    '))