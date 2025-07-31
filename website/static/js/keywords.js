const tooltips = []
function createTooltip(text, tooltipText, tag = 'span') {
    const html = '<' + tag + ' class="tooltip">' + text + '<span class="tooltiptext">' + tooltipText + '</span></' + tag + '>';
    tooltips.push(html)
    return '##TOOLTIP_' + tooltips.length + '##';
}
function placeTooltips(text) {
    const matches = text.matchAll(/##TOOLTIP_(\d+)##/g)
    for (const match of matches) {
        text = text.replaceAll(match[0], tooltips[match[1]-1])
    }
    return text
}

// Global function for styling and explaining keywords
function processKeywords(text) {
    // "square bracket" keywords, e.g. [On Play]
    const keywords = {
        '结案': {class: 'bg-black text-white text-sm p-0\.5 me-1 rounded-lg', tooltip: ''},
        '协助': {class: 'bg-black text-white text-sm p-0\.5 me-1 rounded-lg'},
        '解决篇': {class: 'bg-black text-white text-sm p-0\.5 me-1 rounded-lg', tooltip: '此能力只能在我方案件进入解决篇时使用'},
        '宣言': {class: 'bg-blue-500 text-white text-sm p-0\.5 me-1 rounded-lg', tooltip: ''},
        '蓝': {class: 'bg-blue-800 text-white card-color card-color-radius', tooltip: ''},
        '白': {class: 'bg-white card-color--Black card-color card-color-radius', tooltip: ''},
        '黑': {class: 'bg-black text-white card-color card-color-radius', tooltip: ''},
        '黄': {class: 'bg-yellow-300 card-color--Black card-color card-color-radius', tooltip: ''},
        '红': {class: 'bg-red-800 text-white card-color card-color-radius', tooltip: ''},
        '绿': {class: 'bg-green-700 text-white card-color card-color-radius', tooltip: ''},
        '(搭档: )([一-龥a-zA-Z0-9_]+)': {class: 'bg-pink-600 text-white text-sm p-0\.5 me-1 rounded-lg', label: '$2 <span class="card-color card-color--$3">$3</span>', tooltip: '此能力只能在我方搭档颜色是$3色时使用'},
        '(案件: )([一-龥a-zA-Z0-9_]+) & ([一-龥a-zA-Z0-9_]+)': {class: 'bg-pink-600 text-white text-sm p-0\.5 me-1 rounded-lg', label: '$2 <span class="card-color card-color--$3">$3</span> & <span class="card-color card-color--$4">$4</span>', tooltip: '此能力只能在我方案件的颜色拥有$3色和$4色时使用'},
        '(案件: )([一-龥a-zA-Z0-9_]+) or ([一-龥a-zA-Z0-9_]+)': {class: 'bg-pink-600 text-white text-sm p-0\.5 me-1 rounded-lg', label: '$2 <span class="card-color card-color--$3">$3</span> 或 <span class="card-color card-color--$4">$4</span>', tooltip: '此能力只能在我方案件的颜色拥有$3色或$4色时使用'},
        '(案件: )([一-龥a-zA-Z0-9_]+)': {class: 'bg-pink-600 text-white text-sm p-0\.5 me-1 rounded-lg', label: '$2 <span class="card-color card-color--$3">$3</span>', tooltip: '此能力只能在我方案件的颜色拥有$3色时使用'},
        '绊: (.*?)': {class: 'text-sm p-0\.5 me-1 rounded-lg', label: '<span class="bg-black text-white p-0\.5 rounded-l-lg">绊</span><span class="bg-white text-black p-0\.5 rounded-r-lg">$2</span>', tooltip: '此能力只能在我方现场存在卡名为“$2”的角色时使用'},
        '档案: (\\d+)': {class: 'text-sm p-0\.5 me-1 rounded-lg', label: '<span class="bg-red-700 text-white p-0.5 rounded-lg">档案 $2</span>', tooltip: '此能力只能在我方档案区至少有$2张牌时使用'},
        '回合①': {class: 'bg-cyan-400 text-white text-sm p-0\.5 me-1 rounded-lg', tooltip: '此能力每回合只能使用1次'},
        '回合②': {class: 'bg-cyan-400 text-white text-sm p-0\.5 me-1 rounded-lg', tooltip: '此能力每回合只能使用2次'},
        '从现场移除时': {class: 'bg-blue-500 text-white text-sm p-0\.5 me-1 rounded-lg', tooltip: '当此牌从现场移除时，激活此能力'},
        '登场时': {class: 'bg-blue-500 text-white text-sm p-0\.5 me-1 rounded-lg', tooltip: '当此牌于我方现场登场时，激活此能力'},
        '我方回合中': {class: 'bg-red-700 text-white text-sm p-0\.5 me-1 rounded-lg', tooltip: '此能力只能在我方回合时使用'},
        '对手回合中': {class: 'bg-yellow-500 text-white text-sm p-0\.5 me-1 rounded-lg', tooltip: '此能力只能在对手回合时使用'},
        '休眠': {class: 'bg-purple-400 text-white text-sm me-1 rounded-lg', label: '$1 <i class="fa-solid bg-purple-400"></i>', tooltip: '使用此能力需要将此牌休眠'},
        '介入': {class: 'text-blue-500', label: '<i class="fa-solid"></i> $1', tooltip: '接触时从手牌移除以使用'},
        '变装': {class: 'text-white text-sm', label: '<i class="fa-solid text-fuchsia-400">🎭</i><b>$1</b>', tooltip: ''},
        '变装时': {class: 'bg-fuchsia-400 text-white text-sm p-0\.5 me-1 rounded-lg', tooltip: '当此牌通过变装效果被打出时，激活此效果'}
    }
    for (const keyword in keywords) {
        const config = keywords[keyword]
        let tooltip = config.tooltip || ''
        let label = config.label || '$1'
        const pattern = new RegExp(`\\[(${keyword})\\]`, 'gi')
        const nonGlobalPattern = new RegExp(`\\[(${keyword})\\]`, 'i')
        if (tooltip) {
            const matches = text.match(pattern)
            if (!matches) {
                continue
            }
            for (const matchingLine of matches) {
                const localMatches = nonGlobalPattern.exec(matchingLine)
                if (!localMatches) {
                    continue
                }
                let localLabel = label
                let localTooltip = tooltip
                for (let i = 0; i < localMatches.length; i++) {
                    localLabel = localLabel.replaceAll('$' + Number(i+1), localMatches[(i+1)] || '')
                    localTooltip = localTooltip.replaceAll('$' + Number(i+1), localMatches[(i+1)] || '')
                }
                text = text.replace(nonGlobalPattern, '<span class="' + config.class + '">' + createTooltip(localLabel, localTooltip) + '</span>')
            }
        } else {
            text = text.replaceAll(pattern, '<span class="' + config.class + '">' + label + '</span>')
        }
    }

    // "curly cracket" keywords, e.g.  {迅速}
    const highlightKeywords = {
        '{误导 (\\d+)}': {tag: 'b', tooltip: "将此角色休眠，对手进行推理时LP-$2"},
        '{搜查 (X|\\d+)}': {tag: 'b', tooltip: "对手展示卡组顶$2张牌，然后以任意顺序移入卡组底"},
        '{迅速}(\\[.*\\])?': {tag: 'b', tooltip: '登场回合可以立刻进行推理或行动'},
        '{突击}\\[案件\\]': {tag: 'b', tooltip: '登场回合可以立刻以案件为对象进行行动'},
        '{突击}\\[角色\\]': {tag: 'b', tooltip: '登场回合可以立刻以角色为对象进行行动'},
        '{突击}(\\[.*\\])?': {tag: 'b', tooltip: '登场回合可以立刻进行行动'},
        '{弹丸}': {tag: 'b', tooltip: '此角色的行动不能被防卫'}
    }
    for (const keyword in highlightKeywords) {
        const config = highlightKeywords[keyword]
        const tag = config.tag || 'span'
        let label = config.label || '$1'
        let tooltip = config.tooltip || ''
        const pattern = new RegExp(`(${keyword})`, 'g')
        if (tooltip !== '') {
            const matches = pattern.exec(text)
            if (!matches) {
                continue
            }
            for (let i = 0; i < matches.length; i++) {
                tooltip = tooltip.replaceAll('$' + Number(i+1), matches[(i+1)] || '')
                label = label.replaceAll('$' + Number(i+1), matches[(i+1)] || '')
            }
            text = text.replaceAll(pattern, createTooltip(label.replace(/[{}]/g, ''), tooltip, tag))
        } else {
            text = text.replaceAll(pattern, `<${tag}>${label.replace(/[{}]/g, '')}</${tag}>`)
        }
    }
    return text
}

function processMechanics(text) {
    // Game mechanics, explained on the first occurrence in the text
    const mechanics = {
        '案件等级': {tooltip: '案件等级是指需要收集多少证据才能赢得游戏'},
        'Deductions?': {tooltip: 'Put the card to Sleep and gain Evidence based on its LP'},
        '能力': {tooltip: '“能力”是指在满足条件时可以使用的角色效果'},
        '效果': {tooltip: '“效果”一词是指事件牌的激活'},
        '接触': {tooltip: '当一名角色以对手角色为对象时发生接触'},
        '行动': {tooltip: 'An Action can be targeted against an opposing Case or Character.'},
        'Guard': {tooltip: 'A Character is put to Sleep in order to defend against an Action.'},
        '休眠': {tooltip: 'Sleeping characters can be targeted for Contact and cannot perform Actions.'},
        '眩晕': {tooltip: '处于眩晕状态的角色激活时改为休眠'},
        'Investigates?': {tooltip: 'Your opponent reveals the top card from their deck and places it at the bottom of the deck.'}
    }
    for (const mechanic in mechanics) {
        const config = mechanics[mechanic]
        const tag = config.tag || 'span'
        const tooltip = config.tooltip || ''
        if (!tooltip) {
            continue
        }
        const pattern = new RegExp(`([^\\[])(${mechanic})`)
        const matches = pattern.exec(text)
        if (!matches) {
            continue
        }
        text = text.replace(pattern, matches[1] + createTooltip((config.label || matches[2]), tooltip, tag))
    }
    return text
}