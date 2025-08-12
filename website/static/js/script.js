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

function copyToClipboard(element, event) {
    // 阻止事件冒泡，避免触发父元素的事件
    if (event) {
        event.stopPropagation();
    }

    // 保存原始文本和类
    const originalText = element.textContent;
    const originalClasses = element.className;

    // 防止重复点击
    if (element.dataset.copying === 'true') {
        return;
    }

    // 标记为正在复制中
    element.dataset.copying = 'true';

    // 获取要复制的文本 - 确保总是获取原始文本
    const textToCopy = originalText;

    // 更新UI反馈
    element.textContent = '已复制!';
    element.className = originalClasses + ' text-green-500'; // 添加成功样式

    // 使用Clipboard API
    navigator.clipboard.writeText(textToCopy)
        .catch(err => {
            console.error('复制失败:', err);
            // 降级方案：使用document.execCommand
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        })
        .finally(() => {
            // 恢复原始状态
            setTimeout(() => {
                element.textContent = originalText;
                element.className = originalClasses; // 完全恢复原始类
                element.dataset.copying = 'false';
            }, 500);
        });
}

const registeredForRendering = []
document.addEventListener("DOMContentLoaded", () => {
    for (const card of registeredForRendering) {
        card.render();
    }
}, { once: true });

const PopoverManager = {
    isAnyPopoverOpen: false,
    openPopover: null,

    setPopoverOpen: function (popoverInstance) {
        this.isAnyPopoverOpen = true;
        this.openPopover = popoverInstance;
    },

    setPopoverClosed: function () {
        this.isAnyPopoverOpen = false;
        this.openPopover = null;
    },

    shouldAllowHover: function () {
        return !this.isAnyPopoverOpen;
    }
};

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
    hoverTimeout = null

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
        this.data.otherVersions = (this.getAttribute('other-versions') || '').split(',').filter(Boolean);
        this.data.price = this.getAttribute('price') || ''
        this.data.spkey = []
        this.data.cardIdNum = [this.getAttribute('card-id'), this.getAttribute('card-num')].join(',');

        // Combine feature, hirameki, cut in into card text
        let feature = processMechanics(this.hasAttribute('feature') ? this.getAttribute('feature') : '')
        let henso = this.hasAttribute('henso') ? this.getAttribute('henso') : ''
        if (henso !== '') {
            henso = '<span class="henso-line mb-1 mt-1 rounded-lg"><span class="text-fuchsia-400 me-1">' + createTooltip('<img src="img/disguise.svg" class="inline-icon"><b class="whitespace-nowrap">变装</b>', '从手牌中打出替换接触中的角色。将被替换的角色移入卡组底') + '</span> ' + processKeywords(henso) + '</span>'
            this.data.spkey.push('变装')
        }
        let cutIn = processMechanics(this.hasAttribute('cut-in') ? this.getAttribute('cut-in') : '')
        if (cutIn.length) {
            cutIn = '<span class="cut-in-line mb-1 mt-1 rounded-lg"><b class="whitespace-nowrap px-1">[介入]</b> ' + cutIn + '</span>'
            this.data.spkey.push('介入')
        }
        let hirameki = this.hasAttribute('hirameki') ? this.getAttribute('hirameki') : ''
        if (hirameki !== '') {
            hirameki = '<span class="hirameki-line mb-1 mt-1 rounded-lg"><span class="text-orange-500 me-1">' + createTooltip('<img src="img/hirameki.svg" class="inline-icon"><b class="whitespace-nowrap">灵光一闪</b>', '作为证据被移除时发动') + '</span> <b>' + hirameki + '</b></span>'
            this.data.spkey.push('灵光一闪')
        }

        if (!this.data.spkey || this.data.spkey.length === 0) {
            this.data.spkey = ['无']
        }
        this.data.cardText = [feature, henso, cutIn, hirameki].filter((s) => s !== '').join('\n');
        this.data.cardText = placeTooltips(processKeywords(this.data.cardText))

        this.data.text = [feature, hirameki, henso, cutIn].filter((s) => s !== '').join('').replace(/[\s\r\n\t\[\]]+/g, '')
        this.data.text = placeTooltips(processKeywords(this.data.text)).replaceAll(/<span class="tooltiptext">.*?<\/span>/g, '')
        this.data.text = this.data.text.replaceAll(/<.*?>/g, '').trim()

        if (this.data.text === "") {
            this.data.text = "无"
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
            if (setting === 'color' && value.includes(',')) {
                value += ',多'
            }
            if (setting === 'categories') {
                if (!value || (value.length === 1 && value[0] === '')) {
                    value = ['无']
                }
                value = value.join(',')
            }
            if (setting === 'price') {
                if (!value || value === 'N/A') {
                    value = '无';
                } else {
                    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
                    const priceRange =
                        numericValue <= 1.0 ? '0~1' :
                            numericValue <= 10.0 ? '1~10' :
                                numericValue <= 50.0 ? '10~50' :
                                    numericValue <= 100.0 ? '50~100' :
                                        '100+';
                    value = priceRange;
                }
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
        img.classList.add('cursor-pointer', 'border', 'rounded-lg')
        img.width = 160
        img.height = 222
        img.alt = `${this.data.title} (${this.data.cardNum})`
        
        // 创建卡片容器
        const cardContainer = document.createElement('div')
        cardContainer.classList.add('card-container')
        
        // 添加图片到容器
        cardContainer.appendChild(img)
        
        // 创建"- 0 +"按钮组
        const buttonGroup = document.createElement('div');
        buttonGroup.classList.add('flex', 'items-center', 'justify-between', 'w-full', 'mt-2', 'hidden');
        buttonGroup.classList.add('add-to-deck-btn'); // 保留原有类名以便显示/隐藏控制

        // 减少按钮
        const minusButton = document.createElement('button');
        minusButton.type = 'button';
        minusButton.classList.add('w-10', 'h-6', 'bg-gray-500', 'text-white', 'rounded-lg', 'hover:bg-red-600', 'text-sm', 'flex', 'items-center', 'justify-center');
        minusButton.textContent = '-';
        minusButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.deckBuilder) {
                window.deckBuilder.removeCardFromCurrentDeck(this.data.cardNum);
            }
        });

        // 数量显示
        const countDisplay = document.createElement('span');
        countDisplay.classList.add('text-sm', 'text-white', 'font-medium');
        countDisplay.textContent = '0';

        // 增加按钮
        const plusButton = document.createElement('button');
        plusButton.type = 'button';
        plusButton.classList.add('w-10', 'h-6', 'bg-gray-500', 'text-white', 'rounded-lg', 'hover:bg-blue-600', 'text-sm', 'flex', 'items-center', 'justify-center');
        plusButton.textContent = '+';
        plusButton.addEventListener('click', (e) => {
            e.stopPropagation();
            addCardToDeck(this.data.cardNum);
        });

        // 组装按钮组
        buttonGroup.appendChild(minusButton);
        buttonGroup.appendChild(countDisplay);
        buttonGroup.appendChild(plusButton);

        // 添加按钮组到容器
        cardContainer.appendChild(buttonGroup);
        
        // 保存按钮组和数量显示的引用，以便后续更新
        this.buttonGroup = buttonGroup;
        this.countDisplay = countDisplay;
        
        // 将容器添加到组件
        this.appendChild(cardContainer)
        //shadow.appendChild(wrapper)

        const overlaySelector = '#DCT-Overlays #' + popoverId
        // bind click ourselves so we can close it with a button. otherwise _hideHandler messes up
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleClick(img, popoverId);
        });
        img.addEventListener('mouseenter', () => {
            if (window.innerWidth < 1026 || !PopoverManager.shouldAllowHover()) return;

            this.hoverTimeout = setTimeout(() => {
                if (!PopoverManager.isAnyPopoverOpen) {
                    this.handleHover(img, popoverId);
                }
            }, 50);
        });

        img.addEventListener('mouseleave', () => {
            if (this.hoverTimeout) {
                clearTimeout(this.hoverTimeout);
                this.hoverTimeout = null;
            }

            if (!PopoverManager.isAnyPopoverOpen && this.popover) {
                this.popover.hide();
            }
        });
    }
    handleClick(img, popoverId) {
        // 如果已经有弹窗打开，先关闭它
        if (PopoverManager.isAnyPopoverOpen && PopoverManager.openPopover !== this.popover) {
            PopoverManager.openPopover.hide();
        }

        this.prepareOverlays(img);
        window.dispatchEvent(new Event('resize'));
        this.popover._targetEl = document.querySelector('#DCT-Overlays #' + popoverId);
        this.popover._initialized = false;
        this.popover.init();
        this.popover.show();

        PopoverManager.setPopoverOpen(this.popover);
    }

    handleHover(img, popoverId) {
        this.prepareOverlays(img);
        window.dispatchEvent(new Event('resize'));
        this.popover._targetEl = document.querySelector('#DCT-Overlays #' + popoverId);
        this.popover._initialized = false;
        this.popover.init();
        this.popover.show();
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
        const popoverId = `card-${this.data.id}`

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
            caseDifficultySecond: '案件难度 (后手)',
            otherVersions: '其他版本',
            price: '参考价'
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
        if (this.data.otherVersions && this.data.otherVersions.length > 0) {
            fields.push('otherVersions')
        }
        if (this.data.illustrator.length && this.data.illustrator !== 'N/A') {
            fields.push('illustrator')
        }
        if (this.data.price.length && this.data.price !== 'N/A') {
            fields.push('price')
        }
        let content = ''
        for (const key of fields) {
            let value = this.data[key]
            if (Array.isArray(value)) {
                // Array values: keep words on one line, and join with comma
                value = value.map(v => v.replaceAll(' ', '&nbsp;')).join(', ')
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
                    <div class="text-end ms-4 card_details--${key} text-right">
                        <span class="copyable" onclick="copyToClipboard(this, event)">${value}</span>
                        <a href="/cards/?card-id-num=${value}"> 🔍</a></div>
                </div>`;
            } else if (key === 'cardNum') {
                let search = value.trim().substring(0, 6);
                content += `<div class="flex justify-between lg:py-0">
                    <div class="text-start font-bold" style="white-space: nowrap;">${labels[key]}</div>
                    <div class="text-end ms-4 card_details--${key} text-right">
                        <span class="copyable" onclick="copyToClipboard(this, event)">${value}</span>
                        <a href="/cards/?card-num=${search}"> 🔍</a>
                    </div>
                </div>`;
            } else if (key === 'categories') {
                const traits = value.split(',').map(v => v.trim()).filter(v => v);
                const wrappedValues = traits.map(val => {
                    return `<span class="mr-1 px-1 mt-1 rounded-lg text-sm font-bold text-categories">${val}</span>`;
                }).join('');
                content += `<div class="flex justify-between lg:py-0">
                <div class="text-start font-bold" style="white-space: nowrap;">${labels[key]}</div>
                <div class="text-end ms-4 card_details--${key} text-right">${wrappedValues}</div>
            </div>`;
            } else if (key === 'rarity' && ['SRP', 'MRP', 'MRCP', 'SRCP', 'SEC'].includes(value)) {
                content += `<div class="flex justify-between lg:py-0">
                    <div class="text-start font-bold" style="white-space: nowrap;">${labels[key]}</div>
                    <div class="text-end ms-4 card_details--${key} card-rarity--yellow text-right">${value}</div>
                </div>`;
            } else if (key === 'otherVersions') {
                const versions = value.split(',').map(v => v.trim()).filter(v => v);
                const wrappedValues = versions.map(val => {
                    const versionCard = document.querySelector(`dct-card[card-num="${val}"]`);
                    const versionImage = versionCard ? versionCard.getAttribute('image') : this.data.image;
                    return `<span class="version-hover inline-block mr-1 tooltiptext px-1 mt-1 rounded-lg text-xs" 
                                data-card-num="${val}" 
                                data-image="${versionImage}">
                            ${val}
                        </span>`;
                }).join('');

                // 其余部分保持不变
                content += `<div class="flex justify-between lg:py-0">
                <div class="text-start font-bold" style="white-space: nowrap;">${labels[key]}</div>
                <div class="text-end ms-4 card_details--${key} text-right">${wrappedValues}</div>
            </div>`;
            } else {
                content += `<div class="flex justify-between lg:py-0">
                    <div class="text-start font-bold" style="white-space: nowrap;">${labels[key]}</div>
                    <div class="text-end ms-4 card_details--${key} text-right">${value}</div>
                </div>`;
            }
        }


        container.innerHTML += `<div data-popover id="card-${this.data.id}" role="tooltip"
     class="absolute z-10 invisible inline-block text-sm transition-opacity duration-300 border border-gray-200 rounded-xl shadow-lg opacity-0 dark:border-gray-600 bg-white dark:bg-warmgray-800 dark:text-white"
>
    <div class="flex items-start">
        <div class="cardoverlay-image self-stretch">
            <img src="${this.data.image}" alt="${this.data.title} (${this.data.cardNum})" class="rounded-xl" style="max-width: 300px;" loading="lazy" />
        </div>
        <!-- Add color here as well for mobile view -->
        <div class="rounded-xl dark:border-gray-600 bg-white dark:bg-warmgray-800 dark:text-white" style="min-width: 540px;max-width: 560px;">
            <div class="px-2 py-2 border-b rounded-t-lg border-gray-600 bg-gray-ß00 flex justify-between text-2xl lg:text-lg" class="dct-title">
                <h3 class="font-semibold text-gray-900 dark:text-white">${this.data.title}<small class="dark:text-gray-300 card_font">&nbsp;${this.data.originalTitle}</small></h3>
                <button onclick="FlowbiteInstances.getInstance('Popover', 'card-${this.data.id}').hide()" class="font-bold text-red-700 text-2xl">❌</button>
            </div>
            <div class="px-2 py-2 text-lg lg:text-base">
                ${content}
            </div>
            </div>
        </div>
    </div>
    <div data-popper-arrow></div>
</div>`
        this.popover = new Popover(
            document.querySelector(`#DCT-Overlays #${popoverId}`),
            img,
            {
                placement: 'auto',
                triggerType: 'none',
                onShow: () => {
                    document.querySelector('body').classList.add('dct-card-shown');
                    this.initVersionHover();
                },
                onHide: () => {
                    document.querySelector('body').classList.remove('dct-card-shown');
                    const existingTooltip = document.querySelector('.version-tooltip');
                    if (existingTooltip) {
                        existingTooltip.remove();
                    }
                    PopoverManager.setPopoverClosed();
                }
            }
        );
        this.initVersionHover()
        document.addEventListener('click', (e) => {
            if (PopoverManager.isAnyPopoverOpen &&
                !e.target.closest('[data-popover]') &&
                !e.target.closest('.dct-card-shown')) {
                PopoverManager.openPopover.hide();
            }
        });
    }
    
    // 更新牌组中的卡牌数量显示
    updateDeckCount() {
        if (!this.buttonGroup || !this.countDisplay) return;
        
        // 默认数量为 0
        let count = 0;
        let sameCardIdCount = 0;
        let hasPartnerOrCase = false;

        if (window.deckBuilder?.addedCards) {
            // 统计所有 cardNum 匹配的卡牌总数
            count = window.deckBuilder.addedCards
                .filter(card => card.cardNum === this.data.cardNum)
                .reduce((sum, card) => sum + (card.count || 1), 0); // 如果 card.count 不存在，默认按 1 计算
            
            // 统计相同 card-id 的卡牌数量
            sameCardIdCount = window.deckBuilder.addedCards
                .filter(card => card.id === this.data.cardId)
                .reduce((sum, card) => sum + (card.count || 1), 0);
            
            // 检查是否已有搭档或案件卡牌
            hasPartnerOrCase = window.deckBuilder.addedCards.some(card =>
                (card.cardType === "搭档" && this.data.type === "搭档") ||
                (card.cardType === "案件" && this.data.type === "案件")
            );
        }
        
        // 更新数量显示
        this.countDisplay.textContent = count.toString();
        
        // 获取按钮组中的加减按钮
        const minusButton = this.buttonGroup.children[0];
        const countBUtton = this.buttonGroup.children[1];
        const plusButton = this.buttonGroup.children[2];
        
        // 隐藏/显示加号按钮
        if (plusButton) {
            // 同ID的卡牌数量达到3张时隐藏加号按钮
            if (sameCardIdCount >= 3) {
                plusButton.classList.add('invisible');
            }
            // 搭档或案件卡牌已有一张时隐藏加号按钮
            else if ((this.data.type === "搭档" || this.data.type === "案件") && hasPartnerOrCase) {
                plusButton.classList.add('invisible');
            }
            // 其他情况显示加号按钮
            else {
                plusButton.classList.remove('invisible');
            }
        }
        
        // 隐藏/显示减号按钮
        if (minusButton) {
            // 数量为0时隐藏减号按钮
            if (count === 0) {
                minusButton.classList.add('invisible');
                countBUtton.classList.add('invisible');
            }
            // 其他情况显示减号按钮
            else {
                minusButton.classList.remove('invisible');
                countBUtton.classList.remove('invisible');
            }
        }
    }

    initVersionHover() {
        const popoverId = `card-${this.data.id}`
        const overlay = document.querySelector(`#DCT-Overlays #${popoverId}`)
        if (!overlay) return

        // Clean up previous tooltip if it exists
        const existingTooltip = document.querySelector('.version-tooltip')
        if (existingTooltip) {
            existingTooltip.remove()
        }

        const tooltip = document.createElement('div')
        tooltip.className = 'version-tooltip'
        document.body.appendChild(tooltip)
        tooltip.style.pointerEvents = 'none'

        const isMobile = 'ontouchstart' in window

        const adjustTooltipPosition = (target) => {
            const tooltipWidth = 168
            const tooltipHeight = 223
            const padding = 10

            const targetRect = target.getBoundingClientRect()
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
            let top = targetRect.top - tooltipHeight - 5

            if (left < padding) left = padding
            else if (left + tooltipWidth > viewportWidth - padding) {
                left = viewportWidth - tooltipWidth - padding
            }
            
            const isBelow = top < padding
            if (top < padding) {
                top = targetRect.bottom + 5
            }

            tooltip.style.left = `${left}px`
            tooltip.style.top = `${top}px`
            tooltip.classList.toggle('tooltip-below', isBelow)
        }

        const showTooltip = (e, target) => {
            tooltip.innerHTML = `<img src="${target.dataset.image}" class="version-image dark:text-white" alt="${target.dataset.cardNum}" loading="lazy">`
            adjustTooltipPosition(target)
            tooltip.classList.add('visible')
        }

        const hideTooltip = () => {
            tooltip.classList.remove('visible')
        }

        const handleMouseOver = (e) => {
            const target = e.target.closest('.version-hover')
            if (!target) return
            showTooltip(e, target)
        }

        const handleMouseOut = () => {
            hideTooltip()
        }

        const handleClick = (e) => {
            const target = e.target.closest('.version-hover')
            if (!target) return

            if (tooltip.classList.contains('visible')) {
                hideTooltip()
            } else {
                showTooltip(e, target)
            }
        }

        // Clean up previous event listeners
        overlay.removeEventListener('mouseover', handleMouseOver)
        overlay.removeEventListener('mouseout', handleMouseOut)
        overlay.removeEventListener('click', handleClick)

        if (isMobile) {
            overlay.addEventListener('click', handleClick)
        } else {
            overlay.addEventListener('mouseover', handleMouseOver)
            overlay.addEventListener('mouseout', handleMouseOut)
        }
    }
}

// Register the CurrentDate component using the tag name <current-date>.
customElements.define('dct-card', Card);

// 通用的添加卡牌到牌组方法
function addCardToDeck(cardNum) {
    // 检查牌组构建面板是否已打开
    const panel = document.getElementById('deck-builder-panel');
    if (panel && !panel.classList.contains('hidden') && window.deckBuilder) {
        // 如果牌组构建面板已打开，添加卡牌到当前构建的牌组
        window.deckBuilder.addCardToCurrentDeck(cardNum);
    } else{
        alert('无法添加卡牌到牌组，请刷新页面后重试');
    }
}

// 牌组构建器
class DeckBuilder {
    constructor() {
        this.currentDeck = null;
        this.addedCards = [];
        this.init();
    }

    init() {
        this.bindEvents();
    }

    // 绑定事件
    bindEvents() {
        // 新建牌组按钮点击事件
        const newDeckBtn = document.getElementById('new-deck-btn');
        if (newDeckBtn) {
            newDeckBtn.addEventListener('click', () => {
                this.openDeckBuilderPanel();
            });
        }

        // 关闭牌组构建面板按钮点击事件
        const closeDeckBuilderBtn = document.getElementById('close-deck-builder');
        if (closeDeckBuilderBtn) {
            closeDeckBuilderBtn.addEventListener('click', () => {
                this.closeDeckBuilderPanel();
            });
        }

        // 保存牌组按钮点击事件
        const saveDeckBtn = document.getElementById('save-deck');
        if (saveDeckBtn) {
            saveDeckBtn.addEventListener('click', () => {
                this.saveDeck();
            });
        }
    }

    // 打开牌组构建面板
    openDeckBuilderPanel() {
        const panel = document.getElementById('deck-builder-panel');
        const newDeckBtn = document.getElementById('new-deck-btn');
        const deckBuilderPanelButton = document.getElementById('deck-builder-panel-button');
        if (panel) {
            // 初始化新的牌组
            this.currentDeck = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                name: '',
                cards: []
            };
            this.addedCards = [];
            
            // 清空输入框和已添加的卡牌列表
            const deckNameInput = document.getElementById('deck-name');
            if (deckNameInput) {
                deckNameInput.value = '';
            }

            const addedCardsContainer = document.getElementById('added-cards');
            if (addedCardsContainer) {
                addedCardsContainer.innerHTML = '';
                // 调用renderAddedCards方法来渲染空的40个格子
                this.renderAddedCards();
            }
            
            // 显示面板
            panel.classList.remove('hidden');
            deckBuilderPanelButton.classList.remove('hidden');
            newDeckBtn.classList.add('hidden');
            
            // 显示所有"添加到牌组"按钮
            const addToDeckButtons = document.querySelectorAll('.add-to-deck-btn');
            addToDeckButtons.forEach(button => {
                button.classList.remove('hidden');
            });
        }
    }

    // 关闭牌组构建面板
    closeDeckBuilderPanel() {
        const panel = document.getElementById('deck-builder-panel');
        const newDeckBtn = document.getElementById('new-deck-btn');
        const deckBuilderPanelButton = document.getElementById('deck-builder-panel-button');
        if (panel) {
            panel.classList.add('hidden');
            deckBuilderPanelButton.classList.add('hidden');
            
            // 隐藏所有"添加到牌组"按钮
            const addToDeckButtons = document.querySelectorAll('.add-to-deck-btn');
            addToDeckButtons.forEach(button => {
                button.classList.add('hidden');
                newDeckBtn.classList.remove('hidden');
            });
        }
    }

    // 添加卡牌到当前牌组
    addCardToCurrentDeck(cardNum) {
        // 获取卡牌元素以获取图片
        const cardElement = document.querySelector(`dct-card[card-num="${cardNum}"]`);
        const cardimage = cardElement ? cardElement.getAttribute('image') : '';
        const cardId  = cardElement ? cardElement.getAttribute('card-id') : '';
        const cardName  = cardElement ? cardElement.getAttribute('data-filter-title') : '';
        const cardType  = cardElement ? cardElement.getAttribute('data-filter-type') : '';

        // 检查搭档数量
        if (cardType === "搭档") {
            const partnerExists = this.addedCards.some(card => card.cardType === "搭档");
            if (partnerExists) {
                alert(`搭档数量不能超过1张`);
                return;
            }
        }
        if (cardType === "案件") {
        const caseExists = this.addedCards.some(card => card.cardType === "案件");
        if (caseExists) {
            alert(`案件数量不能超过1张`);
            return;
        }
        }
        
        // 检查同一 card-id 的卡牌是否已经超过3张
        const sameCardIdCount = this.addedCards
            .filter(card => card.id === cardId)
            .reduce((total, card) => total + card.count, 0);
        
        if (sameCardIdCount >= 3) {
            alert(`同一ID【${cardId}】的数量不能超过3张`);
            return;
        }
        
        this.addedCards.push({ id: cardId, cardName: cardName, cardType: cardType, cardNum: cardNum, imgsrc: cardimage, count: 1 });
        this.renderAddedCards();
    }

    // 从当前牌组中移除卡牌
    removeCardFromCurrentDeck(cardNum) {
        // 找到要移除的卡牌
        const cardIndex = this.addedCards.findIndex(card => card.cardNum === cardNum);
        if (cardIndex !== -1) {
            const card = this.addedCards[cardIndex];
            if (card.count > 1) {
                // 如果数量大于1，减少数量
                card.count -= 1;
            } else {
                // 如果数量为1，移除整个卡牌项
                this.addedCards.splice(cardIndex, 1);
            }
            this.renderAddedCards();
        }
    }

    // 渲染已添加的卡牌
    renderAddedCards() {
        // 获取所有不同的容器
        const containerDeck = document.getElementById('added-deck');
        const containerPartner = document.getElementById('added-partner');
        const containerCase = document.getElementById('added-case');
        const containerCards = document.getElementById('added-cards');
        
        // 如果容器不存在则返回
        if (!containerDeck || !containerPartner || !containerCase || !containerCards) return;
        
        // 按 cardNum 升序排列（只对普通卡牌排序）
        const sortedCards = [...this.addedCards].sort((a, b) => {
            // 如果 cardNum 为空，则排在最后
            if (!a.cardNum) return 1;
            if (!b.cardNum) return -1;
            
            // 比较 cardNum
            return a.cardNum.localeCompare(b.cardNum, undefined, {
                numeric: true,
                sensitivity: 'base'
            });
        });
        
        // 分离不同类型的卡牌
        const partnerCard = sortedCards.find(card => card.cardType === "搭档");
        const caseCard = sortedCards.find(card => card.cardType === "案件");
        const normalCards = sortedCards.filter(card => card.cardType !== "搭档" && card.cardType !== "案件");
        
        // 渲染搭档卡牌（最多1张）
        if (partnerCard) {
            containerPartner.innerHTML = this.renderCardItem(partnerCard);
        } else {
            containerPartner.innerHTML = this.renderEmptyPartnerSlot();
        }
        
        // 渲染案件卡牌（最多1张）
        if (caseCard) {
            containerCase.innerHTML = this.renderCardItem(caseCard);
        } else {
            containerCase.innerHTML = this.renderEmptyCaseSlot();
        }
        
        // 始终显示40个网格格子（4行，每行10列）的普通卡牌
        const totalSlots = 40;
        
        // 创建普通卡牌的网格容器
        let cardsHtml = `<div class="grid grid-cols-10 gap-2 grid-cards-custom" style="grid-template-rows: repeat(4, minmax(0, 1fr));">`;
        
        // 渲染普通卡牌
        normalCards.forEach(card => {
            cardsHtml += this.renderCardItem(card);
        });
        
        // 添加空的网格项以填充剩余空间
        const emptySlots = Math.max(0, totalSlots - normalCards.length);
        for (let i = 0; i < emptySlots; i++) {
            cardsHtml += this.renderEmptySlot();
        }
        
        cardsHtml += '</div>';
        containerCards.innerHTML = cardsHtml;
        
        // 绑定所有移除卡牌按钮事件
        this.bindRemoveCardEvents();
        
        // 更新所有卡片的数量显示
        this.updateAllCardCounts();
    };
    
    // 更新所有卡片的数量显示
    updateAllCardCounts() {
        // 获取所有卡片元素
        const allCards = document.querySelectorAll('dct-card');
        allCards.forEach(card => {
            if (typeof card.updateDeckCount === 'function') {
                card.updateDeckCount();
            }
        });
    };

    // 新的辅助方法：渲染单个卡牌项
    renderCardItem(card) {
        return `
            <div class="border border-dashed border-gray-900 dark:border-gray-400 rounded-lg p-1 flex flex-col items-center relative" style="">
                <div class="mb-1 relative w-full">
                    <img src=${card.imgsrc} class="w-full h-full content-center object-cover">
                    <div class="absolute bottom-0 left-0 right-0 to-transparent rounded-b-xl">
                        <p class="text-2xs text-white text-center bg-black truncate" style="--tw-bg-opacity: 0.7;">${card.cardName}</p>
                        <p class="text-2xs text-white text-center bg-black" style="--tw-bg-opacity: 0.7;">${card.id}/${card.cardNum}</p>
                    </div>
                </div>
                <button type="button" class="remove-card absolute top-0 right-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" data-card-num="${card.cardNum}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
    }

    // 新的辅助方法：渲染空位
    renderEmptySlot() {
        return `
            <div class="border border-dashed border-gray-900 dark:border-gray-400 rounded-lg p-1 flex flex-col items-center justify-center w-full" style="aspect-ratio: 1/1.4;">
                <div class="text-gray-400 text-xs">角色<br>事件</div>
            </div>
        `;
    };

    renderEmptyPartnerSlot() {
        return `
            <div class="border border-dashed border-gray-900 dark:border-gray-400 rounded-lg p-1 flex flex-col items-center justify-center w-full" style="aspect-ratio: 1/1.4;">
                <div class="text-gray-400 text-xs">搭档</div>
            </div>
        `;
    };

    renderEmptyCaseSlot() {
        return `
            <div class="border border-dashed border-gray-900 dark:border-gray-400 rounded-lg p-1 flex flex-col items-center justify-center w-full" style="aspect-ratio: 1.4/1;">
                <div class="text-gray-400 text-xs">案件</div>
            </div>
        `;
    };
    // 新的辅助方法：绑定移除卡牌事件
    bindRemoveCardEvents() {
        const removeButtons = document.querySelectorAll('.remove-card');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const cardNum = button.getAttribute('data-card-num');
                this.removeCardFromCurrentDeck(cardNum);
            });
        });
    }

    // 保存牌组
    saveDeck() {
        const deckNameInput = document.getElementById('deck-name');
        if (!deckNameInput) return;
        
        const deckName = deckNameInput.value.trim();
        if (!deckName) {
            alert('请输入牌组名称');
            return;
        }
        
        // 检查是否已添加卡牌
        if (this.addedCards.length === 0) {
            if (!confirm('未添加任何卡牌，确定要保存空牌组吗？')) {
                return;
            }
        }
        
        // 创建牌组数据
        const deck = {
            id: this.currentDeck.id,
            name: deckName,
            createTime: new Date(),
            lastModified: new Date(),
            cards: this.addedCards.map(card => ({
                id: card.id,
                cardNum: card.cardNum,
                count: card.count
            }))
        };
        
        // 保存到deckManager
        if (window.deckManager) {
            // 检查是否已存在同名牌组
            const existingDeck = window.deckManager.decks.find(d => d.name === deckName);
            if (existingDeck) {
                if (!confirm(`已存在同名片组 "${deckName}"，确定要覆盖吗？`)) {
                    return;
                }
                // 更新现有牌组
                existingDeck.cards = deck.cards;
                existingDeck.lastModified = new Date();
            } else {
                // 添加新牌组
                window.deckManager.decks.push({
                    id: deck.id,
                    name: deck.name,
                    createTime: new Date(deck.createTime),
                    lastModified: new Date(deck.lastModified),
                    cards: deck.cards
                });
            }
            
            // 保存牌组
            window.deckManager.saveDecks();
            
            // 关闭面板
            this.closeDeckBuilderPanel();
            
            alert('牌组保存成功');
        } else {
            alert('无法保存牌组，请刷新页面后重试');
        }
    }
}

// 初始化牌组构建器
document.addEventListener('DOMContentLoaded', () => {
    window.deckBuilder = new DeckBuilder();
});