import * as deepl from 'deepl-node';
import fs from "fs";

const deeplClient = new deepl.DeepLClient(process.env.DEEPL_API_KEY);

(async () => {
    // Update glossary
    const glossary = await deeplClient.getMultilingualGlossary(process.env.DEEPL_API_GLOSSARY_ID)
    const glossaryEntries = await deeplClient.getMultilingualGlossaryDictionaryEntries(glossary, 'ja', 'en')

    // update character names in glossary
    const sourceData: any[] = Object.values(JSON.parse(fs.readFileSync(__dirname + '/../data/cards_ja.json').toString()))
    const translationData: any[] = JSON.parse(fs.readFileSync(__dirname + '/../data/translations/cards.en.json').toString())
    const relevantCards = sourceData.filter((d) => ['パートナー', 'キャラ'].includes(d.type))
    for (const card of relevantCards) {
        if (Object.keys(glossaryEntries.entries.entries()).includes(card.title)) {
            continue
        }
        if (!translationData['cards.' + card.card_id + '.title']) {
            continue
        }
        glossaryEntries.entries.add(card.title, translationData['cards.' + card.card_id + '.title'], true)
    }

    // update categories names in glossary
    const categoriesSourceData: any[] = JSON.parse(fs.readFileSync(__dirname + '/../data/categories_ja.json').toString())
    const categoriesTranslationData: any[] = JSON.parse(fs.readFileSync(__dirname + '/../data/translations/categories.en.json').toString())
    console.log('Syncing ' + Object.values(categoriesSourceData).length + ' categories with glossary')
    for (const key in categoriesSourceData) {
        const jpName = categoriesSourceData[key]
        if (Object.keys(glossaryEntries.entries.entries()).includes(jpName)) {
            continue
        }
        if (!categoriesTranslationData[key]) {
            continue
        }
        glossaryEntries.entries.add(jpName, categoriesTranslationData[key], true)
    }

    await deeplClient.updateMultilingualGlossaryDictionary(glossary, glossaryEntries);
})();