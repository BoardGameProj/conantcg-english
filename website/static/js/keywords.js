const tooltips = []
function createTooltip(text, tooltipText, tag = 'span') {
    const html = '<' + tag + ' class="tooltip">' + text + '<span class="tooltiptext">' + tooltipText + '</span></' + tag + '>';
    tooltips.push(html)
    return '##TOOLTIP_' + tooltips.length + '##';
}
function placeTooltips(text) {
    const matches = text.matchAll(/##TOOLTIP_(\d+)##/g)
    for (const match of matches) {
        text = text.replaceAll(match[0], tooltips[match[1] - 1])
    }
    return text
}

// Global function for styling and explaining keywords
function processKeywords(text) {
    // "square bracket" keywords, e.g. [On Play]
    const keywords = {
        '结案': { class: 'font-normal bg-black text-white text-xs px-1 me-1 rounded', tooltip: '' },
        '销毁证据': { class: 'font-normal bg-black text-white text-xs px-1 me-1 rounded', tooltip: '' },
        '协助': { class: 'font-normal bg-black text-white text-xs px-1 me-1 rounded', tooltip: '' },
        '解决篇': { class: 'font-normal bg-black text-white text-xs px-1 me-1 rounded', tooltip: '我方案件为解决篇时，可使用此效果或能力' },
        '案件篇': { class: 'font-normal bg-black text-white text-xs px-1 me-1 rounded', tooltip: '我方案件为案件篇时，可使用此效果或能力' },
        '宣言': { class: 'font-normal bg-blue-500 text-white text-xs px-1 me-1 rounded', tooltip: '宣言使用能力，通过支付费用就能处理效果' },
        '蓝': { class: 'text-xs card-color--Blue card-color card-color-radius', tooltip: '' },
        '白': { class: 'text-xs bg-white card-color--White card-color card-color-radius', tooltip: '' },
        '黑': { class: 'text-xs bg-black text-white card-color card-color-radius card-color--Black', tooltip: '' },
        '黄': { class: 'text-xs card-color--Yellow card-color card-color-radius', tooltip: '' },
        '红': { class: 'text-xs card-color--Red text-white card-color card-color-radius', tooltip: '' },
        '绿': { class: 'text-xs card-color--Green card-color card-color-radius', tooltip: '' },
        '(搭档)(蓝|白|黑|黄|红|绿)': { class: 'bg-pink-600 text-white text-xs px-1 me-1 rounded', label: '搭档 <span class="card-color card-color--$3 card-color-radius">$3</span>', tooltip: '我方搭档颜色为$3色时生效' },
        '(案件)(YAIBA|浪漫洗牌|赤魔术)': { class: 'bg-pink-600 text-white text-xs px-1 me-1 rounded', label: '案件$3', tooltip: '<button class="search-form-btn" data-target-key="type" data-value="案件" data-target-key-1="categories" data-value-1="$3">我方案件特征为[$3]时生效</button>' },
        '(案件)(蓝|白|黑|黄|红|绿)&(蓝|白|黑|黄|红|绿)': { class: 'bg-pink-600 text-white text-xs px-1 me-1 rounded', label: '案件 <span class="card-color card-color--$3 card-color-radius">$3</span>&<span class="card-color card-color--$4 card-color-radius">$4</span>', tooltip: '我方案件颜色为$3色和$4色时生效' },
        '(案件)(蓝|白|黑|黄|红|绿)or(蓝|白|黑|黄|红|绿)': { class: 'bg-pink-600 text-white text-xs px-1 me-1 rounded', label: '案件 <span class="card-color card-color--$3 card-color-radius">$3</span>or<span class="card-color card-color--$4 card-color-radius">$4</span>', tooltip: '我方案件颜色为$3色或$4色时生效' },
        '(案件)(蓝|白|黑|黄|红|绿)': { class: 'bg-pink-600 text-white text-xs px-1 me-1 rounded', label: '案件 <span class="card-color card-color--$3 card-color-radius">$3</span>', tooltip: '我方案件颜色为$3色时生效' },
        '绊(.*?)': { class: 'text-xs px-1 me-1 rounded', label: '<span class="bg-black text-white px-1 rounded-l" style="box-shadow: 0 0 0 1px black;">绊</span><b class="bg-white font-bold text-black px-1 box-shadow-1 rounded-r">$2</b>', tooltip: '<button class="search-form-btn" data-target-key="card-name" data-value="$2">我方现场中存在卡名为[$2]的角色时生效</button>' },
        '档案(\\d)': { class: 'bg-red-700 text-xs pl-1 me-1 rounded-lg text-white', label: '档案<span class="text-xs card-color card-color-radius bg-white text-red-700 ring-1 ring-red-700">$2</span>', tooltip: '我方档案区中至少有$2张牌时生效' },
        '回合1': { class: 'bg-cyan-400 text-white text-xs pl-1 me-1 rounded-lg', label: '回合<span class="text-xs card-color card-color-radius bg-white text-cyan-400 ring-1 ring-cyan-400">1</span>', tooltip: '每回合只能发动1次' },
        '回合2': { class: 'bg-cyan-400 text-white text-xs pl-1 me-1 rounded-lg', label: '回合<span class="text-xs card-color card-color-radius bg-white text-cyan-400 ring-1 ring-cyan-400">2</span>', tooltip: '每回合最多发动2次' },
        '从现场移除时': { class: 'font-normal bg-blue-500 text-white text-xs px-1 me-1 rounded', tooltip: '此角色从现场被移除时发动' },
        '登场时': { class: 'font-normal bg-blue-500 text-white text-xs px-1 me-1 rounded', tooltip: '此角色于现场登场时发动' },
        '我方回合中': { class: 'font-normal bg-red-700 text-white text-xs px-1 me-1 rounded', tooltip: '在我方回合中生效' },
        '对手回合中': { class: 'font-normal bg-yellow-500 text-white text-xs px-1 me-1 rounded', tooltip: '在对手回合中生效' },
        '休眠': { class: 'font-normal bg-purple-400 text-white text-xs px-0\.5 me-1 rounded', label: '$1<img src="img/sleep.svg" class="inline-icon" style="height:1rem; vertical-align: sub;">', tooltip: '此角色由激活状态转为休眠状态' },
        '介入': { class: 'dark:text-white text-xs me-1', label: '<img src="img/cut_in.svg" class="inline-icon-small"><b>$1</b>', tooltip: '接触时从手牌移除以使用' },
        '变装': { class: 'dark:text-white text-xs me-1', label: '<img src="img/disguise.svg" class="inline-icon-small"><b>$1</b>', tooltip: '从手牌中打出替换接触中的角色。将被替换的角色移入卡组底' },
        '灵光一闪': { class: 'dark:text-white text-xs me-1', label: '<img src="img/hirameki.svg" class="inline-icon-small"><b>$1</b>', tooltip: '作为证据被移除时发动' },
        '变装时': { class: 'bg-fuchsia-400 text-white text-xs px-1 me-1 rounded', tooltip: '此角色使用<span class="text-fuchsia-400 me-1"><img src="img/disguise.svg" class="inline-icon">变装</span>进入现场时发动' },
        'MR能力.*?': { class: 'my-4', label: '<b class="bg-black text-white px-2 pt-0.5 pb-2 ring-1 dark:ring-white ring-black rounded-t">MR能力</b>\n<span class="mr-line rounded-b-lg rounded-tr-lg ring-1 dark:ring-white ring-black mb-2"><b class="pl-2 text-xs">若在对手回合中离开现场，移入搭档区。</b>\n<b class="pl-2 text-xs">若在我方现场中登场MR，移除此卡牌。</b></b></span>', tooltip: '' },
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
                    localLabel = localLabel.replaceAll('$' + Number(i + 1), localMatches[(i + 1)] || '')
                    localTooltip = localTooltip.replaceAll('$' + Number(i + 1), localMatches[(i + 1)] || '')
                }
                text = text.replace(nonGlobalPattern, '<span class="' + config.class + '">' + createTooltip(localLabel, localTooltip) + '</span>')
            }
        } else {
            text = text.replaceAll(pattern, '<span class="' + config.class + '">' + label + '</span>')
        }
    }

    // "curly cracket" keywords, e.g.  {迅速}
    const highlightKeywords = {
        '{弹丸}': { tag: 'b', tooltip: '此角色的行动不能被防卫' },
        '{误导(\\d+)}': { tag: 'b', tooltip: "将此角色休眠，对手进行推理时LP-$2" },
        '{搜查1}': { tag: 'b', tooltip: "对手展示卡组顶1张牌，然后以任意顺序移入卡组底" },
        '{搜查2}': { tag: 'b', tooltip: "对手展示卡组顶2张牌，然后以任意顺序移入卡组底" },
        '{搜查3}': { tag: 'b', tooltip: "对手展示卡组顶3张牌，然后以任意顺序移入卡组底" },
        '{搜查4}': { tag: 'b', tooltip: "对手展示卡组顶4张牌，然后以任意顺序移入卡组底" },
        '{搜查(X|\\d+)}': { tag: 'b', tooltip: "对手展示卡组顶$2张牌，然后以任意顺序移入卡组底" },
        '{迅速}': { tag: 'b', tooltip: '登场回合可以立刻进行推理或行动' },
        '{突击}［案件］': { tag: 'b', tooltip: '登场回合可以立刻以案件为对象进行行动' },
        '{突击}［角色］': { tag: 'b', tooltip: '登场回合可以立刻以角色为对象进行行动' },
        '{突击}［等级(\\d+)以(下|上)的角色］': { tag: 'b', tooltip: '登场回合可以立刻以等级$2以$3的角色为对象进行行动' },
        '{突击}': { tag: 'b', tooltip: '登场回合可以立刻进行行动' },
        '{特征不?为?［([^］}]*?)］}': { tag: 'b', tooltip: '<button class="search-form-btn" data-target-key="categories" data-value="$2">特征：[$2]🔍</button>' },
        '{卡名不?为?［([^］]*?)］}': { tag: 'b', tooltip: '<button class="search-form-btn" data-target-key="card-name" data-value="$2">卡名：[$2]🔍</button>' },
        '{[^}]*?}': { tag: 'b', tooltip: '' }
    }
    for (const keyword in highlightKeywords) {
        const config = highlightKeywords[keyword]
        const tag = config.tag || 'span'
        let label = config.label || '$1'
        let tooltip = config.tooltip || ''
        const pattern = new RegExp(`(${keyword})([，。！？：；.!?;:「」]?)`, 'g')
        if (tooltip !== '') {
            const matches = pattern.exec(text)
            if (!matches) {
                continue
            }
            for (let i = 0; i < matches.length; i++) {
                tooltip = tooltip.replaceAll('$' + Number(i + 1), matches[(i + 1)] || '')
                label = label.replaceAll('$' + Number(i + 1), matches[(i + 1)] || '')
            }
            text = text.replaceAll(pattern,
                '<span class="tooltip-container">' +
                createTooltip(label.replace(/[{}]/g, ''), tooltip, tag) +
                (matches[matches.length - 1] || '') +
                '</span>'
            )
        } else {
            if (config.label) {
                text = text.replace(pattern, config.label)
            } else {
                text = text.replaceAll(pattern, (match, p1, p2) => {
                    const cleanContent = p1.replace(/[{}]/g, '')
                    return `<${tag}>${cleanContent}</${tag}>${p2 || ''}`
                })
            }
        }
    }
    return text
}

function processMechanics(text) {
    // Game mechanics, explained on the first occurrence in the text
    const mechanics = {
        '案件等级': { tooltip: '案件等级是指需要收集多少证据才能赢得游戏' },
        '推理': { tooltip: '休眠该牌以获得基于该牌LP数量的证据' },
        '能力': { tooltip: '"能力"是指在满足条件时可发动的角色效果' },
        '效果': { tooltip: '"效果"是指事件牌发动' },
        '接触': { tooltip: '当进行「行动」的角色和作为对象/进行「防卫」的角色之间发生接触' },
        '行动': { tooltip: '「行动」对象可以是对手的案件或对手现场中处于休眠状态或眩晕状态的角色' },
        '防卫': { tooltip: '处于激活状态的角色对「行动」进行「防卫」，将进行防卫的角色转为休眠状态' },
        '休眠': { tooltip: '处于休眠状态的角色不能进行行动，可作为对象发生接触' },
        '眩晕': { tooltip: '处于眩晕状态的角色激活时改为休眠' },
        '刷新': { tooltip: '游戏中，当我方卡组没有卡牌时进行的处理。对手获得1个证据' },
        '从手牌使用': { tooltip: '通过提示使用也是「从手牌使用」' },
        '从手牌中使用': { tooltip: '通过提示使用也是「从手牌使用」' }
    }

    for (const mechanic in mechanics) {
        const config = mechanics[mechanic]
        const tag = config.tag || 'span'
        const tooltip = config.tooltip || ''
        if (!tooltip) {
            continue
        }

        // 修改这里：匹配关键词及其后的标点
        const pattern = new RegExp(`([^\\[])(${mechanic})([，。！？：；.!?;:「」]?)`)
        const matches = pattern.exec(text)
        if (!matches) {
            continue
        }

        // 修改这里：把标点也包进span里
        const keyword = matches[2]
        const punctuation = matches[3] || ''

        // 创建带标点的tooltip，但只给关键词加下划线
        text = text.replace(pattern,
            matches[1] +
            '<span class="tooltip-container">' +
            createTooltip(keyword, tooltip, tag) +
            punctuation +
            '</span>'
        )
    }
    return text
}