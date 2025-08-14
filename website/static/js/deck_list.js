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
        // 等待卡牌数据加载完成
        if (!cardsData || Object.keys(cardsData).length === 0) {
            console.log('等待卡牌数据加载...');
            setTimeout(loadDecks, 100); // 延迟100ms再尝试
            return;
        }

        const decks = JSON.parse(localStorage.getItem('conan-tcg-decks') || '[]');
        const deckListContainer = document.getElementById('deckList');
        const emptyDeckMessage = document.getElementById('emptyDeckMessage');

        // 添加元素存在性检查
        if (!deckListContainer) {
            console.error('Required elements not found');
            return;
        }

        if (decks.length === 0) {
            emptyDeckMessage.style.display = 'block';
            deckListContainer.style.display = 'none'; // 隐藏列表容器
            return;
        }

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
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-1">
                ${decks.map(deck => createDeckCard(deck)).join('')}
            </div>
        `;
        deckListContainer.addEventListener('click', (e) => {
            // 如果是编辑按钮/描述按钮或它们的子元素
            if (e.target.closest('.edit-deck-btn') ||
                e.target.closest('.edit-desc-btn') ||
                e.target.closest('input.deck-name-input') ||
                e.target.closest('textarea.deck-description-input')) {
                return;
            }

            // 否则处理牌组点击
            const deckCard = e.target.closest('.deck-card');
            if (deckCard) {
                const deckId = deckCard.dataset.deckId;
                showDeckDetail(deckId);
            }
        });
        // 添加编辑功能
        decks.forEach(deck => {
            const deckElement = document.querySelector(`[data-deck-id="${deck.deckid}"]`);
            if (deckElement) {
                const editBtn = deckElement.querySelector('.edit-deck-btn');
                editBtn?.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    editDeckName(deck, deckElement);
                });

                const editDescBtn = deckElement.querySelector('.edit-desc-btn');
                editDescBtn?.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    editDeckDescription(deck, deckElement);
                });
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

// 获取卡牌名称
function getCardName(cardNum) {
    let card_id = cardsData[cardNum];
    return cardsDataCN[`cards.${card_id}.title`];
}


// 创建牌组卡片HTML
function createDeckCard(deck) {
    const createdTime = new Date(deck.timestamp).toLocaleString('zh-CN');
    const colorTags = deck.colorTags || '';

    let totalCardsCount = 0;
    let partnerCard = null;
    let caseCard = null;

    if (deck.cards) {
        for (const cardNum of deck.cards) {
            const cardData = cardsData[cardNum];
            if (cardData) {
                const cardType = cardsDataCN[`types.${cardData.type}`];
                // 如果是搭档牌，记录下来但不计入总数
                if (cardType === "搭档") {
                    partnerCard = cardData;
                    continue;
                }
                // 如果是案件牌，也不计入总数
                if (cardType === "案件") {
                    caseCard = cardData;
                    continue;
                }
                // 其他牌才计入总数
                totalCardsCount++;
            }
        }
    }
    const isChinese = isChineseByProduct(partnerCard.package) || chinesePRCards.has(partnerCard.cardNum);

    const imageUrl = isChinese 
        ? `https://img.915159.xyz/DCCG/${partnerCard.card_num}.png`
        : `https://img.915159.xyz/DCCG/ja/${partnerCard.card_num}.ja.jpg`;

    // 生成搭档牌图片HTML
    const partnerImgHtml = partnerCard
        ? `<img src="${imageUrl}" 
                alt="${partnerCard.name}" 
                class="w-20 object-cover rounded-md border border-gray-200 dark:border-gray-600 mb-2"
                onerror="this.style.display='none'">`
        : '';

    return `
        <div class="deck-card border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200" 
             data-deck-id="${deck.deckid}" 
             data-filter-color="${colorTags}">
            <div class="flex items-start gap-3">
                ${partnerImgHtml}
                <div class="flex-1">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2 group">
                            <h4 class="text-lg font-bold dark:text-white deck-name">${deck.name || '未命名牌组'}</h4>
                            <button class="edit-deck-btn text-gray-500 hover:text-blue-500 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity" 
                                    data-deck-id="${deck.deckid}" 
                                    title="重命名牌组">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>
                        </div>
                        <div class="flex items-center text-gray-500 dark:text-gray-400" title="${totalCardsCount}张卡牌">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                            <span class="text-sm">${totalCardsCount}</span>
                        </div>
                    </div>
                    <div class="flex items-start group">
                        ${deck.description ? `
                            <p class="text-sm text-gray-600 dark:text-gray-300 mb-2 deck-description flex-grow italic overflow-scroll" style="max-height: 2.8rem">${deck.description}</p>
                        ` : `
                            <p class="text-sm text-gray-600 dark:text-gray-300 mb-2 deck-description flex-grow italic"></p>
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
        <button class="color-tag px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 selected hidden"
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

// 修改后的showDeckDetail函数
function showDeckDetail(deckId) {
    const decks = JSON.parse(localStorage.getItem('conan-tcg-decks') || '[]');
    const deck = decks.find(d => d.deckid === deckId);
    if (!deck) return;

    // 分类卡片
    const partnerCards = [];
    const caseCards = [];
    const otherCards = [];

    deck.cards?.forEach(cardNum => {
        const cardData = cardsData[cardNum];
        if (!cardData) return;

        const cardType = cardsDataCN[`types.${cardData.type}`];

        if (cardType === "搭档") {
            partnerCards.push(cardData);
        } else if (cardType === "案件") {
            caseCards.push(cardData);
        } else {
            otherCards.push(cardData);
        }
    });

    // 生成搭档和案件部分的HTML
    const partnerCaseHtml = (() => {
        if (partnerCards.length === 0 && caseCards.length === 0) return '';

        const title =
            partnerCards.length > 0 && caseCards.length > 0 ? "搭档 & 案件" :
                partnerCards.length > 0 ? "搭档" : "案件";

        const cards = [...partnerCards, ...caseCards];

        return `
            <div class="mr-6 mr-5">
                <h4 class="text-lg font-semibold dark:text-gray-200 mb-3">${title}</h4>
                <div class="grid grid-cols-1 gap-1">
                    ${cards.map(card => createCardImageHtml(card)).join('')}
                </div>
            </div>
        `;
    })();

    const modalHtml = `
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-7xl max-h-[90vh] flex flex-col">
                <!-- 顶部标题和关闭按钮 -->
                <div class="flex justify-between items-start p-4 border-b dark:border-gray-700">
                    <div class="relative w-full">
                        <div class="flex items-center gap-2">
                            <h3 class="text-xl font-bold dark:text-white deck-name">${deck.name || '未命名牌组'}</h3>
                            <button class="edit-deck-btn text-gray-500 hover:text-blue-500 focus:outline-none" 
                                    data-deck-id="${deck.deckid}" 
                                    title="重命名牌组">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>
                        </div>
                        ${deck.description ? `
                            <div class="flex items-start mt-1">
                                <p class="text-sm text-gray-600 dark:text-gray-300 deck-description flex-grow italic">${deck.description}</p>
                                <button class="edit-desc-btn text-gray-500 hover:text-blue-500 focus:outline-none" 
                                        data-deck-id="${deck.deckid}" 
                                        title="编辑描述">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                            </div>
                        ` : `
                            <div class="flex items-start mt-1">
                                <p class="text-sm text-gray-600 dark:text-gray-300 deck-description flex-grow italic"></p>
                                <button class="edit-desc-btn text-gray-500 hover:text-blue-500 focus:outline-none" 
                                        data-deck-id="${deck.deckid}" 
                                        title="编辑描述">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                            </div>
                        `}
                    </div>
                    <button onclick="document.querySelector('.modal-backdrop').remove()" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <!-- 内容区域 -->
                <div class="grid grid-cols-6 overflow-y-auto p-4">
                    ${partnerCaseHtml}
                    
                    <!-- 其他卡牌部分 -->
                    ${otherCards.length > 0 ? `
                        <div class="col-span-5 mb-6">
                            <h4 class="text-lg font-semibold dark:text-gray-200 mb-3">卡牌 (${otherCards.length}张)</h4>
                            <div class="grid grid-cols-10 sm:grid-cols-4 md:grid-cols-10 gap-1">
                                ${otherCards.map(card => createCardImageHtml(card)).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- 底部按钮 -->
                <div class="flex justify-end gap-3 p-4 border-t dark:border-gray-700">
                    <button onclick="editDeck('${deckId}')" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                        编辑牌组
                    </button>
                    <button onclick="exportDeck('${deckId}')" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                        导出牌组
                    </button>
                    <button onclick="cloneDeck('${deckId}')" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors">
                        复制牌组
                    </button>
                    <button onclick="confirmDeleteDeck('${deckId}')" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                        删除牌组
                    </button>
                </div>
            </div>
        </div>
    `;

    // 添加到DOM
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = modalHtml;
    document.body.appendChild(modal);
    window.scrollTo(0, 0);
    
    // 添加编辑事件监听器
    const modalDeckName = modal.querySelector('.deck-name');
    const modalDeckDesc = modal.querySelector('.deck-description');
    const modalEditBtn = modal.querySelector('.edit-deck-btn');
    const modalEditDescBtn = modal.querySelector('.edit-desc-btn');
    
    if (modalEditBtn) {
        modalEditBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editDeckName(deck, { 
                querySelector: () => modalDeckName,
                appendChild: (child) => modalDeckName.innerHTML = '',
                nextElementSibling: null
            });
        });
    }
    
    if (modalEditDescBtn) {
        modalEditDescBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editDeckDescription(deck, { 
                querySelector: () => modalDeckDesc,
                appendChild: (child) => modalDeckDesc.innerHTML = '',
                nextElementSibling: modalEditDescBtn.parentElement
            });
        });
    }
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
    input.className = 'deck-name-input rounded-full font-bold dark:text-white bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500';

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
function editDeckDescription(deck, scopeElement) {
    const descElement = scopeElement.querySelector('.deck-description');
    const currentDesc = deck.description || '';
    const editButtonContainer = scopeElement.nextElementSibling;

    const textarea = document.createElement('textarea');
    textarea.value = currentDesc;
    textarea.className = 'deck-description-input w-full text-sm rounded border border-gray-300 dark:border-gray-600 dark:text-white dark:bg-gray-700 p-2 focus:outline-none focus:border-blue-500';
    textarea.rows = 3;
    textarea.style.width = '100%';

    const originalContent = descElement.innerHTML;
    const originalClassName = descElement.className;

    // 在模态框中隐藏编辑按钮
    if (editButtonContainer && editButtonContainer.querySelector('.edit-desc-btn')) {
        editButtonContainer.querySelector('.edit-desc-btn').style.display = 'none';
    }

    descElement.innerHTML = '';
    descElement.appendChild(textarea);
    textarea.focus();

    const saveChanges = () => {
        const newDesc = textarea.value.trim();
        deck.description = newDesc || null; // 保存空描述为null
        saveDeckToLocalStorage(deck);

        // 检查是否是模态框中的编辑
        const isModal = document.querySelector('.modal-backdrop');

        if (newDesc) {
            descElement.textContent = newDesc;
            descElement.classList.remove('italic');
            
            // 如果是模态框中的编辑，同时更新列表视图
            if (isModal) {
                const deckCard = document.querySelector(`.deck-card[data-deck-id="${deck.deckid}"] .deck-description`);
                if (deckCard) {
                    deckCard.textContent = newDesc;
                    deckCard.classList.remove('italic');
                }
            }
        } else {
            descElement.innerHTML = ''; // 清空描述
            descElement.classList.add('italic'); // 添加斜体样式
            
            // 如果是模态框中的编辑，同时更新列表视图
            if (isModal) {
                const deckCard = document.querySelector(`.deck-card[data-deck-id="${deck.deckid}"] .deck-description`);
                if (deckCard) {
                    deckCard.innerHTML = '';
                    deckCard.classList.add('italic');
                }
            }
        }

        // 恢复初始状态
        descElement.className = originalClassName;
        if (editButtonContainer && editButtonContainer.querySelector('.edit-desc-btn')) {
            editButtonContainer.querySelector('.edit-desc-btn').style.display = 'block';
        }

        // 移除事件监听器
        document.removeEventListener('click', handleOutsideClick);
    };

    const cancelChanges = () => {
        descElement.innerHTML = originalContent;
        descElement.className = originalClassName;
        if (editButtonContainer && editButtonContainer.querySelector('.edit-desc-btn')) {
            editButtonContainer.querySelector('.edit-desc-btn').style.display = 'block';
        }
        document.removeEventListener('click', handleOutsideClick);
    };

    const handleOutsideClick = (e) => {
        if (!descElement.contains(e.target) && e.target !== textarea) {
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


function isChineseByProduct(product) {
    if (!product) return false;
    const productCode = product.trim().substring(0, 6);
    const validProducts = [
        "CT-D01", "CT-D02", "CT-D03", "CT-D04", "CT-D05", "CT-D06", // 新手卡组
        "CT-P01", "CT-P02",                                         // 补充包
    ];
    return validProducts.includes(productCode);
}

const chinesePRCards = new Set([
    "PR002", "PR004", "PR005", "PR006", "PR007",
    "PR008", "PR009", "PR010", "PR011", "PR017",
    "PR018", "PR019", "PR020", "PR021", "PR022",
    "PR023", "PR034", "PR035", "PR038", "PR052"
]);

function createCardImageHtml(card) {
    const cardName = cardsDataCN[`cards.${card.card_id}.title`] || card.name || '未知卡牌';
    
    // 判断是否是中文卡牌（根据你的逻辑）
    const isChinese = isChineseByProduct(card.package) || chinesePRCards.has(card.cardNum);
    
    // 中文卡牌用 CN 目录，否则用默认目录
    const imageUrl = isChinese 
        ? `https://img.915159.xyz/DCCG/${card.card_num}.png`
        : `https://img.915159.xyz/DCCG/ja/${card.card_num}.ja.jpg`;

    return `
        <div class="relative group">
            <img src="${imageUrl}" 
                 alt="${cardName}"
                 class="w-full rounded-md border border-gray-200 dark:border-gray-600 transition-transform group-hover:scale-105"
                 onerror="this.src='https://img.915159.xyz/DCCG/ja/${card.card_num}.ja.jpg'">
            <div class="absolute inset-0 bg-black/0 transition-all rounded-md"></div>
        </div>
    `;
}


// function createCardImageHtml(card) {
//     const cardName = cardsDataCN[`cards.${card.card_id}.title`] || card.name || '未知卡牌';
//     return `
//         <div class="relative group">
//             <img src="https://img.915159.xyz/DCCG/${card.card_num}.png" 
//                  alt="${cardName}"
//                  class="w-full rounded-md border border-gray-200 dark:border-gray-600 transition-transform group-hover:scale-105"
//                  onerror="this.src='/img/fallback.jpg'">
//             <div class="absolute inset-0 bg-black/0 transition-all rounded-md"></div>
//         </div>
//     `;
// }

// 编辑牌组
function editDeck(deckId) {
    // 跳转到卡牌编辑页面，并传递deckId参数
    window.location.href = `/cards?deckId=${encodeURIComponent(deckId)}`;
}

function exportDeck(deckId) {
    alert('导出功能待实现');
}

function cloneDeck(deckId) {
    try {
        const decks = JSON.parse(localStorage.getItem('conan-tcg-decks') || '[]');
        const originalDeck = decks.find(d => d.deckid === deckId);

        if (!originalDeck) {
            showToast('找不到要复制的牌组', false);
            return;
        }

        // 创建副本
        const clonedDeck = {
            ...originalDeck,
            deckid: Date.now().toString(36) + Math.random().toString(36).slice(2),
            timestamp: new Date().toISOString(),
            name: originalDeck.name ? `${originalDeck.name}_副本` : '未命名牌组_副本'
        };

        // 保存新牌组
        decks.push(clonedDeck);
        localStorage.setItem('conan-tcg-decks', JSON.stringify(decks));

        // 直接刷新牌组列表
        loadDecks();

        showToast(`已成功复制牌组: ${clonedDeck.name}`);

        // 延迟执行滚动，确保元素已渲染
        setTimeout(() => {
            const newDeckElement = document.querySelector(`[data-deck-id="${clonedDeck.deckid}"]`);
            if (newDeckElement) {
                newDeckElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                newDeckElement.animate([
                    { backgroundColor: 'rgba(163, 230, 53, 0.3)' },
                    { backgroundColor: 'transparent' }
                ], { duration: 1000, easing: 'ease-out' });
            }
        }, 500);

    } catch (error) {
        console.error('复制牌组失败:', error);
        showToast('复制牌组失败', false);
    }
}

function confirmDeleteDeck(deckId) {
    if (confirm('确定要删除这个牌组吗？此操作不可恢复。')) {
        deleteDeck(deckId);
    }
}


function showToast(message, isSuccess = true) {
    const toast = document.createElement('div');
    toast.className = `toast ${isSuccess ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-2 rounded fixed top-4 right-4 z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}


function deleteDeck(deckId) {
    const decks = JSON.parse(localStorage.getItem('conan-tcg-decks') || '[]');
    const deckToDelete = decks.find(d => d.deckid === deckId);
    const updatedDecks = decks.filter(d => d.deckid !== deckId);
    localStorage.setItem('conan-tcg-decks', JSON.stringify(updatedDecks));
    showToast(`已删除牌组: ${deckToDelete?.name || '未命名牌组'}`);

    // 添加删除动画效果
    const deletedCard = document.querySelector(`.deck-card[data-deck-id="${deckId}"]`);
    if (deletedCard) {
        deletedCard.style.transition = 'all 0.3s ease';
        deletedCard.style.transform = 'scale(0)';
        setTimeout(() => {
            deletedCard.remove();
            // 关闭模态框
            document.querySelector('.modal-backdrop')?.remove();
            // 检查是否还有牌组
            if (updatedDecks.length === 0) {
                document.getElementById('emptyDeckMessage').style.display = 'block';
            }
        }, 300);
    } else {
        // 常规处理
        document.querySelector('.modal-backdrop')?.remove();
        loadDecks();
    }
}
