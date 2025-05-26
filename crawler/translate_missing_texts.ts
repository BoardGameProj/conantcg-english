import * as deepl from 'deepl-node';
import {findMissingFiles} from "./src/find_missing_texts";
import fs from "fs";

const deeplClient = new deepl.DeepLClient(process.env.DEEPL_API_KEY);

(async () => {
    const missingFiles = findMissingFiles();
    for (const file of missingFiles) {
        const missingTranslations = file.missingTranslations.filter((s) => s.key)
        if (!missingTranslations.length) {
            return
        }

        const translationData = JSON.parse(fs.readFileSync(file.sourceFile).toString())


        const originalTexts = []
        for (const missingTranslation of missingTranslations) {
            if (missingTranslation.key in originalTexts) {
                continue
            }
            originalTexts[missingTranslation.key] = missingTranslation.value
        }

        for (const key in originalTexts) {
            let value = originalTexts[key]
            if (!value) {
                continue
            }

            // Remove unneeded texts from value
            value = value.replace('〚迅速〛（登場したターンからすぐに推理かアクションできる）', '〚迅速〛')
            value = value.replace('〚ミスリード1〛（相手の推理に対し、スリープさせることでLP－1する）', '〚ミスリード1〛')
            value = value.replace('〚突撃〛（登場したターンからすぐにアクションできる）', '〚突撃〛')
            value = value.replace('〚突撃［キャラ］〛（登場したターンからすぐにキャラを指定してアクションできる）', '〚突撃［キャラ］〛')
            value = value.replace('〚突撃［事件］〛（登場したターンからすぐに事件を指定してアクションできる）', '〚突撃［事件］〛')
            value = value.replace('〚ブレット〛（このキャラのアクションはガードできない）', '〚ブレット〛')
            value = value.replace('〚捜査1〛（相手はデッキのカードを上から指定の数だけ公開し、好きな順番でデッキの下に移す）', '〚捜査1〛')
            value = value.replace('〚捜査2〛（相手はデッキのカードを上から指定の数だけ公開し、好きな順番でデッキの下に移す）', '〚捜査2〛')
            value = value.replace('〚捜査X〛（相手はデッキのカードを上から指定の数だけ公開し、好きな順番でデッキの下に移す）', '〚捜査X〛')

            if (key.endsWith('.hirameki')) {
                value = value.replace(/^【ヒラメキ】（証拠からリムーブされるときに発動する）/, '')
                value = value.replace(/^【ヒラメキ】/, '')
                value = value.replace(/（証拠からリムーブされるときに発動する）$/, '')
            }
            if (key.endsWith('.cut_in')) {
                value = value.replace(/^【カットイン】/, '')
                value = value.replace(/（コンタクト中に手札からリムーブして使う）$/, '')
            }
            console.log([key, value])

            const result = await deeplClient.translateText<string>(value, 'ja', 'en-US', {glossary: process.env.DEEPL_API_GLOSSARY_ID})
            if (!result.text) {
                return
            }
            translationData[key] = result.text
            fs.writeFileSync(file.sourceFile, JSON.stringify(translationData, null, 2))
        }
    }
})();