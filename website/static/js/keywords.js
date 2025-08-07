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
        '结案': {class: 'bg-black text-white text-sm px-1 me-1 rounded-lg', tooltip: ''},
        '协助': {class: 'bg-black text-white text-sm px-1 me-1 rounded-lg'},
        '解决篇': {class: 'bg-black text-white text-sm px-1 me-1 rounded-lg', tooltip: '此能力只能在我方案件为解决篇时使用'},
        '案件篇': {class: 'bg-black text-white text-sm px-1 me-1 rounded-lg', tooltip: '此能力只能在我方案件为案件篇时使用'},
        '宣言': {class: 'bg-blue-500 text-white text-sm px-1 me-1 rounded-lg', tooltip: ''},
        '蓝': {class: 'card-color--Blue card-color card-color-radius', tooltip: ''},
        '白': {class: 'bg-white card-color--White card-color card-color-radius', tooltip: ''},
        '黑': {class: 'bg-black text-white card-color card-color-radius', tooltip: ''},
        '黄': {class: 'card-color--Yellow card-color card-color-radius', tooltip: ''},
        '红': {class: 'card-color--Red text-white card-color card-color-radius', tooltip: ''},
        '绿': {class: 'card-color--Green card-color card-color-radius', tooltip: ''},
        '(搭档: )([一-龥a-zA-Z0-9_]+)': {class: 'bg-pink-600 text-white text-sm px-1 me-1 rounded-lg', label: '搭档 <span class="card-color card-color--$3 card-color-radius bg-white">$3</span>', tooltip: '此能力只能在我方搭档颜色是$3色时使用'},
        '(案件: )([一-龥a-zA-Z0-9_]+)&([一-龥a-zA-Z0-9_]+)': {class: 'bg-pink-600 text-white text-sm px-1 me-1 rounded-lg', label: '$2 <span class="card-color card-color--$3 card-color-radius">$3</span>&<span class="card-color card-color--$4 card-color-radius">$4</span>', tooltip: '此能力只能在我方案件的颜色拥有$3色和$4色时使用'},
        '(案件: )([一-龥a-zA-Z0-9_]+) 或 ([一-龥a-zA-Z0-9_]+)': {class: 'bg-pink-600 text-white text-sm px-1 me-1 rounded-lg', label: '$2 <span class="card-color card-color--$3 card-color-radius">$3</span>或<span class="card-color card-color--$4 card-color-radius">$4</span>', tooltip: '此能力只能在我方案件的颜色拥有$3色或$4色时使用'},
        '(案件: )([一-龥a-zA-Z0-9_]+)': {class: 'bg-pink-600 text-white text-sm px-1 me-1 rounded-lg', label: '$2 <span class="card-color card-color--$3 card-color-radius">$3</span>', tooltip: '此能力只能在我方案件的颜色拥有$3色时使用'},
        '绊: (.*?)': {class: 'text-sm px-1 me-1 rounded-lg', label: '<span class="bg-black text-white px-1 rounded-l-lg">绊</span><b class="bg-white text-blod text-black px-1 rounded-r-lg">$2</b>', tooltip: '此能力只能在我方现场存在卡名为“$2”的角色时使用'},
        '档案: (\\d+)': {class: 'bg-red-700 text-sm px-1 me-1 rounded-lg', label: '档案<span class="card-color card-color-radius bg-white" style="color: #c81e1e">$2</span>', tooltip: '此能力只能在我方档案区至少有$2张牌时使用'},
        '回合1': {class: 'bg-cyan-400 text-white text-sm px-1 me-1 rounded-lg', label: '回合<span class="card-color card-color-radius bg-white" style="color: #22d3ee">1</span>', tooltip: '此能力每回合只能使用1次'},
        '回合2': {class: 'bg-cyan-400 text-white text-sm px-1 me-1 rounded-lg', label: '回合<span class="card-color text-cyan-400 card-color-radius bg-white" style="color: #22d3ee">2</span>', tooltip: '此能力每回合只能使用2次'},
        '从现场移除时': {class: 'bg-blue-500 text-white text-sm px-1 me-1 rounded-lg', tooltip: '当此牌从现场移除时，激活此能力'},
        '登场时': {class: 'bg-blue-500 text-white text-sm px-1 me-1 rounded-lg', tooltip: '当此牌于我方现场登场时，激活此能力'},
        '我方回合中': {class: 'bg-red-700 text-white text-sm px-1 me-1 rounded-lg', tooltip: '此能力只能在我方回合时使用'},
        '对手回合中': {class: 'bg-yellow-500 text-white text-sm px-1 me-1 rounded-lg', tooltip: '此能力只能在对手回合时使用'},
        '休眠': {class: 'bg-purple-400 text-white text-sm px-0\.5 me-1 rounded-lg', label: '$1<img src="img/sleep.svg" class="inline-icon" style="height:1rem; vertical-align: sub;">', tooltip: '使用此能力需要将此牌休眠'},
        '介入': {class: 'text-blue-500', label: '<img src="img/cut_in.svg" class="inline-icon">$1', tooltip: '接触时从手牌移除以使用'},
        '变装': {class: 'text-white text-sm', label: '<img src="img/disguise.svg" class="inline-icon"><b>$1</b>', tooltip: ''},
        '灵光一闪': {class: 'text-white text-sm', label: '<img src="img/hirameki.svg" class="inline-icon"><b>$1</b>', tooltip: ''},
        '变装时': {class: 'bg-fuchsia-400 text-white text-sm px-1 me-1 rounded-lg', tooltip: '当此牌通过变装效果被打出时，激活此效果'}
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
        '推理': {tooltip: '休眠该牌以获得基于该牌LP数量的证据'},
        '能力': {tooltip: '“能力”是指在满足条件时可以使用的角色效果'},
        '效果': {tooltip: '“效果”一词是指事件牌发动'},
        '接触': {tooltip: '当一名角色以对手角色为对象时发生接触'},
        '行动': {tooltip: '行动目标可以是一个对手的案件或角色'},
        '防卫': {tooltip: '休眠一个角色以防卫某个行动'},
        '休眠': {tooltip: '休眠角色可作为对象进行接触，且无法执行行动'},
        '眩晕': {tooltip: '处于眩晕状态的角色激活时改为休眠'}
        // 'Investigates?': {tooltip: '对手展示卡组顶指定数量的牌，然后以任意顺序移入卡组底'}
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