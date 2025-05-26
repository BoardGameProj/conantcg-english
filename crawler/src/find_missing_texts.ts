import config from "../config";
import fs from "fs";

const files = {
    'cards_ja.json': {
        translationKeyPrefix: 'cards.{entry.card_id}.',
        idKey: 'id',
        originId: 'card_num',
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

export function findMissingFiles(): {sourceFile: string, missingTranslations: {id: string, prefix: string, ref: string, key: string|null, value: string|null}[]}[] {
    const allMissingTranslations = []
    for (const fileName in files) {
        const originData = JSON.parse(fs.readFileSync(config.dataDir + '/' + fileName).toString())
        const translationFile = config.dataDir + '/translations/' + fileName.replace(/_ja\.json$/, '.en.json')
        const translationData = JSON.parse(fs.readFileSync(translationFile).toString())
        const translationKeys = Object.keys(translationData)
        const missingTranslations: {id: string, prefix: string, ref: string, key: string|null, value: string|null}[] = []
        for (const entry of Object.values(originData)) {
            let localizationPrefix: string = files[fileName].translationKeyPrefix
            let referenceLink = files[fileName].referenceLink || ''
            for (const key of Object.keys(entry)) {
                referenceLink = referenceLink.replace(`{entry.${key}}`, entry[key])
                localizationPrefix = localizationPrefix.replace(`{entry.${key}}`, entry[key])
            }
            if (!hasAnyLocalizationKey(localizationPrefix, translationKeys)) {
                missingTranslations.push({id: entry[files[fileName].idKey], prefix: localizationPrefix, ref: referenceLink, key: null, value: null})
            }
            for (const key of files[fileName].requireKeys) {
                if (!hasExactLocalizationKey(localizationPrefix + key, translationKeys)) {
                    missingTranslations.push({id: entry[files[fileName].idKey], prefix: localizationPrefix, ref: referenceLink, key: localizationPrefix + key, value: originData[entry[files[fileName].originId]][key]})
                }
            }
            for (const key of files[fileName].requireKeysIfNotEmpty) {
                if (!entry[key]) {
                    continue
                }
                if (!hasExactLocalizationKey(localizationPrefix + key, translationKeys)) {
                    missingTranslations.push({id: entry[files[fileName].idKey], prefix: localizationPrefix, ref: referenceLink, key: localizationPrefix + key, value: originData[entry[files[fileName].originId]][key]})
                }
            }
        }
        allMissingTranslations.push({sourceFile: translationFile, missingTranslations})
    }
    return allMissingTranslations
}