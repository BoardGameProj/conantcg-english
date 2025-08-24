import { PopoverManager } from './PopoverManager.js';
import { DeckBuilder } from './DeckBuilder.js';
import { kebabize, copyToClipboard, registeredForRendering } from '../utils.js';

export class Card extends HTMLElement {
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
        registeredForRendering.push(this);
    }

    render() {
        // 1. 构建卡片的主要 HTML 结构
        const popoverId = `card-${this.data.id}`;
        const cardHtml = `
            <div class="card-container group relative">
                <!-- 卡片图片 -->
                <div class="flex relative">
                    <img 
                        src="${this.data.image}" 
                        loading="lazy" 
                        class="cursor-pointer border border-black dark:border-white rounded-lg select-none group-hover:scale-105" 
                        width="160" 
                        height="222" 
                        alt="${this.data.title} (${this.data.cardNum})"
                        data-popover-id="${popoverId}"
                    >
                    <!-- 拥有的卡牌计数器（默认隐藏） -->
                    <div class="absolute top-1 right-1 bg-black bg-opacity-90 text-white rounded-lg w-9 h-9 flex items-center justify-center text-sm font-bold z-8 border" 
                        style="display: none"
                        data-action="showcount">
                        0
                    </div>
                    
                    <!-- 独立定位的减号按钮（默认隐藏）-->
                    <button type="button" 
                            class="absolute bottom-1 left-1 border opacity-70 w-9 h-9 bg-red-500 text-white rounded-lg flex items-center justify-center select-none hover:opacity-100" 
                            style="display: none"
                            data-action="remove">
                        -
                    </button>
                    
                    <!-- 独立定位的加号按钮（默认隐藏）-->
                    <button type="button" 
                            class="absolute bottom-1 right-1 border opacity-70 w-9 h-9 bg-green-500 text-white rounded-lg flex items-center justify-center select-none hover:opacity-100" 
                            style="display: none"
                            data-action="add">
                        +
                    </button>
                </div>
                
                <!-- 卡组管理按钮组（默认隐藏） -->
                <div class="flex items-center justify-between w-full mt-2 hidden add-to-deck-btn">
                    <button type="button" class="w-10 h-6 bg-gray-500 text-white rounded-lg hover:bg-red-600 text-sm flex items-center justify-center select-none" data-action="deck-remove">
                        -
                    </button>
                    <span class="text-sm text-black dark:text-white font-medium select-none">0</span>
                    <button type="button" class="w-10 h-6 bg-gray-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center justify-center select-none" data-action="deck-add">
                        +
                    </button>
                </div>
            </div>
        `;

        // 2. 插入到 DOM
        this.insertAdjacentHTML('beforeend', cardHtml);

        // 3. 绑定事件和引用元素
        const container = this.querySelector('.card-container');
        const img = this.querySelector('img');

        // 保存引用
        this.ownCountDisplay = this.querySelector('[data-action="showcount"]');
        this.addOwnButton = this.querySelector('[data-action="add"]');
        this.removeOwnButton = this.querySelector('[data-action="remove"]');
        this.buttonGroup = this.querySelector('.add-to-deck-btn');
        this.countDisplay = this.querySelector('.add-to-deck-btn span');

        // 4. 绑定事件
        this.addOwnButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.updateOwnedCardCount(1);
        });

        this.removeOwnButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.updateOwnedCardCount(-1);
        });

        // 按钮组事件
        this.querySelector('[data-action="deck-remove"]').addEventListener('click', (e) => {
            e.stopPropagation();
            window.deckBuilder?.removeCardFromCurrentDeck(this.data.cardNum);
        });

        this.querySelector('[data-action="deck-add"]').addEventListener('click', (e) => {
            e.stopPropagation();
            window.deckBuilder?.addCardToDeck(this.data.cardNum);
        });

        // 5. 悬停事件（保持原有逻辑）
        container.addEventListener('mouseenter', () => {
            const showOwnedCards = this.shouldShowOwnedCards();
            const showEditOwnedCards = this.shouldShowEditOwnedCards();
            this.addOwnButton.style.display = (showOwnedCards && showEditOwnedCards) ? 'flex' : 'none';
            if (showOwnedCards && showEditOwnedCards) {
                const count = this.getOwnedCardsFromStorage()[this.data.cardNum] || 0;
                this.removeOwnButton.style.display = count > 0 ? 'flex' : 'none';
            }
        });

        container.addEventListener('mouseleave', () => {
            this.addOwnButton.style.display = 'none';
            this.removeOwnButton.style.display = 'none';
        });

        // 6. 图片点击/悬停事件（保持原有逻辑）
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleClick(img, popoverId);
        });

        img.addEventListener('mouseenter', () => {
            // 如果已经有固定弹窗打开，不触发悬停
            if (PopoverManager.isAnyPopoverOpen) return;

            if (window.innerWidth < 1026 || !PopoverManager.shouldAllowHover()) return;

            // 清除之前的定时器，防止累积
            if (this.hoverTimeout) {
                clearTimeout(this.hoverTimeout);
                this.hoverTimeout = null;
            }

            this.hoverTimeout = setTimeout(() => {
                // 再次检查是否已经有弹窗打开
                if (!PopoverManager.isAnyPopoverOpen) {
                    this.handleHover(img, popoverId);
                }
            }, 50);
        });

        img.addEventListener('mouseleave', () => {
            if (this._pendingAnimationFrame) {
                cancelAnimationFrame(this._pendingAnimationFrame);
                this._pendingAnimationFrame = null;
            }

            if (this.hoverTimeout) {
                clearTimeout(this.hoverTimeout);
                this.hoverTimeout = null;
            }

            if (!PopoverManager.isAnyPopoverOpen && this.popover) {
                this.popover.hide();
            }
        });

        // 初始化拥有的卡牌数量显示
        this.initOwnedCardCount();
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

        requestAnimationFrame(() => {
            if (PopoverManager.isAnyPopoverOpen && PopoverManager.openPopover !== this.popover) {
                PopoverManager.openPopover.hide();
            }
            this.popover.show();
            PopoverManager.setPopoverOpen(this.popover);
        });
    }

    handleHover(img, popoverId) {
        if (PopoverManager.isAnyPopoverOpen) {
            return;
        }

        cancelAnimationFrame(this._pendingAnimationFrame);

        this.prepareOverlays(img);
        window.dispatchEvent(new Event('resize'));
        this.popover._targetEl = document.querySelector('#DCT-Overlays #' + popoverId);
        this.popover._initialized = false;
        this.popover.init();

        this._pendingAnimationFrame = requestAnimationFrame(() => {
            if (PopoverManager.isAnyPopoverOpen) {
                return;
            }
            if (img.matches(':hover')) {
                this.popover.show();
            }
        });
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

        const existingOverlay = document.querySelector(`#DCT-Overlays #card-${this.data.id}`);
        if (existingOverlay) {
            existingOverlay.remove();
        }

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
                    <div class="text-start font-bold whitespace-nowrap" >${labels[key]}</div>
                    <div class="text-end ms-4 card_details--${key} text-right">
                        <span class="copyable" onclick="copyToClipboard(this, event)" style="cursor: copy;">${value}</span>
                        <button class="search-form-btn" data-target-key="card-id-num" data-value="${value}">🔍</button>
                    </div>
                </div>`;
            } else if (key === 'cardNum') {
                let search = value.trim().substring(0, 6);
                content += `<div class="flex justify-between lg:py-0">
                    <div class="text-start font-bold whitespace-nowrap">${labels[key]}</div>
                    <div class="text-end ms-4 card_details--${key} text-right">
                        <span class="copyable" onclick="copyToClipboard(this, event)" style="cursor: copy;">${value}</span>
                        <button class="search-form-btn" data-target-key="card-num" data-value="${value}">🔍</button>
                    </div>
                </div>`;
            } else if (key === 'categories') {
                const traits = value.split(',').map(v => v.trim()).filter(v => v);
                const wrappedValues = traits.map(val => {
                    return `<span class="mr-1 px-1 mt-1 rounded-lg text-sm font-bold text-categories"><button class="search-form-btn" data-target-key="categories" data-value="${val}">${val}</button></span>`;
                }).join('');
                content += `<div class="flex justify-between lg:py-0">
                <div class="text-start font-bold whitespace-nowrap">${labels[key]}</div>
                <div class="text-end ms-4 card_details--${key} text-right">${wrappedValues}</div>
            </div>`;
            } else if (key === 'rarity' && ['SRP', 'MRP', 'MRCP', 'SRCP', 'SEC'].includes(value)) {
                content += `<div class="flex justify-between lg:py-0">
                    <div class="text-start font-bold whitespace-nowrap">${labels[key]}</div>
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

                content += `<div class="flex justify-between lg:py-0">
                <div class="text-start font-bold whitespace-nowrap">${labels[key]}</div>
                <div class="text-end ms-4 card_details--${key} text-right">${wrappedValues}</div>
            </div>`;
            } else {
                content += `<div class="flex justify-between lg:py-0">
                    <div class="text-start font-bold whitespace-nowrap">${labels[key]}</div>
                    <div class="text-end ms-4 card_details--${key} text-right">${value}</div>
                </div>`;
            }
        }


        container.innerHTML += `<div data-popover id="card-${this.data.id}" role="tooltip"
                    class="absolute z-10 invisible inline-block text-sm transition-opacity duration-300 border border-gray-200 rounded-xl shadow-lg opacity-0 dark:border-gray-600 bg-white dark:bg-warmgray-800 dark:text-white">
            <div data-popper-arrow></div>
            <div class="flex items-start">
                <div class="cardoverlay-image self-stretch">
                    <div class="card-img-effect-container rounded-xl" style="width: fit-content; transform: rotateX(0) rotateY(0) !important;">
                        <img src="${this.data.image}" alt="${this.data.title} (${this.data.cardNum})"
                            class="card-img rounded-xl select-none" style="max-width: 300px;" loading="lazy" />
                        <div class="card-img-effect rounded-xl card-rarity-${this.data.rarity}"></div>
                    </div>
                </div>
                <div class="rounded-xl dark:border-gray-600 bg-white dark:bg-warmgray-800 dark:text-white" style="min-width: 540px;max-width: 560px;">
                    <div class="px-2 py-2 border-b rounded-t-lg border-gray-600 bg-gray-ß00 flex justify-between text-2xl lg:text-lg" class="dct-title">
                        <h3 class="font-semibold text-gray-900 dark:text-white"><span class="copyable" onclick="copyToClipboard(this, event)" style="cursor: copy;">${this.data.title}</span>&nbsp;<small class="copyable dark:text-gray-300 card_font" onclick="copyToClipboard(this, event)" style="cursor: copy;">${this.data.originalTitle}</small></h3>
                        <button onclick="FlowbiteInstances.getInstance('Popover', 'card-${this.data.id}').hide()" class="font-bold text-red-700 text-2xl">❌</button>
                    </div>
                    <div class="px-2 py-2 text-lg lg:text-base">
                        ${content}
                    </div>
                </div>
            </div>
        </div>`;

        this.popover = new Popover(
            document.querySelector(`#DCT-Overlays #${popoverId}`),
            img,
            {
                placement: 'auto',
                triggerType: 'none',
                onShow: () => {
                    document.querySelector('body').classList.add('dct-card-shown');
                    this.initVersionHover();
                    setTimeout(() => this.initRarityEffect(), 50);
                },
                onHide: () => {
                    document.querySelector('body').classList.remove('dct-card-shown');
                    const existingTooltip = document.querySelector('.version-tooltip');
                    if (existingTooltip) {
                        existingTooltip.remove();
                    }
                    PopoverManager.setPopoverClosed();

                    if (this.hoverTimeout) {
                        clearTimeout(this.hoverTimeout);
                        this.hoverTimeout = null;
                    }
                }
            }
        );

        this.initVersionHover();
        this.initRarityEffect();

        document.addEventListener('click', (e) => {
            if (PopoverManager.isAnyPopoverOpen &&
                !e.target.closest('[data-popover]') &&
                !e.target.closest('.dct-card-shown')) {
                PopoverManager.openPopover.hide();
            }

            if (!PopoverManager.isAnyPopoverOpen && PopoverManager.openPopover) {
                PopoverManager.setPopoverClosed();
            }
        });
    }

    updateDeckCount() {
        if (!this.buttonGroup || !this.countDisplay) return;

        let count = 0;
        let sameCardIdCount = 0;
        let hasPartnerOrCase = false;

        if (window.deckBuilder?.addedCards) {
            count = window.deckBuilder.addedCards
                .filter(card => card.cardNum === this.data.cardNum)
                .reduce((sum, card) => sum + (card.count || 1), 0);

            sameCardIdCount = window.deckBuilder.addedCards
                .filter(card => card.id === this.data.cardId)
                .reduce((sum, card) => sum + (card.count || 1), 0);

            hasPartnerOrCase = window.deckBuilder.addedCards.some(card =>
                (card.cardType === "搭档" && this.data.type === "搭档") ||
                (card.cardType === "案件" && this.data.type === "案件")
            );
        }

        this.countDisplay.textContent = count.toString();

        const minusButton = this.buttonGroup.children[0];
        const countBUtton = this.buttonGroup.children[1];
        const plusButton = this.buttonGroup.children[2];

        // 隐藏/显示加号按钮
        if (plusButton) {
            // 同ID的卡牌数量达到3张时隐藏加号按钮
            if (this.data.cardId != '0627' && sameCardIdCount >= 3) {
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

    // 更新拥有的卡牌数量
    updateOwnedCardCount(change) {
        const showOwnedCards = this.shouldShowOwnedCards();
        const shouldShowEditOwnedCards = this.shouldShowEditOwnedCards();
        if (!showOwnedCards) return;

        let ownedCards = this.getOwnedCardsFromStorage();
        let currentCount = ownedCards[this.data.cardNum] || 0;
        let newCount = currentCount + change;
        if (newCount < 0) newCount = 0;
        // 更新localStorage
        ownedCards[this.data.cardNum] = newCount;
        this.saveOwnedCardsToStorage(ownedCards);
        // 更新显示
        if (this.ownCountDisplay) {
            this.ownCountDisplay.textContent = newCount.toString();
            this.ownCountDisplay.style.display = newCount > 0 ? 'flex' : 'none';
        }
        if (this.removeOwnButton) {
            this.removeOwnButton.style.display = newCount > 0 ? 'flex' : 'none';
        }
        const panel = document.getElementById('deck-builder-panel');
        // 检查是否在卡组构建器中
        if (window.deckBuilder && typeof window.deckBuilder.renderAddedCards === 'function') {
            window.deckBuilder.renderAddedCards();
        }
    }

    // 从localStorage获取拥有的卡牌数据
    getOwnedCardsFromStorage() {
        try {
            const stored = localStorage.getItem('ownedCards');
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Error reading owned cards from localStorage:', e);
            return {};
        }
    }

    // 将拥有的卡牌数据保存到localStorage
    saveOwnedCardsToStorage(ownedCards) {
        try {
            localStorage.setItem('ownedCards', JSON.stringify(ownedCards));
        } catch (e) {
            console.error('Error saving owned cards to localStorage:', e);
        }
    }

    // 检查是否应该显示拥有的卡牌数量
    shouldShowOwnedCards() {
        // 从localStorage获取设置
        try {
            const settings = localStorage.getItem('cardSettings');
            if (settings) {
                const parsedSettings = JSON.parse(settings);
                return parsedSettings.showOwnedCards !== false; // 默认为true
            }
        } catch (e) {
            console.error('Error reading card settings from localStorage:', e);
        }
        return true; // 默认显示
    }

    shouldShowEditOwnedCards() {
        try {
            const settings = localStorage.getItem('cardSettings');
            if (settings) {
                const parsedSettings = JSON.parse(settings);
                // 只有当显式设置为true时才返回true
                return parsedSettings.showEditOwnedCards === true;
            }
        } catch (e) {
            console.error('Error reading card settings from localStorage:', e);
        }
        // 默认情况（包括出错、无设置等情况）
        return false;
    }

    // 初始化拥有的卡牌数量显示
    initOwnedCardCount() {
        // 检查是否启用显示拥有的卡牌数量
        const showOwnedCards = this.shouldShowOwnedCards();
        const showOwnedEditCards = this.shouldShowEditOwnedCards();
        if (this.ownCountDisplay) {
            this.ownCountDisplay.style.display = 'none';
        }

        const ownedCards = this.getOwnedCardsFromStorage();
        const count = ownedCards[this.data.cardNum] || 0;

        if (this.ownCountDisplay && showOwnedCards) {
            this.ownCountDisplay.textContent = count.toString();
            this.ownCountDisplay.style.display = count > 0 ? 'flex' : 'none';
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

    initRarityEffect() {
        const popoverId = `card-${this.data.id}`;
        const overlay = document.querySelector(`#DCT-Overlays #${popoverId}`);
        if (!overlay) return;

        const cardImage = overlay.querySelector('.cardoverlay-image');
        if (!cardImage) return;

        // 清理旧的监听器
        cardImage.removeEventListener('mousemove', this._rarityEffectMoveHandler);
        cardImage.removeEventListener('mouseenter', this._rarityEffectEnterHandler);
        cardImage.removeEventListener('mouseleave', this._rarityEffectLeaveHandler);
        cardImage.removeEventListener('touchmove', this._rarityEffectTouchHandler);
        cardImage.removeEventListener('touchstart', this._rarityEffectStartHandler);
        cardImage.removeEventListener('touchend', this._rarityEffectEndHandler);

        const container = cardImage.querySelector('.card-img-effect-container');
        const effect = cardImage.querySelector('.card-img-effect');
        const img = cardImage.querySelector('.card-img');

        if (!container || !effect || !img) return;

        // 共用的变换处理函数
        const applyTransform = (clientX, clientY) => {
            requestAnimationFrame(() => {
                if (!container.isConnected) return;

                const multiple = 15;
                const box = img.getBoundingClientRect();
                // container.style.transform = `rotateX(${((clientY - box.top - box.height / 2) / (box.height / 2) * 10).toFixed(2)}deg) 
                //            rotateY(${-((clientX - box.left - box.width / 2) / (box.width / 2) * 10).toFixed(2)}deg)`;
                const calcX = box && !isNaN(clientY) ? -(clientY - box.y - box.height / 2) / multiple : 0;
                const calcY = box && !isNaN(clientX) ? (clientX - box.x - box.width / 2) / multiple : 0;

                container.style.transform = "rotateX(" + calcX + "deg) " + "rotateY(" + calcY + "deg)";

                // 仅稀有度符合时才更新光效位置
                const allowedRarities = ['SRP', 'MRP', 'MRCP', 'SRCP', 'SEC'];
                if (allowedRarities.includes(this.data.rarity)) {
                    effect.style.setProperty('--per', `${((clientX - box.left) / box.width * 100).toFixed(2)}%`);
                    // const percentage = parseInt((clientX - box.x) / box.width * 1000) / 10;
                    // effect.style.setProperty(`--per: ${percentage}%`);
                }
            });
        };

        // 鼠标事件处理器
        this._rarityEffectMoveHandler = (e) => {
            applyTransform(e.clientX, e.clientY);
        };

        this._rarityEffectEnterHandler = () => {
            const allowedRarities = ['SRP', 'MRP', 'MRCP', 'SRCP', 'SEC'];
            if (allowedRarities.includes(this.data.rarity)) {
                effect.style.display = 'block';
                setTimeout(() => effect.style.opacity = '1', 10);
            }
        };

        this._rarityEffectLeaveHandler = () => {
            effect.style.opacity = '0';
            setTimeout(() => {
                if (effect.style.opacity === '0') {
                    effect.style.display = 'none';
                    container.style.transform = 'rotateX(0) rotateY(0)';
                }
            }, 300);
        };

        // 触摸事件处理器
        this._rarityEffectTouchHandler = (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                applyTransform(touch.clientX, touch.clientY);
            }
        };

        this._rarityEffectStartHandler = () => {
            this._rarityEffectEnterHandler();
        };

        this._rarityEffectEndHandler = () => {
            this._rarityEffectLeaveHandler();
        };

        // 添加监听器
        const isMobile = 'ontouchstart' in window;

        if (isMobile) {
            // 移动端使用触摸事件
            cardImage.addEventListener('touchstart', this._rarityEffectStartHandler);
            cardImage.addEventListener('touchmove', this._rarityEffectTouchHandler);
            cardImage.addEventListener('touchend', this._rarityEffectEndHandler);
        } else {
            // PC端使用鼠标事件
            cardImage.addEventListener('mousemove', this._rarityEffectMoveHandler);
            cardImage.addEventListener('mouseenter', this._rarityEffectEnterHandler);
            cardImage.addEventListener('mouseleave', this._rarityEffectLeaveHandler);
        }

        // 初始化状态
        container.style.transform = 'rotateX(0) rotateY(0)';
        effect.style.opacity = '0';
        effect.style.display = 'none';
    }
}

// 全局方法：切换显示拥有的卡牌数量
Card.toggleShowOwnedCards = function () {
    try {
        const settings = localStorage.getItem('cardSettings');
        let parsedSettings = {};
        if (settings) {
            parsedSettings = JSON.parse(settings);
        }

        parsedSettings.showOwnedCards = !parsedSettings.showOwnedCards;
        localStorage.setItem('cardSettings', JSON.stringify(parsedSettings));

        // 更新所有卡牌的显示
        const cards = document.querySelectorAll('dct-card');
        cards.forEach(card => {
            if (card.initOwnedCardCount) {
                card.initOwnedCardCount();
            }
        });

        return parsedSettings.showOwnedCards;
    } catch (e) {
        console.error('Error toggling show owned cards setting:', e);
        return false;
    }
};

Card.toggleShowEditOwnedCards = function () {
    try {
        const settings = localStorage.getItem('cardSettings');
        let parsedSettings = {};
        if (settings) {
            parsedSettings = JSON.parse(settings);
        }

        parsedSettings.showEditOwnedCards = !parsedSettings.showEditOwnedCards;
        localStorage.setItem('cardSettings', JSON.stringify(parsedSettings));

        // 更新所有卡牌的显示
        const cards = document.querySelectorAll('dct-card');
        cards.forEach(card => {
            if (card.initOwnedCardCount) {
                card.initOwnedCardCount();
            }
        });

        return parsedSettings.showEditOwnedCards;
    } catch (e) {
        console.error('Error toggling show owned cards setting:', e);
        return false;
    }
};
// 全局注册
customElements.define('dct-card', Card);