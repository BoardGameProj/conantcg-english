// 牌组数据结构
class Deck {
    constructor(name) {
        this.id = this.generateId();
        this.name = name;
        this.createTime = new Date();
        this.lastModified = new Date();
        this.cards = []; // [{id: cardId, count: number, cardNum: cardNum}]
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 添加卡牌到牌组
    // cardId: 卡牌ID，用于检查同一卡牌ID的数量
    // cardNum: 卡牌编号，用作唯一标识符
    // count: 要添加的卡牌数量
    addCard(cardId, cardNum, count = 1) {
        // 检查同一 card-id 的卡牌是否已经超过3张
        const sameCardIdCount = this.cards
            .filter(card => card.id === cardId)
            .reduce((total, card) => total + card.count, 0);
        
        if (sameCardIdCount + count > 3) {
            // 计算还能添加多少张
            const remainingSlots = 3 - sameCardIdCount;
            if (remainingSlots <= 0) {
                throw new Error(`同一卡牌ID ${cardId} 的卡牌数量不能超过3张`);
            } else {
                throw new Error(`同一卡牌ID ${cardId} 的卡牌数量不能超过3张，您最多还能添加 ${remainingSlots} 张`);
            }
        }
        
        // 使用 cardNum 作为唯一标识符查找已存在的卡牌
        const existingCard = this.cards.find(card => card.cardNum === cardNum);
        if (existingCard) {
            existingCard.count += count;
        } else {
            this.cards.push({ id: cardId, cardNum: cardNum, count: count });
        }
        this.lastModified = new Date();
    }

    // 从牌组中移除卡牌
    removeCard(cardId) {
        this.cards = this.cards.filter(card => card.id !== cardId);
        this.lastModified = new Date();
    }

    // 更新卡牌数量
    updateCardCount(cardId, count) {
        const card = this.cards.find(card => card.id === cardId);
        if (card) {
            card.count = count;
            this.lastModified = new Date();
        }
    }

    // 获取牌组中的卡牌总数
    getTotalCards() {
        return this.cards.reduce((total, card) => total + card.count, 0);
    }
}

// 牌组管理器
class DeckManager {
    constructor() {
        this.decks = [];
        this.colors = ['蓝', '绿', '白', '红', '黄', '黑', '多'];
        this.selectedColor = null; // 当前选中的颜色
        this.init();
    }

    // 初始化
    init() {
        this.loadDecks();
        this.bindEvents();
        this.renderColorFilter(); // 渲染颜色筛选按钮
        this.renderDeckList();
    }

    // 从本地存储加载牌组
    loadDecks() {
        const decksData = localStorage.getItem('conan-tcg-decks');
        if (decksData) {
            try {
                const parsedDecks = JSON.parse(decksData);
                this.decks = parsedDecks.map(deckData => {
                    const deck = new Deck(deckData.name);
                    deck.id = deckData.id;
                    deck.createTime = new Date(deckData.createTime);
                    deck.lastModified = new Date(deckData.lastModified);
                    deck.cards = deckData.cards || [];
                    return deck;
                });
            } catch (e) {
                console.error('Failed to parse decks from localStorage:', e);
                this.decks = [];
            }
        }
    }

    // 保存牌组到本地存储
    saveDecks() {
        try {
            const decksData = this.decks.map(deck => ({
                id: deck.id,
                name: deck.name,
                createTime: deck.createTime,
                lastModified: deck.lastModified,
                cards: deck.cards
            }));
            localStorage.setItem('conan-tcg-decks', JSON.stringify(decksData));
        } catch (e) {
            console.error('Failed to save decks to localStorage:', e);
        }
    }

    // 创建新牌组
    createDeck(name) {
        if (!name.trim()) return null;
        
        const deck = new Deck(name.trim());
        this.decks.push(deck);
        this.saveDecks();
        this.renderDeckList();
        
        // 更新所有卡片的按钮显示状态
        this.updateCardButtonsVisibility();
        
        return deck;
    }
    
    // 更新所有卡片的按钮显示状态
    updateCardButtonsVisibility() {
        // 延迟执行以确保DOM已更新
        setTimeout(() => {
            const cards = document.querySelectorAll('dct-card');
            cards.forEach(card => {
                const addButton = card.querySelector('.add-to-deck-btn');
                if (addButton) {
                    if (this.hasDecks()) {
                        addButton.classList.remove('hidden');
                    } else {
                        addButton.classList.add('hidden');
                    }
                }
            });
        }, 0);
    }

    // 删除牌组
    deleteDeck(deckId) {
        if (confirm('确定要删除这个牌组吗？')) {
            this.decks = this.decks.filter(deck => deck.id !== deckId);
            this.saveDecks();
            this.renderDeckList();
            
            // 更新所有卡片的按钮显示状态
            this.updateCardButtonsVisibility();
        }
    }

    // 重命名牌组
    renameDeck(deckId, newName) {
        if (!newName.trim()) return;
        
        const deck = this.decks.find(deck => deck.id === deckId);
        if (deck) {
            deck.name = newName.trim();
            deck.lastModified = new Date();
            this.saveDecks();
            this.renderDeckList();
        }
    }

    // 获取牌组
    getDeck(deckId) {
        return this.decks.find(deck => deck.id === deckId);
    }
    
    // 检查是否有牌组
    hasDecks() {
        return this.decks.length > 0;
    }

    // 绑定事件
    bindEvents() {
        // 创建牌组表单提交事件
        const createForm = document.getElementById('create-deck-form');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('deck-name');
                const name = nameInput.value;
                if (name.trim()) {
                    this.createDeck(name);
                    nameInput.value = '';
                }
            });
        }

        // 编辑牌组表单提交事件
        const editForm = document.getElementById('edit-deck-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const deckId = document.getElementById('edit-deck-id').value;
                const nameInput = document.getElementById('edit-deck-name');
                const newName = nameInput.value;
                this.renameDeck(deckId, newName);
                this.closeEditModal();
            });
        }

        // 关闭编辑模态框事件
        const cancelEditBtn = document.getElementById('cancel-edit-deck');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        // 关闭详情模态框事件
        const closeDetailBtn = document.getElementById('close-deck-detail');
        if (closeDetailBtn) {
            closeDetailBtn.addEventListener('click', () => {
                this.closeDetailModal();
            });
        }

        // 点击模态框背景关闭模态框
        const editModal = document.getElementById('edit-deck-modal');
        const detailModal = document.getElementById('deck-detail-modal');
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) {
                    this.closeEditModal();
                }
            });
        }
        if (detailModal) {
            detailModal.addEventListener('click', (e) => {
                if (e.target === detailModal) {
                    this.closeDetailModal();
                }
            });
        }
    }

    // 渲染颜色筛选按钮
    renderColorFilter() {
        const container = document.getElementById('color-filter');
        if (!container) return;

        let html = '';
        // 添加"全部"按钮
        html += `
            <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${this.selectedColor === null ? 'ring-2 ring-blue-500 ring-offset-2' : ''}" onclick="deckManager.filterDecksByColor(null)">
                全部
            </button>
        `;

        // 为每个颜色添加按钮
        this.colors.forEach(color => {
            html += `
                <button class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${this.selectedColor === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''}" onclick="deckManager.filterDecksByColor('${color}')">
                    ${color}
                </button>
            `;
        });

        container.innerHTML = html;
    }

    // 根据颜色筛选牌组
    filterDecksByColor(color) {
        this.selectedColor = color;
        this.renderColorFilter(); // 重新渲染颜色筛选按钮以更新选中状态
        this.renderDeckList(); // 重新渲染牌组列表
    }

    // 渲染牌组列表
    renderDeckList() {
        const container = document.getElementById('deck-list-container');
        if (!container) return;

        // 筛选牌组
        let filteredDecks = this.decks;
        if (this.selectedColor !== null) {
            // 这里需要根据牌组的颜色属性进行筛选
            // 目前简化处理，假设所有牌组都是第一个颜色
            // 实际应用中需要根据牌组的实际颜色属性进行筛选
            filteredDecks = this.decks; // 暂时显示所有牌组
        }

        // 生成HTML
        let html = '';
        if (filteredDecks.length > 0) {
            html = filteredDecks.map(deck => this.renderDeckItem(deck)).join('');
        } else {
            html = '<p class="text-gray-500 dark:text-gray-400 p-4 text-center">暂无牌组</p>';
        }

        container.innerHTML = html;
    }

    // 渲染单个牌组项
    renderDeckItem(deck) {
        return `
            <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex justify-between items-center mb-4">
                <div>
                    <h3 class="font-medium dark:text-white">${deck.name}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${deck.getTotalCards()} 张卡牌</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500">创建于 ${deck.createTime.toLocaleDateString('zh-CN')}</p>
                </div>
                <div class="flex space-x-2">
                    <button class="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" onclick="deckManager.openDeckDetail('${deck.id}')" title="查看详情">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                    </button>
                    <button class="p-2 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300" onclick="deckManager.openEditModal('${deck.id}')" title="重命名">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button class="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" onclick="deckManager.deleteDeck('${deck.id}')" title="删除">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    // 打开牌组详情模态框
    openDeckDetail(deckId) {
        const deck = this.getDeck(deckId);
        if (!deck) return;

        const modal = document.getElementById('deck-detail-modal');
        const content = document.getElementById('deck-detail-content');
        const title = document.getElementById('deck-detail-title');

        if (modal && content && title) {
            title.textContent = deck.name;
            
            // 生成牌组详情内容
            let cardsHtml = '';
            if (deck.cards.length > 0) {
                cardsHtml = `
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        ${deck.cards.map(card => this.renderCardItem(card)).join('')}
                    </div>
                `;
            } else {
                cardsHtml = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">该牌组暂无卡牌</p>';
            }

            content.innerHTML = `
                <div class="mb-6">
                    <p class="text-gray-600 dark:text-gray-300"><strong>创建时间:</strong> ${deck.createTime.toLocaleString('zh-CN')}</p>
                    <p class="text-gray-600 dark:text-gray-300"><strong>最后修改:</strong> ${deck.lastModified.toLocaleString('zh-CN')}</p>
                    <p class="text-gray-600 dark:text-gray-300"><strong>卡牌总数:</strong> ${deck.getTotalCards()} 张</p>
                </div>
                <div class="mb-6">
                    <h3 class="text-xl font-bold mb-4 dark:text-white">卡牌列表</h3>
                    ${cardsHtml}
                </div>
                <div class="flex justify-end">
                    <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500" onclick="deckManager.exportDeck('${deck.id}')">导出牌组</button>
                </div>
            `;

            modal.classList.remove('hidden');
        }
    }

    // 渲染卡牌项
    renderCardItem(card) {
        // 这里需要根据卡牌ID获取卡牌信息，暂时使用占位符
        return `
            <div class="bg-white dark:bg-gray-700 rounded-lg shadow p-4 flex items-center">
                <div class="bg-gray-200 border border-dashed rounded-xl w-16 h-24 mr-4"></div>
                <div>
                    <h4 class="font-medium dark:text-white">卡牌 ${card.id}</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">数量: ${card.count}</p>
                </div>
            </div>
        `;
    }

    // 关闭牌组详情模态框
    closeDetailModal() {
        const modal = document.getElementById('deck-detail-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // 打开编辑牌组名称模态框
    openEditModal(deckId) {
        const deck = this.getDeck(deckId);
        if (!deck) return;

        const modal = document.getElementById('edit-deck-modal');
        const deckIdInput = document.getElementById('edit-deck-id');
        const nameInput = document.getElementById('edit-deck-name');

        if (modal && deckIdInput && nameInput) {
            deckIdInput.value = deck.id;
            nameInput.value = deck.name;
            modal.classList.remove('hidden');
            nameInput.focus();
        }
    }

    // 关闭编辑牌组名称模态框
    closeEditModal() {
        const modal = document.getElementById('edit-deck-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // 导出牌组
    exportDeck(deckId) {
        const deck = this.getDeck(deckId);
        if (!deck) return;

        // 这里可以实现导出功能，比如生成文本格式或JSON格式
        const deckData = {
            name: deck.name,
            cards: deck.cards
        };

        const dataStr = JSON.stringify(deckData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `${deck.name}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // 添加卡牌到牌组
    addCardToDeck(cardId, cardNum, cardName) {
        // 如果没有牌组，提示用户先创建牌组
        if (this.decks.length === 0) {
            alert('请先创建一个牌组');
            return;
        }

        // 显示选择牌组的模态框
        this.openSelectDeckModal(cardId, cardNum, cardName);
    }

    // 打开选择牌组模态框
    openSelectDeckModal(cardId, cardNum, cardName) {
        const modal = document.getElementById('select-deck-modal');
        const content = document.getElementById('select-deck-content');

        if (modal && content) {
            // 生成牌组选择列表
            let decksHtml = '';
            if (this.decks.length > 0) {
                decksHtml = `
                    <div class="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                        ${this.decks.map(deck => `
                            <div class="p-3 bg-white dark:bg-gray-700 rounded-lg shadow flex justify-between items-center">
                                <div>
                                    <h4 class="font-medium dark:text-white">${deck.name}</h4>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">${deck.getTotalCards()} 张卡牌</p>
                                </div>
                                <button class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm" onclick="deckManager.selectDeckAndAddCard('${deck.id}', '${cardId}', '${cardNum}')">添加</button>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                decksHtml = '<p class="text-gray-500 dark:text-gray-400 text-center py-4">暂无牌组</p>';
            }

            content.innerHTML = `
                <div class="mb-4">
                    <h3 class="text-xl font-bold dark:text-white">选择要添加卡牌的牌组</h3>
                    <p class="text-gray-600 dark:text-gray-300">卡牌: ${cardName}</p>
                </div>
                ${decksHtml}
            `;

            modal.classList.remove('hidden');
        }
    }

    // 关闭选择牌组模态框
    closeSelectDeckModal() {
        const modal = document.getElementById('select-deck-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // 选择牌组并添加卡牌
    selectDeckAndAddCard(deckId, cardId, cardNum) {
        const deck = this.getDeck(deckId);
        if (deck) {
            try {
                deck.addCard(cardId, cardNum);
                this.saveDecks();
                this.closeSelectDeckModal();
                alert('卡牌已添加到牌组');
            } catch (error) {
                alert(error.message);
            }
        }
    }
}

// 初始化牌组管理器
document.addEventListener('DOMContentLoaded', () => {
    window.deckManager = new DeckManager();
});