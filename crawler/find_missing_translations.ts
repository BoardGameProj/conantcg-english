import * as fs from "fs";
import config from "./config";

const files = {
    'cards_ja.json': {
        translationKeyPrefix: 'cards.{entry.card_id}.',
        idKey: 'id',
        referenceLink: config.dataDir + '/images/cards/{entry.card_num}.ja.jpg',
        requireKeys: ['title'],
        requireKeysIfNotEmpty: ['feature', 'hirameki', 'cut_in']
    }
}

function hasAnyLocalizationKey(prefix: string, translationKeys: string[]): boolean {
    for (const key of translationKeys) {
        if (key.startsWith(prefix)) {
            return true
        }
    }
    return false
}
function hasExactLocalizationKey(targetKey: string, translationKeys: string[]): boolean {
    for (const key of translationKeys) {
        if (key === targetKey) {
            return true
        }
    }
    return false
}

for (const fileName in files) {
    const originData = JSON.parse(fs.readFileSync(config.dataDir + '/' + fileName).toString())
    const translationFile = fileName.replace(/_ja\.json$/, '.en.json')
    const translationData = JSON.parse(fs.readFileSync(config.dataDir + '/translations/' + translationFile).toString())
    const translationKeys = Object.keys(translationData)
    for (const entry of Object.values(originData)) {
        let localizationPrefix = files[fileName].translationKeyPrefix
        let referenceLink = files[fileName].referenceLink || ''
        for (const key of Object.keys(entry)) {
            referenceLink = referenceLink.replace(`{entry.${key}}`, entry[key])
            localizationPrefix = localizationPrefix.replace(`{entry.${key}}`, entry[key])
        }
        if (!hasAnyLocalizationKey(localizationPrefix, translationKeys)) {
            console.warn(`No translation defined for data with id ${entry[files[fileName].idKey]} (looking for "${localizationPrefix}") ${referenceLink}`)
        }
        for (const key of files[fileName].requireKeys) {
            if (!hasExactLocalizationKey(localizationPrefix + key, translationKeys)) {
                console.warn(`Missing translation key "${localizationPrefix + key}" for data with id ${entry[files[fileName].idKey]} (looking for "${localizationPrefix}") ${referenceLink}`)
            }
        }
        for (const key of files[fileName].requireKeysIfNotEmpty) {
            if (!entry[key]) {
                continue
            }
            if (!hasExactLocalizationKey(localizationPrefix + key, translationKeys)) {
                console.warn(`Missing translation key "${localizationPrefix + key}" for data with id ${entry[files[fileName].idKey]} (looking for "${localizationPrefix}") ${referenceLink}`)
            }
        }
    }
}