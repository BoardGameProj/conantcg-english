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

// 函数：根据cards_ja数据生成版本信息
function generateVersionData(cardData: Record<string, any>): Record<string, any> {
    const groupedCards: Record<string, string[]> = {};

    // 按card_id分组卡片
    for (const [cardNum, cardInfo] of Object.entries(cardData)) {
        const cardId = cardInfo["card_id"];
        if (!cardId) {
            console.warn(`卡片 ${cardNum} 没有 card_id 字段，跳过`);
            continue;
        }

        if (!groupedCards[cardId]) {
            groupedCards[cardId] = [];
        }
        groupedCards[cardId].push(cardNum);
    }

    const versionData: Record<string, any> = {};

    // 为每个卡片创建版本信息
    for (const [cardId, cardNumbers] of Object.entries(groupedCards)) {
        if (cardNumbers.length === 0) {
            continue;
        }

        // 设置主版本（第一个卡片）
        const firstCardNum = cardNumbers[0];
        versionData[firstCardNum] = {
            "is_primary": true,
            "card_id": cardId,
            "other_versions": cardNumbers.length > 1 ? cardNumbers.slice(1) : [],
        };

        // 为其他版本设置信息
        for (const otherNum of cardNumbers.slice(1)) {
            versionData[otherNum] = {
                "is_primary": false,
                "card_id": cardId,
                "other_versions": cardNumbers.filter((n: string) => n !== otherNum),
            };
        }
    }

    console.log(`生成版本信息：共 ${Object.keys(groupedCards).length} 个唯一 card_id，处理 ${Object.keys(versionData).length} 张卡片`);
    return versionData;
}

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

    // 对 cards_ja 特殊处理：先合并所有 additional 文件，再生成版本信息
    if (file === 'cards_ja') {
        // 1. 先合并所有现有的 additional 文件
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

        // 2. 基于最终合并的数据生成版本信息
        const versionData = generateVersionData(fileContent);

        // 3. 将版本信息合并到数据中
        fileContent = deepmerge(fileContent, versionData);

        console.log(`Cards data processed. Total cards: ${Object.keys(fileContent).length}`);

    } else {
        // 其他文件按原流程处理
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
    }

    fs.writeFileSync(targetPath, JSON.stringify(fileContent))
}