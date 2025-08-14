// 全局变量存储卡牌数据
let cardsData = {};
let cardsDataCN = {};

// 选中的颜色集合
let selectedColors = new Set();

document.addEventListener('DOMContentLoaded', () => {
    loadCardsData().then(() => {
        loadDecks();
    });
});

// 加载卡牌数据
async function loadCardsData() {
    try {
        const [jaResponse, cnResponse] = await Promise.all([
            fetch('/data/cards_ja.json'),
            fetch('/data/en.json')
        ]);

        if (!jaResponse.ok || !cnResponse.ok) {
            throw new Error('Failed to load card data');
        }

        cardsData = await jaResponse.json();
        cardsDataCN = await cnResponse.json();
        return true;
    } catch (error) {
        console.error('Failed to load cards data:', error);
        return false;
    }
}

// 从本地存储加载牌组
function loadDecks() {
    try {
        const decks = JSON.parse(localStorage.getItem('conan-tcg-decks') || '[]');
        const deckListContainer = document.getElementById('deckList');
        const emptyDeckMessage = document.getElementById('emptyDeckMessage');

        if (decks.length === 0) {
            emptyDeckMessage.style.display = 'block';
            return;
        }

        emptyDeckMessage.style.display = 'none';

        // 预计算所有可用颜色
        const allColors = new Set();
        decks.forEach(deck => {
            const deckColors = getDeckColors(deck);
            // 使用动态获取的颜色名称
            deck.colorTags = Array.from(deckColors).map(c => getColorName(c) || c).join(',');
            deckColors.forEach(color => allColors.add(color));
        });

        // 创建颜色标签
        createColorTags(allColors);

        // 生成牌组列表HTML
        deckListContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${decks.map(deck => createDeckCard(deck)).join('')}
            </div>
        `;

        // 添加编辑功能
        decks.forEach(deck => {
            const deckElement = document.querySelector(`[data-deck-id="${deck.deckid}"]`);
            if (deckElement) {
                const editBtn = deckElement.querySelector('.edit-deck-btn');
                editBtn?.addEventListener('click', () => editDeckName(deck, deckElement));

                const editDescBtn = deckElement.querySelector('.edit-desc-btn');
                editDescBtn?.addEventListener('click', () => editDeckDescription(deck, deckElement));
            }
        });

        // 初始筛选
        filterDecks();
    } catch (error) {
        console.error('Failed to load decks:', error);
    }
}

// 获取颜色名称
function getColorName(color) {
    return cardsDataCN[`colors.${color}`];
}

// 创建牌组卡片HTML
function createDeckCard(deck) {
    const totalCardsCount = deck.cards?.length || 0;
    const createdTime = new Date(deck.timestamp).toLocaleString('zh-CN');
    const colorTags = deck.colorTags || '';
    return `
        <div class="deck-card border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200" 
             data-deck-id="${deck.deckid}" 
             data-filter-color="${colorTags}">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div class="flex items-center gap-2">
                    <h4 class="text-lg font-bold dark:text-white deck-name">${deck.name || '未命名牌组'}</h4>
                    <button class="edit-deck-btn text-gray-500 hover:text-blue-500 focus:outline-none" 
                            data-deck-id="${deck.deckid}" 
                            title="重命名牌组">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </button>
                </div>
                <span class="text-sm text-gray-500 dark:text-gray-400">${totalCardsCount}张卡牌</span>
            </div>
            <div class="flex items-start group">
                ${deck.description ? `
                    <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 deck-description flex-grow italic">${deck.description}</p>
                ` : `
                    <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 deck-description flex-grow italic"></p>
                `}
                <div class="edit-desc-container">
                    <button class="edit-desc-btn text-gray-500 hover:text-blue-500 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity" 
                            data-deck-id="${deck.deckid}" 
                            title="编辑描述">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </button>
                </div>
            </div>
            <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">${createdTime}</p>
            </div>
        </div>
    `;
}

// 获取牌组颜色集合
function getDeckColors(deck) {
    const colors = new Set();
    deck.cards?.forEach(cardNum => {
        const cardData = cardsData[cardNum];
        if (cardData?.color) {
            const cardColors = typeof cardData.color === 'string'
                ? cardData.color.split(',')
                : Array.isArray(cardData.color)
                    ? cardData.color
                    : [cardData.color];

            cardColors
                .map(c => c.trim())
                .forEach(c => colors.add(c));
        }
    });
    return colors;
}

// 颜色筛选函数
function filterDecks() {
    const deckElements = document.querySelectorAll('.deck-card');
    if (!deckElements.length) return;

    if (selectedColors.size === 0) {
        deckElements.forEach(el => el.style.display = 'block');
        return;
    }

    deckElements.forEach(el => {
        const deckColors = el.dataset.filterColor?.split(',') || [];
        // 使用动态获取的颜色名称比较
        const shouldShow = Array.from(selectedColors).some(color =>
            deckColors.includes(getColorName(color) || color)
        );
        el.style.display = shouldShow ? 'block' : 'none';
    });
}

// 创建颜色标签HTML
function createColorTags(colors) {
    const colorTagsContainer = document.getElementById('colorTags');
    if (!colorTagsContainer) return;

    const colorOrder = ['青', '緑', '白', '赤', '黄', '黒'];
    const orderedColors = [
        ...colorOrder.filter(color => colors.has(color)),
        ...[...colors].filter(color => !colorOrder.includes(color))
    ];

    let tagsHtml = `
        <button class="color-tag px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 selected"
                data-color="all">
            全部
        </button>
    `;

    orderedColors.forEach(color => {
        const displayName = getColorName(color) || color;
        const isSelected = selectedColors.has(color);

        tagsHtml += `
            <button class="color-tag px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${isSelected ? 'selected' : ''}"
                    data-color="${color}"
                    title="${displayName}">
                ${displayName}色
            </button>
        `;
    });

    colorTagsContainer.innerHTML = tagsHtml;

    // 绑定点击事件
    document.querySelectorAll('.color-tag').forEach(tag => {
        tag.addEventListener('click', function () {
            const color = this.getAttribute('data-color');
            toggleColorSelection(color, this);
        });
    });
}

// 切换颜色选中状态
function toggleColorSelection(color, element) {
    if (color === 'all') {
        selectedColors.clear();
        document.querySelectorAll('.color-tag').forEach(tag => {
            tag.classList.remove('selected');
        });
        element.classList.add('selected');
    } else {
        document.querySelector('.color-tag[data-color="all"]').classList.remove('selected');

        if (selectedColors.has(color)) {
            selectedColors.delete(color);
            element.classList.remove('selected');
        } else {
            selectedColors.add(color);
            element.classList.add('selected');
        }

        if (selectedColors.size === 0) {
            document.querySelector('.color-tag[data-color="all"]').classList.add('selected');
        }
    }

    filterDecks();
}

// 编辑牌组名称
function editDeckName(deck, deckElement) {
    const nameElement = deckElement.querySelector('.deck-name');
    const currentName = deck.name || '未命名牌组';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'rounded-full font-bold dark:text-white bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500';

    const originalContent = nameElement.innerHTML;
    const originalClassName = nameElement.className;

    nameElement.innerHTML = '';
    nameElement.appendChild(input);
    input.focus();

    const saveChanges = () => {
        const newName = input.value.trim() || '未命名牌组';

        if (newName !== currentName) {
            deck.name = newName;
            saveDeckToLocalStorage(deck);
            nameElement.textContent = newName;
        } else {
            nameElement.innerHTML = originalContent;
        }
        nameElement.className = originalClassName;
    };

    input.addEventListener('keydown', (e) => e.key === 'Enter' && saveChanges());
    input.addEventListener('blur', saveChanges);
}

// 编辑牌组描述
function editDeckDescription(deck, deckElement) {
    const descElement = deckElement.querySelector('.deck-description');
    const currentDesc = deck.description || '';
    const editButtonContainer = descElement.nextElementSibling;

    const textarea = document.createElement('textarea');
    textarea.value = currentDesc;
    textarea.className = 'w-full text-sm rounded border border-gray-300 dark:border-gray-600 dark:text-white dark:bg-gray-700 p-2 focus:outline-none focus:border-blue-500';
    textarea.rows = 3;
    textarea.style.width = '100%';

    const originalContent = descElement.innerHTML;
    const originalClassName = descElement.className;

    // 隐藏编辑按钮
    if (editButtonContainer) {
        editButtonContainer.style.display = 'none';
    }

    descElement.innerHTML = '';
    descElement.appendChild(textarea);
    textarea.focus();

    const saveChanges = () => {
        const newDesc = textarea.value.trim();
        deck.description = newDesc || null; // 保存空描述为null
        saveDeckToLocalStorage(deck);

        if (newDesc) {
            descElement.textContent = newDesc;
            descElement.classList.remove('italic');
        } else {
            descElement.innerHTML = ''; // 清空描述
            descElement.classList.add('italic'); // 添加斜体样式
        }

        // 恢复初始状态
        descElement.className = originalClassName;
        if (editButtonContainer) {
            editButtonContainer.style.display = 'block';
        }

        // 移除事件监听器
        document.removeEventListener('click', handleOutsideClick);
    };

    const cancelChanges = () => {
        descElement.innerHTML = originalContent;
        descElement.className = originalClassName;
        if (editButtonContainer) {
            editButtonContainer.style.display = 'block';
        }
        document.removeEventListener('click', handleOutsideClick);
    };

    const handleOutsideClick = (e) => {
        if (!descElement.contains(e.target)) {
            saveChanges(); // 点击外部总是保存，即使清空了
        }
    };

    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // 阻止回车换行
            saveChanges(); // 按Enter保存
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelChanges(); // 按Escape取消
        }
    });

    // 使用捕获阶段确保能够检测到外部点击
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick, true);
    }, 0);
}

// 保存牌组到localStorage
function saveDeckToLocalStorage(updatedDeck) {
    try {
        const decks = JSON.parse(localStorage.getItem('conan-tcg-decks') || '[]');
        const deckIndex = decks.findIndex(deck => deck.deckid === updatedDeck.deckid);

        if (deckIndex !== -1) {
            decks[deckIndex] = updatedDeck;
            localStorage.setItem('conan-tcg-decks', JSON.stringify(decks));
        }
    } catch (error) {
        console.error('Failed to save deck to localStorage:', error);
    }
}