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
        'Case Closed': {class: 'bg-black text-white text-sm p-1', tooltip: ''},
        'Assist': {class: 'bg-black text-white text-sm p-1'},
        'Resolution Phase': {class: 'bg-black text-white text-sm p-1', tooltip: 'This Ability can only be used when the case is in Resolution Phase.'},
        'Declare': {class: 'bg-blue-500 text-white text-sm p-1', tooltip: ''},
        '(Partner: )(\\w+)': {class: 'bg-pink-600 text-white text-sm p-1', label: '$2 <span class="card-color card-color--$3">$3</span>', tooltip: 'This Ability can be used when your Partner has the color $3.'},
        '(Case: )(\\w+) & (\\w+)': {class: 'bg-pink-600 text-white text-sm p-1', label: '$2 <span class="card-color card-color--$3">$3</span> & <span class="card-color card-color--$4">$4</span>', tooltip: 'This Ability can be used when your Case has the color $3 and $4.'},
        '(Case: )(\\w+)': {class: 'bg-pink-600 text-white text-sm p-1', label: '$2 <span class="card-color card-color--$3">$3</span>', tooltip: 'This Ability can be used when your Case has the color $3.'},
        'Bond: (.*?)': {class: 'text-sm p-1', label: '<span class="bg-black text-white p-1">Bond</span><span class="bg-white text-black p-1">$2</span>', tooltip: 'This Ability can be used when there is a "$2" on your Scene.'},
        'FILE: (\\d+)': {class: 'text-sm p-1', label: '<span class="bg-red text-white p-1">File $2</span>', tooltip: 'This Ability can be used when with a minimum of $2 cards in your File Area.'},
        'Once per Turn': {class: 'bg-cyan-400 text-white text-sm p-1', tooltip: 'This Ability can be used once per turn.'},
        'Twice per Turn': {class: 'bg-cyan-400 text-white text-sm p-1', tooltip: 'This Ability can be used twice per turn.'},
        'When Removed From Scene': {class: 'bg-blue-500 text-white text-sm p-1', tooltip: 'This Ability is activated, when the card is removed from the Scene.'},
        'When Played': {class: 'bg-blue-500 text-white text-sm p-1', tooltip: 'This Ability is activated, when the card is played to the Scene.'},
        'During Your Turn': {class: 'bg-red-700 text-white text-sm p-1', tooltip: 'This Ability can be used during your turn.'},
        'During Opponent\'s Turn': {class: 'bg-yellow-500 text-white text-sm p-1', tooltip: 'This Ability can be used during your opponent\'s turn.'},
        'Sleep': {class: 'bg-purple-400 text-white text-sm p-1', label: '$1 <i class="fa-solid"></i>', tooltip: 'The card needs to be put to Sleep, in order to use this Ability.'},
        'Cut In': {class: 'text-blue-500', label: '<i class="fa-solid"></i> $1', tooltip: 'You may use this during Contact by removing this card from your hand.'},
        'When Disguised': {class: 'bg-fuchsia-400 text-white text-sm p-1 me-1', tooltip: 'This effect activates, when this card is played via Disguise effect'}
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
                text = text.replace(nonGlobalPattern, '<span class="' + config.class + ' me-1">' + createTooltip(localLabel, localTooltip) + '</span>')
            }
        } else {
            text = text.replaceAll(pattern, '<span class="' + config.class + ' me-1">' + label + '</span>')
        }
    }

    // "curly cracket" keywords, e.g.  {Haste}
    const highlightKeywords = {
        '{Mislead (\\d+)}': {tag: 'i', tooltip: "When your opponent's card uses Deduction, you may Sleep this card to make that card lose $2 LP during this Deduction."},
        '{Investigation (X|\\d+)}': {tag: 'i', tooltip: "Your opponent reveals the top $2 card(s) their deck and places it at the bottom of the deck in any order."},
        '{Haste}(\\[.*\\])?': {tag: 'b', tooltip: 'This card can Deduce or take Action during the Turn it is played.'},
        '{Rush}(\\[.*\\])?': {tag: 'b', tooltip: 'This card can take Action during the Turn it is played.'},
        '{Bullet}': {tag: 'i', tooltip: 'When this Characters performs its Action, your opponent cannot Guard.'}
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
            text = text.replaceAll(pattern, createTooltip(label, tooltip, tag))
        } else {
            text = text.replaceAll(pattern, '<' + tag + '>' + label + '</' + tag + '>')
        }
    }
    return text
}

function processMechanics(text) {
    // Game mechanics, explained on the first occurrence in the text
    const mechanics = {
        'Case Level': {tooltip: 'The Case Level denotes how much Evidence you need to collect in order to win the game.'},
        'Deductions?': {tooltip: 'Put the card to Sleep and gain Evidence based on its LP'},
        'Abilit(y|ies)': {tooltip: '"Ability" refers to the effect of Characters that can be used, when the conditions are met.'},
        'Effects?': {tooltip: 'The term "Effects" refers to the activation of Event cards.'},
        'Contact': {tooltip: 'A Contact occurs, when a Character attacks an opposing Character.'},
        'Actions?': {tooltip: 'An Action can be targeted against an opposing Case or Character.'},
        'Guard': {tooltip: 'A Character is put to Sleep in order to defend against an Action.'},
        'Sleep(ing)?': {tooltip: 'Sleeping characters can be targeted for Contact and cannot perform Actions.'},
        'Stun(ned)?': {tooltip: 'When a Stunned Character would be set to Active, it is put to Sleep instead.'},
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