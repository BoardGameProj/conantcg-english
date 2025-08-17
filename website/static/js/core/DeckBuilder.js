import { showToast, showConfirm } from '../utils.js';

export class DeckBuilder {
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
                this.newDeckBuilderPanel();
            });
        }

        // 关闭牌组构建面板按钮点击事件
        const closeDeckBuilderBtn = document.getElementById('close-deck-builder');
        if (closeDeckBuilderBtn) {
            closeDeckBuilderBtn.addEventListener('click', async () => {
                await this.closeDeckBuilderPanel();
            });
        }
        const hideDeckBuilderBtn = document.getElementById('hide-deck-builder');
        if (hideDeckBuilderBtn) {
            hideDeckBuilderBtn.addEventListener('click', () => {
                this.hideDeckBuilderPanel();
            });
        }

        // 切换牌组构建面板可见性按钮点击事件（浮动按钮）
        const toggleDeckBuilderFloatingBtn = document.getElementById('toggle-deck-builder-floating');
        if (toggleDeckBuilderFloatingBtn) {
            toggleDeckBuilderFloatingBtn.addEventListener('click', () => {
                this.toggleDeckBuilderPanel();
            });
        }
        const openDeckBuilderBtn = document.getElementById('open-deck-btn');
        if (openDeckBuilderBtn) {
            openDeckBuilderBtn.addEventListener('click', () => {
                this.openDeckBuilderPanel();
            });
        }
        // 保存牌组按钮点击事件
        const saveDeckBtn = document.getElementById('save-deck');
        if (saveDeckBtn) {
            saveDeckBtn.addEventListener('click', () => {
                this.saveDeck();
            });
        }
        const exportDeckBtn = document.getElementById('export-deck');
        if (exportDeckBtn) {
            exportDeckBtn.addEventListener('click', () => {
                this.exportDeck('copy');
            });
        }
        const importDeckBtn = document.getElementById('import-deck');
        if (importDeckBtn) {
            importDeckBtn.addEventListener('click', () => {
                this.importDeck('copy');
            });
        }
    }

    addCardToDeck(cardNum) {
        const errorDisplay = document.getElementById('import-error');
        errorDisplay && (errorDisplay.style.display = 'none');

        try {
            const cardElement = document.querySelector(`dct-card[card-num="${cardNum}"]`);
            if (!cardElement) throw new Error(`卡牌编号 ${cardNum} 不存在`);

            const cardData = {
                id: cardElement.getAttribute('card-id'),
                cardName: cardElement.getAttribute('data-filter-title'),
                cardType: cardElement.getAttribute('data-filter-type'),
                cardNum: cardNum,
                imgsrc: cardElement.getAttribute('image'),
                count: 1
            };

            // 检查搭档/案件卡限制
            if ((cardData.cardType === "搭档" || cardData.cardType === "案件") &&
                this.addedCards.some(c => c.cardType === cardData.cardType)) {
                throw new Error(`牌组中只能有1张${cardData.cardType}卡`);
            }

            // 检查同ID卡牌限制
            const sameIdCount = this.addedCards
                .filter(c => c.id === cardData.id)
                .reduce((sum, c) => sum + c.count, 0);

            if (sameIdCount >= 3) {
                throw new Error(`同一ID【${cardData.id}】的数量不能超过3张`);
            }

            this.addedCards.push(cardData);
            this.renderAddedCards();
            return true;

        } catch (error) {
            if (errorDisplay) {
                errorDisplay.textContent = error.message;
                errorDisplay.style.display = 'block';
            }
            console.error('添加卡牌失败:', error);
            return false;
        }
    }

    // 新建牌组构建面板
    newDeckBuilderPanel() {
        const panel = document.getElementById('deck-builder-panel');
        const newDeckBtn = document.getElementById('new-deck-btn');
        const deckBuilderPanelButton = document.getElementById('deck-builder-panel-button');
        const toggleDeckBuilderFloatingPanelButton = document.getElementById('toggle-deck-builder-floating');
        const svg = document.querySelector('#toggle-deck-builder-floating svg');
        if (panel) {
            // 初始化新的牌组
            this.currentDeck = {
                deckid: Date.now().toString(36) + Math.random().toString(36).slice(2),
                name: '',
                description: '',
                timestamp: new Date().toISOString(),
                cards: []
            };
            this.addedCards = [];

            // 清空输入框和已添加的卡牌列表
            const deckNameInput = document.getElementById('deck-name');
            if (deckNameInput) {
                deckNameInput.value = '';
            }
            const deckDescriptionInput = document.getElementById('deck-description');
            if (deckDescriptionInput) {
                deckDescriptionInput.value = '';
            }
            const addedCardsContainer = document.getElementById('added-cards');
            if (addedCardsContainer) {
                addedCardsContainer.innerHTML = '';
                // 调用renderAddedCards方法来渲染空的40个格子
                this.renderAddedCards();
            }

            // 显示面板
            panel.classList.remove('hidden-completely');
            panel.classList.remove('hidden');
            // toggleDeckBuilderFloatingPanelButton.classList.remove('hidden');
            deckBuilderPanelButton.classList.remove('hidden');
            newDeckBtn.classList.add('hidden');
            svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';

            // 显示所有"添加到牌组"按钮
            const addToDeckButtons = document.querySelectorAll('.add-to-deck-btn');
            addToDeckButtons.forEach(button => {
                button.classList.remove('hidden');
            });
        }
    }

    // 加载指定ID的牌组
    loadDeckById(deckId) {
        try {
            // 从localStorage获取牌组数据
            const existingDecks = JSON.parse(localStorage.getItem('conan-tcg-decks')) || [];
            const deckData = existingDecks.find(deck => deck.deckid === deckId);

            if (!deckData) {
                console.error(`未找到ID为 ${deckId} 的牌组`);
                return false;
            }

            // 初始化牌组数据
            this.currentDeck = {
                deckid: deckData.deckid,
                name: deckData.name || '导入的牌组',
                description: deckData.description || '',
                timestamp: deckData.timestamp || new Date().toISOString(),
                cards: []
            };

            this.addedCards = [];
            let hasError = false;

            // 遍历所有卡牌并添加到牌组
            for (const cardNum of deckData.cards.filter(cardNum => cardNum)) {
                const addResult = this.addCardToCurrentDeck(cardNum);
                if (!addResult) {
                    hasError = true;
                }
            }

            if (hasError) {
                // addCardToCurrentDeck 已显示具体错误，这里不需要再次显示
                return false;
            }

            // 更新UI
            const deckNameInput = document.getElementById('deck-name');
            if (deckNameInput) {
                deckNameInput.value = this.currentDeck.name;
            }

            const deckDescriptionInput = document.getElementById('deck-description');
            if (deckDescriptionInput) {
                deckDescriptionInput.value = this.currentDeck.description;
            }

            // 渲染卡牌
            this.renderAddedCards();

            // 显示面板
            const panel = document.getElementById('deck-builder-panel');
            const deckBuilderPanelButton = document.getElementById('deck-builder-panel-button');
            const newDeckBtn = document.getElementById('new-deck-btn');
            const toggleDeckBuilderFloatingPanelButton = document.getElementById('toggle-deck-builder-floating');
            const svg = document.querySelector('#toggle-deck-builder-floating svg');


            if (panel) {
                panel.classList.remove('hidden');
                deckBuilderPanelButton.classList.remove('hidden');
                newDeckBtn.classList.add('hidden');
                // toggleDeckBuilderFloatingPanelButton.classList.remove('hidden');
                svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';

                // 显示所有"添加到牌组"按钮
                const addToDeckButtons = document.querySelectorAll('.add-to-deck-btn');
                addToDeckButtons.forEach(button => {
                    button.classList.remove('hidden');
                });
            }

            return true;
        } catch (error) {
            console.error('加载牌组失败:', error);
            return false;
        }
    }

    openDeckBuilderPanel() {
        const panel = document.getElementById('deck-builder-panel');
        const deckBuilderPanelButton = document.getElementById('deck-builder-panel-button');
        const openDeckBtn = document.getElementById('open-deck-btn');
        const toggleDeckBuilderFloatingPanelButton = document.getElementById('toggle-deck-builder-floating');
        const svg = document.querySelector('#toggle-deck-builder-floating svg');
        if (panel) {
            panel.classList.remove('hidden');
            panel.classList.remove('hidden-completely');
            deckBuilderPanelButton.classList.remove('hidden');
            // toggleDeckBuilderFloatingPanelButton.classList.remove('hidden');
            openDeckBtn.classList.add('hidden');
            svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';

            // 隐藏所有"添加到牌组"按钮
            const addToDeckButtons = document.querySelectorAll('.add-to-deck-btn');
            addToDeckButtons.forEach(button => {
                button.classList.remove('hidden');
            });
        }
    }

    // 关闭牌组构建面板
    // 关闭牌组构建面板
    async closeDeckBuilderPanel(method = 'exit') {
        // 检查是否需要确认 (有卡牌且不是保存操作)
        if (this.addedCards.length > 0 && method !== 'save') {
            try {
                // 使用 showConfirm 代替原生 confirm
                const confirmClose = await showConfirm('确定要退出牌组构建吗？未保存的更改将会丢失。', {
                    title: '退出确认',
                    type: 'warning',
                    confirmText: '退出',
                    cancelText: '取消'
                });

                if (!confirmClose) {
                    return; // 用户取消则不关闭
                }
            } catch (error) {
                console.error('确认对话框出错:', error);
                return; // 出错时也不关闭
            }
        }

        // 更新URL (如果包含deckId)
        if (window.location.search.includes('deckId')) {
            const url = new URL(window.location);
            url.searchParams.delete('deckId');
            window.history.replaceState({}, '', url);
        }

        // 获取DOM元素
        const panel = document.getElementById('deck-builder-panel');
        const newDeckBtn = document.getElementById('new-deck-btn');
        const openDeckBtn = document.getElementById('open-deck-btn');
        const deckBuilderPanelButton = document.getElementById('deck-builder-panel-button');
        const toggleDeckBuilderFloatingPanelButton = document.getElementById('toggle-deck-builder-floating');

        if (panel) {
            // 隐藏面板和相关元素
            panel.classList.add('hidden');
            deckBuilderPanelButton.classList.add('hidden');
            // toggleDeckBuilderFloatingPanelButton.classList.add('hidden');
            openDeckBtn.classList.add('hidden');
            newDeckBtn.classList.remove('hidden');

            // 隐藏所有"添加到牌组"按钮
            const addToDeckButtons = document.querySelectorAll('.add-to-deck-btn');
            addToDeckButtons.forEach(button => {
                button.classList.add('hidden');
            });
        }
    }

    // 切换牌组构建面板可见性
    toggleDeckBuilderPanel() {
        const panel = document.getElementById('deck-builder-panel');
        const openDeckBtn = document.getElementById('open-deck-btn');
        const svg = document.querySelector('#toggle-deck-builder-floating svg');
        if (panel) {
            // 检查面板当前是否完全隐藏
            if (panel.classList.contains('hidden-completely')) {
                // 如果是隐藏的，显示面板
                panel.classList.remove('hidden-completely');
                openDeckBtn.classList.add('hidden');
                svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
            } else {
                // 如果是显示的，隐藏面板
                panel.classList.add('hidden-completely');
                openDeckBtn.classList.remove('hidden');
                svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
            }
        }
    }

    hideDeckBuilderPanel() {
        const panel = document.getElementById('deck-builder-panel');
        const deckBuilderPanelButton = document.getElementById('deck-builder-panel-button');
        const openDeckBtn = document.getElementById('open-deck-btn');
        const svg = document.querySelector('#toggle-deck-builder-floating svg');
        if (panel) {
            panel.classList.add('hidden-completely');
            // deckBuilderPanelButton.classList.add('hidden');
            openDeckBtn.classList.remove('hidden');
            svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
        }
    }

    // 添加卡牌到当前牌组

    addCardToCurrentDeck(cardNum) {
        return this.addCardToDeck(cardNum);
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

        // 计算普通卡牌数量
        const normalCardCount = normalCards.length;
        
        // 创建普通卡牌的网格容器
        let cardsHtml = `<div class="grid grid-cols-10 gap-1 grid-cards-custom" style="grid-template-rows: repeat(4, minmax(0, 1fr));">`;
        
        // 前40张卡牌 (固定显示区域)
        for (let i = 0; i < Math.min(normalCardCount, 40); i++) {
            cardsHtml += this.renderCardItem(normalCards[i]);
        }
        
        // 添加空位填满40个格子
        for (let i = normalCardCount; i < 40; i++) {
            cardsHtml += this.renderEmptySlot();
        }
        
        cardsHtml += '</div>';
        
        // 如果有超过40张的卡牌，添加滚动区域
        if (normalCardCount > 40) {
            cardsHtml += `
                <div class="overflow-y-auto max-h-32 border-t border-red-600 dark:border-red-600 mt-2 pt-2">
                    <div class="grid grid-cols-10 gap-1">
            `;
            
            // 第41张及之后的卡牌 (滚动区域)
            for (let i = 40; i < normalCardCount; i++) {
                cardsHtml += this.renderCardItem(normalCards[i], true); // 传递true表示超出限制
            }
            
            cardsHtml += `</div></div>`;
        }
        
        containerCards.innerHTML = cardsHtml;

        this.bindRemoveCardEvents();
        this.updateAllCardCounts();
        this.renderStatistics();
    }

    renderCardItem(card, overLimit = false) {
        const borderColor = overLimit 
            ? 'border-red-600 dark:border-red-600' 
            : 'border-gray-900 dark:border-gray-400';
            
        return `
            <div class="border border-dashed ${borderColor} rounded-lg p-0.5 flex flex-col items-center relative group">
                <div class="relative w-full">
                    <img src=${card.imgsrc} class="w-full h-full content-center object-cover select-none rounded-lg">
                    <div class="absolute bottom-0 left-0 right-0 to-transparent rounded-b-lg">
                        <p class="text-2xs text-white text-center bg-black/70 truncate">${card.cardName}</p>
                        <p class="text-2xs text-white text-center bg-black/70 max-w-full rounded-b-lg" style="font-size: min(0.5rem, 2vw);">${card.id}/${card.cardNum}</p>
                    </div>
                </div>
                <button type="button" class="remove-card absolute top-0 right-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100" data-card-num="${card.cardNum}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
    }

    updateAllCardCounts() {
        // 获取所有卡片元素
        const allCards = document.querySelectorAll('dct-card');
        allCards.forEach(card => {
            if (typeof card.updateDeckCount === 'function') {
                card.updateDeckCount();
            }
        });
    };

    renderEmptySlot() {
        return `
            <div class="border border-dashed border-gray-900 dark:border-gray-400 rounded-lg p-1 flex flex-col items-center justify-center w-full" style="aspect-ratio: 1/1.4;">
                <div class="text-gray-400 text-xs select-none"><!-- 角色<br>事件 --></div>
            </div>
        `;
    };

    renderEmptyPartnerSlot() {
        return `
            <div class="border border-dashed border-gray-900 dark:border-gray-400 rounded-lg p-1 flex flex-col items-center justify-center w-full" style="aspect-ratio: 1/1.4;">
                <div class="text-gray-400 text-xs select-none">搭档</div>
            </div>
        `;
    };

    renderEmptyCaseSlot() {
        return `
            <div class="border border-dashed border-gray-900 dark:border-gray-400 rounded-lg p-1 flex flex-col items-center justify-center w-full" style="aspect-ratio: 1.4/1;">
                <div class="text-gray-400 text-xs select-none">案件</div>
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
        const deckDescriptionInput = document.getElementById('deck-description');

        if (!this.currentDeck || !this.addedCards) {
            console.error("没有可用的牌组数据或卡牌");
            return false;
        }

        this.currentDeck.deckDescription = deckDescriptionInput.value.trim() || '';
        this.currentDeck.deckName = deckNameInput.value.trim() || '新建牌组';
        if (this.addedCards.length === 0) {
            showToast("牌组为空，保存牌组失败", { isSuccess: false });
            return false;
        }

        if (!this.currentDeck.deckid) {
            this.currentDeck.deckid = Date.now().toString(36) + Math.random().toString(36).slice(2);
        }

        // 创建简化的牌组JSON数据
        const deckData = {
            deckid: this.currentDeck.deckid,
            name: this.currentDeck.deckName,
            description: this.currentDeck.deckDescription,
            timestamp: new Date().toISOString(),
            cards: this.addedCards.map(card => card.cardNum)
        };

        try {
            // 获取已有的牌组列表
            let existingDecks = JSON.parse(localStorage.getItem('conan-tcg-decks')) || [];

            // 检查同名冲突
            const existingIndex = existingDecks.findIndex(deck => deck.deckid === deckData.deckid);
            if (existingIndex >= 0) {
                existingDecks[existingIndex] = deckData;  // 覆盖
            } else {
                existingDecks.push(deckData);             // 新增
            }

            // 保存更新后的列表
            localStorage.setItem('conan-tcg-decks', JSON.stringify(existingDecks));

            // 关闭面板
            this.closeDeckBuilderPanel && this.closeDeckBuilderPanel('save');
            showToast('牌组保存成功');
        } catch (error) {
            console.error('保存牌组失败:', error);
            showToast('保存牌组失败，可能是存储空间不足', { isSuccess: false });
        }
    }

    exportDeck(method = 'download') {
        const deckNameInput = document.getElementById('deck-name');
        const deckDescriptionInput = document.getElementById('deck-description');

        if (!this.currentDeck || !this.addedCards) {
            console.error("没有可用的牌组数据或卡牌");
            return false;
        }

        this.currentDeck.deckDescription = deckDescriptionInput.value.trim() || '';
        this.currentDeck.deckName = deckNameInput.value.trim() || '新建牌组';
        if (this.addedCards.length === 0) {
            console.warn("牌组中没有卡牌，但仍然导出");
        }

        if (!this.currentDeck.deckid) {
            this.currentDeck.deckid = Date.now().toString(36) + Math.random().toString(36).slice(2);
        }

        // 创建简化的牌组JSON数据
        const deckData = {
            deckid: this.currentDeck.deckid,
            name: this.currentDeck.deckName,
            description: this.currentDeck.deckDescription,
            timestamp: new Date().toISOString(),
            cards: this.addedCards.map(card => card.cardNum)
        };

        // 导出为JSON文件（自动下载）

        if (method === 'copy') {
            // 复制到剪贴板
            try {
                const dataStr = JSON.stringify(deckData, null, 2);
                navigator.clipboard.writeText(dataStr)
                    .then(() => showToast('牌组已复制到剪贴板'))
                    .catch(err => {
                        console.error('复制失败:', err);
                        showToast('复制失败，请尝试下载方式', { isSuccess: false });
                    });
                return true;
            } catch (error) {
                console.error('复制牌组失败:', error);
                showToast('复制牌组失败，请尝试下载方式', { isSuccess: false });
                return false;
            }
        } else {
            try {
                const jsonStr = JSON.stringify(deckData, null, 2); // 格式化 JSON
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;

                // 生成安全的文件名
                const deckName = deckData.name
                    ? deckData.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_') // 允许中文
                    : 'deck';
                a.download = `${deckName}_${Date.now()}.json`;

                // 静默触发点击，不引起页面跳转/刷新
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();

                // 清理 URL 对象，避免内存泄漏
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);

                return true;
            } catch (error) {
                console.error('导出牌组失败:', error);
                showToast('导出牌组失败', { isSuccess: false });
                return false;
            }
        }
    }

    importDeck() {
        const panel = document.getElementById('deck-builder-panel');
        const deckBuilderPanelButton = document.getElementById('deck-builder-panel-button');
        const toggleDeckBuilderFloatingPanelButton = document.getElementById('toggle-deck-builder-floating');

        // 创建导入对话框
        const importDialog = document.createElement('div');
        importDialog.className = 'import-dialog';
        importDialog.innerHTML = `
        <div class="import-content bg-white dark:bg-gray-800 dark:text-white border">
            <h3>导入牌组</h3>
            <textarea id="deck-json-input" class= "bg-white text-black" placeholder="请粘贴牌组JSON数据..." style="width: 100%; height: 200px; margin: 10px 0;"></textarea>
            <div class="import-buttons">
                <button id="confirm-import" class="btn-primary inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">确认导入</button>
                <button id="cancel-import" class="btn-secondary inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">取消</button>
            </div>
            <p id="import-error" style="color: red; display: none;"></p>
        </div>
    `;

        document.body.appendChild(importDialog);
        // 处理导入取消
        document.getElementById('cancel-import').addEventListener('click', () => {
            document.body.removeChild(importDialog);
        });
        // 处理导入确认
        document.getElementById('confirm-import').addEventListener('click', () => {
            const jsonInput = document.getElementById('deck-json-input').value.trim();
            const errorDisplay = document.getElementById('import-error');
            errorDisplay.style.display = 'none';

            if (!jsonInput) {
                errorDisplay.textContent = '请输入有效的JSON数据';
                errorDisplay.style.display = 'block';
                return;
            }

            try {
                const deckData = JSON.parse(jsonInput);

                if (!deckData.cards || !Array.isArray(deckData.cards)) {
                    throw new Error('无效的牌组数据格式，缺少 cards 数组');
                }

                // 初始化牌组数据
                this.currentDeck = {
                    deckid: deckData.deckid || Date.now().toString(36) + Math.random().toString(36).slice(2),
                    name: deckData.name || '导入的牌组',
                    description: deckData.description || '',
                    timestamp: deckData.timestamp || new Date().toISOString(),
                    cards: []
                };

                this.addedCards = [];
                let hasError = false;

                // 遍历所有卡牌并收集错误
                for (const cardNum of deckData.cards.filter(cardNum => cardNum)) {
                    const addResult = this.addCardToCurrentDeck(cardNum);
                    if (!addResult) {
                        hasError = true;
                    }
                }

                if (hasError) {
                    // addCardToCurrentDeck 已显示具体错误，这里不需要再次显示
                    return;
                }

                // 更新UI
                const deckNameInput = document.getElementById('deck-name');
                if (deckNameInput) {
                    deckNameInput.value = this.currentDeck.name;
                }

                const deckDescriptionInput = document.getElementById('deck-description');
                if (deckDescriptionInput) {
                    deckDescriptionInput.value = this.currentDeck.description;
                }

                // 渲染卡牌
                const addedCardsContainer = document.getElementById('added-cards');
                if (addedCardsContainer) {
                    addedCardsContainer.innerHTML = '';
                    this.renderAddedCards();
                }

                // 显示面板
                panel.classList.remove('hidden');
                deckBuilderPanelButton.classList.remove('hidden');
                // toggleDeckBuilderFloatingPanelButton.classList.remove('hidden');

                // 移除导入对话框
                document.body.removeChild(importDialog);

            } catch (error) {
                errorDisplay.textContent = `导入失败: ${error.message}`;
                errorDisplay.style.display = 'block';
                console.error('导入牌组失败:', error);
            }
        });
    }

    // 渲染统计数据
    renderStatistics() {
        const statisticsContainer = document.getElementById('added-statistics');
        if (!statisticsContainer) return;

        // 统计等级1-9的卡牌数量
        const costCounts = Array(10).fill(0); // 索引0-9，但只使用1-9
        this.addedCards.forEach(card => {
            // 获取卡牌元素以获取cost属性
            const cardElement = document.querySelector(`dct-card[card-num="${card.cardNum}"]`);
            const cost = cardElement ? cardElement.getAttribute('data-filter-cost') : '';

            // 只统计角色和事件卡牌的等级
            const cardType = cardElement ? cardElement.getAttribute('data-filter-type') : '';
            if ((cardType === '角色' || cardType === '事件') && cost && !isNaN(cost)) {
                const costNum = parseInt(cost);
                if (costNum >= 1 && costNum <= 9) {
                    costCounts[costNum] += card.count;
                }
            }
        });

        // 统计各类型卡牌数量
        let roleCount = 0;      // 角色
        let eventCount = 0;     // 事件
        let hiramekiCount = 0;  // 灵光一闪
        let cutInCount = 0;     // 介入
        let disguiseCount = 0;  // 变装

        this.addedCards.forEach(card => {
            // 统计角色和事件卡牌
            const cardElement = document.querySelector(`dct-card[card-num="${card.cardNum}"]`);
            const cardType = cardElement ? cardElement.getAttribute('data-filter-type') : '';
            if (cardType === '角色') {
                roleCount += card.count;
            } else if (cardType === '事件') {
                eventCount += card.count;
            }

            // 统计特殊关键字卡牌
            const spkey = cardElement ? cardElement.getAttribute('data-filter-spkey') : '';
            if (spkey && spkey.includes('灵光一闪')) {
                hiramekiCount += card.count;
            }
            if (spkey && spkey.includes('介入')) {
                cutInCount += card.count;
            }
            if (spkey && spkey.includes('变装')) {
                disguiseCount += card.count;
            }
        });

        let barChartHtml = '<div class="">';
        barChartHtml += '<div class="flex items-end h-32 gap-1 my-6 ml-1 w-full">';

        // 找到最大值用于计算条形图高度
        const maxCount = Math.max(...costCounts.slice(1, 10), 1);

        // 生成1-9级的条形图
        for (let i = 1; i <= 9; i++) {
            const heightPercent = (costCounts[i] / maxCount) * 6;
            barChartHtml += `
                <div class="flex flex-col items-center flex-1 w-full">
                    <!-- 将数字显示在顶部 -->
                    <span class="text-xs dark:text-gray-400 font-bold"${costCounts[i] === 0 ? ' hidden' : ''}>${costCounts[i]}</span>
                    <div class="flex justify-center w-full" style="height: 80%;">
                        <div class="w-full bg-gray-500 dark:bg-gray-100 transition-all duration-300 ease-in-out" style="height: ${heightPercent}rem;">
                        </div>
                    </div>
                    <div class="border-t" style="border-color: #9ca3af;width: ${i === 1 || i === 9 ? '100%' : '200%'}"></div>
                    <span class="text-xs mt-1 dark:text-gray-400">${i}</span>
                </div>
            `;
        }
        barChartHtml += '</div></div>';

        // 创建表格
        let tableHtml = `
        <div class="max-w-full overflow-x-auto ml-1">
            <div class="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                <div class="grid grid-cols-5">
                ${['character', 'event', 'hirameki', 'cut_in', 'disguise']
                .map((icon, index) => `
                    <div class="p-1 border-b border-gray-300 dark:border-gray-600 
                                ${index !== 4 ? 'border-r' : ''}
                                 dark:text-gray-400 text-center">
                        <img src="img/${icon}.svg">
                    </div>`)
                .join('')}

                ${[roleCount, eventCount, hiramekiCount, cutInCount, disguiseCount]
                .map((value, index) => `
                    <div class="p-1 border-gray-300 dark:border-gray-600 
                                ${index !== 4 ? 'border-r' : ''}
                                dark:text-gray-400 text-center">
                        ${value}
                    </div>`)
                .join('')}
                </div>
            </div>
        </div>`;

        let logoHtml = `<img class="logo-image items-end ml-1 mb-8 p-2 select-none" src="/img/cmn_logo@2x.png" alt="Logo">`;
        statisticsContainer.innerHTML = `
            <div class="flex flex-col justify-between h-full">
                <div>
                    ${tableHtml}
                    ${barChartHtml}
                </div>
                <div class="">
                    ${logoHtml}
                </div>
            </div>
        `;
    }
}

window.addCardToDeck = function (cardNum) {
    if (window.deckBuilder) {
        return window.deckBuilder.addCardToDeck(cardNum);
    }
    showToast('牌组构建器未初始化', { isSuccess: false });
    return false;
};