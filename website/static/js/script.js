function kebabize(str) {
    let result = ''; // Use a single string to build the result
    for (let i = 0; i < str.length; i++) {
        let char = str[i];
        // Check if the character is uppercase
        if (char === char.toUpperCase() && i !== 0) { // Add a dash before uppercase letters, except the first character
            result += '-';
        }
        result += char.toLowerCase(); // Add the lowercase version of the current character to the result
    }
    return result;
}

const registeredForRendering = []
document.addEventListener("DOMContentLoaded", () => {
    for (const card of registeredForRendering) {
        card.render();
    }
}, { once: true });

class Card extends HTMLElement {
    data = {
        id: '',
        cardId: '',
        type: '',
        cardNum: '',
        title: '',
        originalTitle: '',
        product: '',
        color: '',
        rarity: '',
        promoDetails: '',
        categories: [],
        cost: 0,
        ap: 0,
        lp: 0,
        caseDifficultyFirst: 0,
        caseDifficultySecond: 0,
        illustrator: '',
        cardText: '',
    }

    popover = null

    // The browser calls this method when the element is
    // added to the DOM.
    connectedCallback() {
        this.data.id = this.getAttribute('id')
        this.data.cardId = this.getAttribute('card-id')
        this.data.type = this.getAttribute('type')
        this.data.cardNum = this.getAttribute('card-num')
        this.data.title = this.getAttribute('title')
        this.data.originalTitle = this.getAttribute('original-title')
        this.data.product = this.getAttribute('product')
        this.data.color = this.getAttribute('color')
        this.data.rarity = this.getAttribute('rarity')
        this.data.categories = this.getAttribute('categories').split(',')
        this.data.cost = this.getAttribute('cost')
        this.data.ap = this.getAttribute('ap')
        this.data.lp = this.getAttribute('lp')
        this.data.image = this.getAttribute('image')
        this.data.promoDetails = this.getAttribute('promo-details')
        this.data.caseDifficultyFirst = this.getAttribute('case-difficulty-first')
        this.data.caseDifficultySecond = this.getAttribute('case-difficulty-second')
        this.data.illustrator = this.getAttribute('illustrator') || ''
        this.data.spkey = []
        this.data.cardIdNum = [this.getAttribute('card-id'), this.getAttribute('card-num')].join(',');

        // Combine feature, hirameki, cut in into card text
        let feature = processMechanics(this.hasAttribute('feature') ? this.getAttribute('feature') : '')
        let hirameki = this.hasAttribute('hirameki') ? this.getAttribute('hirameki') : ''
        if (hirameki !== '') {
            hirameki = '<span class="text-orange-500 me-1">' + createTooltip('<img src="img/hirameki.svg" class="inline-icon">灵光一闪', '作为证据被移除时发动') + '</span> ' + hirameki
            this.data.spkey.push('灵光一闪')
        }
        let henso = this.hasAttribute('henso') ? this.getAttribute('henso') : ''
        if (henso !== '') {
            henso = '<span class="text-fuchsia-400 me-1">' + createTooltip('<img src="img/disguise.svg" class="inline-icon">变装', '从手牌中打出替换接触中的角色。将被替换的角色移入卡组底') + '</span> ' + processKeywords(henso)
            this.data.spkey.push('变装')
        }
        let cutIn = processMechanics(this.hasAttribute('cut-in') ? this.getAttribute('cut-in') : '')
        if (cutIn.length) {
            cutIn = '[介入] ' + cutIn
            this.data.spkey.push('介入')
        }
        if (!this.data.spkey || this.data.spkey.length === 0) {
            this.data.spkey = ['无']
        }
        this.data.cardText = [feature, hirameki, henso, cutIn].filter((s) => s !== '').join('\n\n');
        this.data.cardText = placeTooltips(processKeywords(this.data.cardText))

        this.data.rawText = [feature, hirameki, henso, cutIn].filter((s) => s !== '').join('').replace(/[\r\n\t\[\]]+/g, '')
        this.data.rawText = placeTooltips(processKeywords(this.data.rawText)).replaceAll(/<span class="tooltiptext">.*?<\/span>/g, '')
        this.data.rawText = this.data.rawText.replaceAll(/<.*?>/g, '').trim()

        if (this.data.rawText === "") {
            this.data.rawText = "无"
        }
        if (this.data.rarity === 'D') {
            this.data.rarity = "C"
        }
        this.data.custom = this.getAttribute('is-primary') === "true" ? "首次" : this.getAttribute('is-primary');
        const isChineseByProduct = (product) => {
            if (!product) return false;
            const productCode = product.trim().substring(0, 6);
            const validProducts = [
                "CT-D01", "CT-D02", "CT-D03", "CT-D04", "CT-D05", "CT-D06", // 新手卡组
                "CT-P01", "CT-P02",                                         // 补充包
            ];

            return validProducts.includes(productCode); // 直接检查是否在合法列表
        };
        const chinesePRCards = new Set([
            "PR002", "PR004", "PR005", "PR006", "PR007",
            "PR008", "PR009", "PR010", "PR011", "PR017",
            "PR018", "PR019", "PR020", "PR021", "PR022",
            "PR023", "PR034", "PR035", "PR038", "PR052"
        ]);
        const isChinese = isChineseByProduct(this.data.product) || chinesePRCards.has(this.data.cardNum) ? "中文" : "no";
        this.data.custom = `${this.data.custom},${isChinese}`;


        // Prepare filter attributes
        const ignoreFilterAttributes = ['image']
        for (let setting of Object.keys(this.data)) {
            if (ignoreFilterAttributes.includes(setting)) {
                continue
            }
            let value = this.data[setting]
            if (['cardText'].includes(setting) && ['', '-'].includes(value)) {
                value = null
            }
            if (setting === 'categories') {
                if (!value || (value.length === 1 && value[0] === '')) {
                    value = ['无']
                }
                value = value.join(',')
            }
            if (['cost', 'ap', 'lp', 'key'].includes(setting)) {
                if (!value || (Array.isArray(value) && value.join('') === '')) {
                    value = ['无'];
                }
            }
            if (!value) {
                continue
            }
            this.setAttribute('data-filter-' + kebabize(setting), value)
            this.removeAttribute(setting)
        }

        registeredForRendering.push(this)
    }

    render() {
        //const shadow = this.attachShadow({mode: "open"});
        const img = document.createElement('img')
        const popoverId = `card-${this.data.id}`
        img.src = this.data.image
        img.setAttribute('loading', 'lazy')
        img.classList.add('cursor-pointer', 'border', 'rounded-md')
        img.width = 160
        img.height = 222
        img.alt = `${this.data.title} (${this.data.cardNum})`
        this.appendChild(img)
        //shadow.appendChild(wrapper)

        const overlaySelector = '#DCT-Overlays #' + popoverId
        // bind click ourselves so we can close it with a button. otherwise _hideHandler messes up
        img.addEventListener('click', () => {
            this.prepareOverlays(img)
            window.dispatchEvent(new Event('resize'))
            this.popover._targetEl = document.querySelector(overlaySelector)
            this.popover._initialized = false
            this.popover.init()
            this.popover.show()
        })
    }

    prepareOverlays(img) {
        if (this.popover) {
            return
        }
        if (!document.getElementById('DCT-Overlays')) {
            const container = document.createElement('div')
            container.id = 'DCT-Overlays'
            document.body.appendChild(container)
        }
        const container = document.getElementById('DCT-Overlays')

        const labels = {
            cardId: 'ID',
            cardNum: '编号',
            type: '类型',
            cardText: '效果',
            product: '产品',
            promoDetails: '分销',
            color: '颜色',
            rarity: '稀有度',
            categories: '特征',
            cost: '等级',
            ap: 'AP',
            lp: 'LP',
            illustrator: '画师',
            caseDifficultyFirst: '案件难度 (先手)',
            caseDifficultySecond: '案件难度 (后手)'
        }

        const fields = ['cardId', 'cardNum', 'type', 'color', 'cardText', 'rarity']
        if (this.data.type === '角色') {
            fields.push('categories')
        }
        if (this.data.type === '角色' || this.data.type === '事件') {
            fields.push('cost')
        }
        if (this.data.type === '角色') {
            fields.push('ap')
        }
        if (this.data.type === '角色' || this.data.type === '搭档') {
            fields.push('lp')
        }
        if (this.data.type === '案件') {
            fields.push('caseDifficultyFirst')
            fields.push('caseDifficultySecond')
        }
        if (this.data.rarity === 'PR') {
            fields.push('promoDetails')
        } else {
            fields.push('product')
        }
        if (this.data.illustrator.length && this.data.illustrator !== 'N/A') {
            fields.push('illustrator')
        }

        let content = ''
        for (const key of fields) {
            let value = this.data[key]
            if (Array.isArray(value)) {
                // Array values: keep words on one line, and join with comma
                value = value.map(v => v.replaceAll(' ', '&nbsp;')).join('，')
            }
            if (key === 'cardText') {
                value = value.replaceAll('\n', '<br>')
                if (value === '') {
                    value = '–'
                }
            }

            if (key === 'cardId') {
                content += `<div class="flex justify-between lg:py-0">
                    <div class="text-start font-bold" style="white-space: nowrap;">${labels[key]}</div>
                    <div class="text-end ms-4 card_details--${key} text-right">${value} <a href="/cards/?card-id-num=${value}">🔍</a></div>
                </div>`;
            } else if (key === 'cardNum') {
                let search = value.trim().substring(0, 6);
                content += `<div class="flex justify-between lg:py-0">
                    <div class="text-start font-bold" style="white-space: nowrap;">${labels[key]}</div>
                    <div class="text-end ms-4 card_details--${key} text-right">${value} <a href="/cards/?card-num=${search}">🔍</a></div>
                </div>`;
            } else if (key === 'rarity' && ['SRP', 'MRP', 'MRCP', 'SRCP', 'SEC'].includes(value)) {
                content += `<div class="flex justify-between lg:py-0">
                    <div class="text-start font-bold" style="white-space: nowrap;">${labels[key]}</div>
                    <div class="text-end ms-4 card_details--${key} card-rarity--yellow text-right">${value}</div>
                </div>`;
            } else {
                content += `<div class="flex justify-between lg:py-0">
                    <div class="text-start font-bold" style="white-space: nowrap;">${labels[key]}</div>
                    <div class="text-end ms-4 card_details--${key} text-right">${value}</div>
                </div>`;
            }
        }


        container.innerHTML += `<div data-popover id="card-${this.data.id}" role="tooltip"
     class="absolute z-10 invisible inline-block text-sm transition-opacity duration-300 border border-gray-200 rounded-lg shadow-lg opacity-0 dark:border-gray-600 bg-white dark:bg-warmgray-800 dark:text-white"
>
    <div class="flex items-start">
        <div class="cardoverlay-image self-stretch">
            <img src="${this.data.image}" alt="${this.data.title} (${this.data.cardNum})" class="rounded-xl" style="max-width: 300px;" loading="lazy" />
        </div>
        <!-- Add color here as well for mobile view -->
        <div class="dark:border-gray-600 bg-white dark:bg-warmgray-800 dark:text-white" style="min-width: 550px;max-width: 550px;">
            <div class="px-2 py-2 border-b rounded-t-lg border-gray-600 bg-gray-ß00 flex justify-between text-2xl lg:text-lg" class="dct-title">
                <h3 class="font-semibold text-gray-900 dark:text-white">${this.data.title}<small class="text-gray-300 card_font">&nbsp;${this.data.originalTitle}</small></h3>
                <button onclick="FlowbiteInstances.getInstance('Popover', 'card-${this.data.id}').hide()" class="font-bold text-red-700 text-2xl">❌</button>
            </div>
            <div class="px-2 py-2 text-lg lg:text-base">
                ${content}
            </div>
        </div>
    </div>
    <div data-popper-arrow></div>
</div>`
        this.popover = new Popover(
            document.querySelector(`#DCT-Overlays #card-${this.data.id}`),
            img,
            {
                placement: 'auto',
                triggerType: 'none',
                onShow: () => {
                    document.querySelector('body').classList.add('dct-card-shown')
                },
                onHide: () => {
                    document.querySelector('body').classList.remove('dct-card-shown')
                }
            }
        )
    }
}

// Register the CurrentDate component using the tag name <current-date>.
customElements.define('dct-card', Card);
