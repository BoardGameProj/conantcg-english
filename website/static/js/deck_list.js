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

// 从本地存储加载卡组
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
            emptyDeckMessage.classList.remove('hidden');
            return;
        }

        decks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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

        // 生成卡组列表HTML
        deckListContainer.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-1">
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

            // 否则处理卡组点击
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


// 创建卡组卡片HTML
function createDeckCard(deck) {
    const createdTime = new Date(deck.timestamp).toLocaleString('zh-CN');
    const colorTags = deck.colorTags || '';

    let totalCardsCount = 0;
    let partnerCard = null;
    let caseCard = null;

    if (deck.cards) {
        for (const cardNum of deck.cards) {
            const cardData = cardsData[cardNum];
            if (!cardData) continue;

            const cardType = cardsDataCN[`types.${cardData.type}`];

            // 确保只处理有效卡片数据
            if (cardType === "搭档") {
                partnerCard = cardData || {}; // 确保不会为null
                continue;
            }

            if (cardType === "案件") {
                caseCard = cardData || {}; // 确保不会为null
                continue;
            }
            totalCardsCount++;
        }
    }

    // 添加安全检查
    const isChinese = partnerCard ?
        (isChineseByProduct(partnerCard.package) || chinesePRCards.has(partnerCard.card_num)) :
        false;

    const imageUrl = partnerCard ?
        (isChinese ?
            `https://img.915159.xyz/DCCG/${partnerCard.card_num}.png` :
            `https://img.915159.xyz/DCCG/ja/${partnerCard.card_num}.ja.jpg`) :
        '';

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
                            <h4 class="text-lg font-bold dark:text-white deck-name">${deck.name || '未命名卡组'}</h4>
                            <button class="edit-deck-btn text-gray-500 hover:text-blue-500 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity" 
                                    data-deck-id="${deck.deckid}" 
                                    title="重命名卡组">
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

// 获取卡组颜色集合
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

let currentModal = null;

// 修改后的showDeckDetail函数
function showDeckDetail(deckId) {
    if (currentModal) {
        currentModal.remove();
        currentModal = null;
    }
    const decks = JSON.parse(localStorage.getItem('conan-tcg-decks') || '[]');
    const deck = decks.find(d => d.deckid === deckId);
    if (!deck) return;

    // 重置卡牌索引跟踪器
    window.cardIndexTracker = {};
    
    // 设置当前显示的卡组信息，供createCardImageHtml函数使用
    window.currentDeckForDisplay = deck;

    // 分类卡片
    const partnerCards = [];
    const caseCards = [];
    const otherCards = [];
    //统计部分
    const costCounts = Array(10).fill(0); // 索引0-9，但只使用1-9

    deck.cards?.forEach(cardNum => {
        const cardData = cardsData[cardNum];
        if (!cardData) return;
        const cost = cardData.cost;
        const cardType = cardsDataCN[`types.${cardData.type}`];

        if (cardType === "搭档") {
            partnerCards.push(cardData);
        } else if (cardType === "案件") {
            caseCards.push(cardData);
        } else if (cost && !isNaN(cost)) {
            const costNum = parseInt(cost);
            if (costNum >= 1 && costNum <= 9) {
                costCounts[costNum]++;
            }
            otherCards.push(cardData);
        } else {
            otherCards.push(cardData);
        }
    })

    let roleCount = 0;      // 角色
    let eventCount = 0;     // 事件
    let hiramekiCount = 0;  // 灵光一闪
    let cutInCount = 0;     // 介入
    let disguiseCount = 0;  // 变装

    deck.cards?.forEach(cardNum => {
        // 统计角色和事件卡牌
        const cardData = cardsData[cardNum];
        if (!cardData) return;
        const cardType = cardsDataCN[`types.${cardData.type}`];

        if (cardType === '角色') {
            roleCount++;
        } else if (cardType === '事件') {
            eventCount++;
        }

        // 统计特殊关键字卡牌
        const hirameki = cardData.hirameki
        const cut_in = cardData.cut_in
        const henso = cardData.henso
        if (hirameki) {
            hiramekiCount++;
        }
        if (cut_in) {
            cutInCount++;
        }
        if (henso) {
            disguiseCount++;
        }
    })

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

    //统计部分
    let barChartHtml = '<div class="select-none">';
    barChartHtml += '<div class="flex items-end h-32 gap-1 my-6 ml-3 w-full">';

    // 找到最大值用于计算条形图高度
    const maxCount = Math.max(...costCounts.slice(1, 10), 1);

    // 生成1-9级的条形图
    for (let i = 1; i <= 9; i++) {
        const heightPercent = (costCounts[i] / maxCount) * 6;
        barChartHtml += `
            <div class="flex flex-col items-center flex-1 w-full">
                <!-- 将数字显示在顶部 -->
                <span class="text-xs dark:text-gray-400 font-bold ${costCounts[i] === 0 ? 'hidden' : ''}">${costCounts[i]}</span>
                <div class="flex justify-center w-full" style="height: 80%;">
                    <div class="w-full bg-gray-500 dark:bg-gray-100 transition-all duration-300 ease-in-out rounded-t" style="height: ${heightPercent}rem;">
                    </div>
                </div>
                <div class="border-t ${i === 9 && costCounts[i] === 0 ? 'hidden' : ''}" style="border-color: #9ca3af; width: 200%;}"></div>
                <span class="text-xs mt-1 dark:text-gray-400 ${i === 9 && costCounts[i] === 0 ? 'hidden' : ''}">${i}</span>
            </div>
        `;
    }
    barChartHtml += '</div></div>';

    let tableHtml = `
    <div class="max-w-full overflow-x-auto ml-3">
        <div class="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <div class="grid grid-cols-5 select-none">
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
    const statisticsHtml = `
        <div class="flex flex-col justify-between h-full">
            <div>
                <h4 class="text-lg font-semibold dark:text-gray-200 mb-3">统计</h4>
                ${tableHtml}
                ${barChartHtml}
            </div>
            <div class="">
                ${logoHtml}
            </div>
        </div>
    `;

    const titleEditBtnHtml = `
        <button class="edit-deck-btn text-gray-500 hover:text-blue-500 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity" 
                data-deck-id="${deck.deckid}" 
                title="重命名卡组">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
        </button>
    `;

    const descEditBtnHtml = `
        <button class="edit-desc-btn text-gray-500 hover:text-blue-500 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity" 
                data-deck-id="${deck.deckid}" 
                title="编辑描述">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
        </button>
    `;
    const modalHtml = `
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-7xl max-h-[77vh] flex flex-col" style="max-height: 77vh">
                <!-- 顶部标题和关闭按钮 -->
                <div class="flex justify-between items-start p-4 border-b dark:border-gray-700">
                    <div class="relative w-full">
                        <div class="flex items-center gap-2 group">
                            <h3 class="text-xl font-bold dark:text-white deck-name">${deck.name || '未命名卡组'}</h3>
                            ${titleEditBtnHtml}
                        </div>
                        <div class="flex items-start group">
                            ${deck.description ? `
                                <p class="text-sm text-gray-600 dark:text-gray-300 deck-description flex-grow italic overflow-scroll" style="max-height: 2.8rem">${deck.description}</p>
                            ` : `
                                <p class="text-sm text-gray-600 dark:text-gray-300 deck-description flex-grow italic"></p>
                            `}
                            ${descEditBtnHtml}
                        </div>
                    </div>
                    <button class="modal-close-btn text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <!-- 内容区域 -->
                <div class="grid overflow-y-auto p-4 h-full ${partnerCaseHtml ? 'grid-cols-7' : 'grid-cols-6'}">
                    ${partnerCaseHtml}
                    
                    <!-- 其他卡牌部分 -->
                    ${otherCards.length > 0 ? `
                        <div class="col-span-5 mb-6">
                            <h4 class="text-lg font-semibold dark:text-gray-200 mb-3">卡组 (${otherCards.length}张)</h4>
                            <div class="grid grid-cols-10 sm:grid-cols-4 md:grid-cols-10 gap-2">
                                ${otherCards.map(card => createCardImageHtml(card)).join('')}
                            </div>
                        </div>
                    ` : '<div class="col-span-5 mb-6"></div>'}

                    ${statisticsHtml}
                </div>
                
                <!-- 底部按钮 -->
                <div class="flex justify-end gap-3 p-4 border-t dark:border-gray-700">
                    <button onclick="editDeck('${deckId}')" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors select-none">
                        编辑卡组
                    </button>
                    <button onclick="exportDeck('${deckId}', 'copy')" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors select-none">
                        导出卡组
                    </button>
                    <button onclick="cloneDeck('${deckId}')" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors select-none">
                        复制卡组
                    </button>
                    <button onclick="confirmDeleteDeck('${deckId}')" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors select-none">
                        删除卡组
                    </button>
                </div>
            </div>
        </div>
    `;

    // 添加到DOM
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop'; // 初始状态透明且隐藏
    modal.innerHTML = modalHtml;
    currentModal = modal;
    document.body.appendChild(modal);

    requestAnimationFrame(() => {
        modal.style.opacity = '1';     // 淡入
        modal.style.visibility = 'visible';
    });

    const closeModal = () => {
        currentModal.style.opacity = '0';
        currentModal.style.visibility = 'hidden';
        setTimeout(() => {
            if (currentModal) {
                currentModal.remove();
                currentModal = null;
            }
        }, 200);
    };

    modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);

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

// 编辑卡组名称
function editDeckName(deck, deckElement) {
    const nameElement = deckElement.querySelector('.deck-name');
    const currentName = deck.name || '未命名卡组';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'deck-name-input rounded-full font-bold dark:text-white bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500';

    const originalContent = nameElement.innerHTML;
    const originalClassName = nameElement.className;
    const isModal = document.querySelector('.modal-backdrop');

    nameElement.innerHTML = '';
    nameElement.appendChild(input);
    input.focus();

    const saveChanges = () => {
        const newName = input.value.trim() || '未命名卡组';

        if (newName !== currentName) {
            deck.name = newName;
            saveDeckToLocalStorage(deck);
            nameElement.textContent = newName;
            if (isModal) {
                loadDecks();
            }
        } else {
            nameElement.innerHTML = originalContent;
        }
        nameElement.className = originalClassName;
    };

    input.addEventListener('keydown', (e) => e.key === 'Enter' && saveChanges());
    input.addEventListener('blur', saveChanges);
}

// 编辑卡组描述
function editDeckDescription(deck, scopeElement) {
    const descElement = scopeElement.querySelector('.deck-description');
    const currentDesc = deck.description || '';
    const editButtonContainer = scopeElement.nextElementSibling;

    const textarea = document.createElement('textarea');
    textarea.value = currentDesc;
    textarea.className = 'deck-description-input w-full text-sm rounded-lg border dark:text-white dark:bg-gray-700 p-2 focus:outline-none focus:border-blue-500';
    textarea.rows = 2;
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
                loadDecks();
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

// 保存卡组到localStorage
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
    if (!product || typeof product !== 'string') return false;
    const productCode = product.trim().substring(0, 6);
    const validProducts = [
        "CT-D01", "CT-D02", "CT-D03", "CT-D04", "CT-D05", "CT-D06",
        "CT-P01", "CT-P02",
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

    const isChinese = isChineseByProduct(card.package) || chinesePRCards.has(card.card_num);

    const imageUrl = isChinese
        ? `https://img.915159.xyz/DCCG/${card.card_num}.png`
        : `https://img.915159.xyz/DCCG/ja/${card.card_num}.ja.jpg`;

    // 初始化该卡牌的索引计数器
    if (!window.cardIndexTracker[card.card_num]) {
        window.cardIndexTracker[card.card_num] = 0;
    }
    
    // 获取当前卡牌的索引
    const currentIndex = window.cardIndexTracker[card.card_num];
    window.cardIndexTracker[card.card_num]++;

    // 获取拥有的卡牌数量
    let ownedCount = 0;
    try {
        const ownedCards = JSON.parse(localStorage.getItem('ownedCards') || '{}');
        ownedCount = ownedCards[card.card_num] || 0;
    } catch (e) {
        console.error('Error reading owned cards from localStorage:', e);
    }

    // 检查是否需要添加标记（只有当当前索引大于等于拥有的数量时才标记）
    const shouldMark = currentIndex >= ownedCount;
    const insufficientTag = shouldMark ?
        '<div class="absolute border top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold rounded px-1 py-0.5 z-10 shadow-lg select-none opacity-100">!</div>' : '';

    return `
    <div class="group relative">
        ${insufficientTag}
        <div class="relative rounded-lg border border-gray-900 dark:border-gray-400 group-hover:scale-105 transition-transform duration-300 overflow-hidden w-full">
            <div class="relative w-full">
                <img src="${imageUrl}"
                     alt="${cardName}"
                     class="w-full h-auto rounded-lg select-none"
                     onerror="this.src='https://img.915159.xyz/DCCG/ja/${card.card_num}.ja.jpg'">
                <div class="absolute left-0 right-0 bottom-0 w-full bg-black/70 pb-1 rounded-b-lg">
                    <div class="text-center w-full">
                        <p class="text-2xs text-white truncate mx-1">${cardName}</p>
                        <p class="text-2xs text-white" style="font-size: min(0.5rem, 2vw);">${card.card_id}/${card.card_num}</p>
                    </div>
                </div>
            </div>
        </div>
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

// 编辑卡组
function editDeck(deckId) {
    // 跳转到卡牌编辑页面，并传递deckId参数
    window.location.href = `/cards?deckId=${encodeURIComponent(deckId)}`;
}

function exportDeck(deckId, method = 'download') {
    try {
        const decks = JSON.parse(localStorage.getItem('conan-tcg-decks') || '[]');
        const deck = decks.find(d => d.deckid === deckId);

        if (!deck) {
            showToast('找不到要导出的卡组', { isSuccess: false });
            return false;
        }

        // 准备要导出的数据
        const exportData = {
            deckid: deck.deckid,
            name: deck.name || '未命名卡组',
            description: deck.description || '',
            timestamp: deck.timestamp || new Date().toISOString(),
            cards: deck.cards || []
        };

        const jsonStr = JSON.stringify(exportData, null, 2);

        // 处理不同的导出方式
        if (method === 'copy') {
            // 复制到剪贴板
            navigator.clipboard.writeText(jsonStr)
                .then(() => showToast('卡组已复制到剪贴板'))
                .catch(err => {
                    console.error('复制失败:', err);
                    showToast('复制失败，请尝试下载方式', { isSuccess: false });
                });
            return true;
        } else {
            // 默认下载方式
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // 生成安全的文件名
            const fileName = (deck.name
                ? deck.name.replace(/[^\w\u4e00-\u9fa5]/g, '_')
                : 'conan_deck') + '.json';

            a.download = fileName;
            document.body.appendChild(a);
            a.click();

            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast('卡组导出成功');
            }, 100);
            return true;
        }

    } catch (error) {
        console.error('导出卡组失败:', error);
        showToast('导出卡组失败', { isSuccess: false });
        return false;
    }
}

function cloneDeck(deckId) {
    try {
        const decks = JSON.parse(localStorage.getItem('conan-tcg-decks') || '[]');
        const originalDeck = decks.find(d => d.deckid === deckId);

        if (!originalDeck) {
            showToast('找不到要复制的卡组', { isSuccess: false });
            return;
        }

        // 创建复制
        const clonedDeck = {
            ...originalDeck,
            deckid: Date.now().toString(36) + Math.random().toString(36).slice(2),
            timestamp: new Date().toISOString(),
            name: originalDeck.name ? `${originalDeck.name} - 副本` : '未命名卡组 - 副本'
        };

        // 保存新卡组
        decks.push(clonedDeck);
        localStorage.setItem('conan-tcg-decks', JSON.stringify(decks));

        // 直接刷新卡组列表
        loadDecks();

        showToast(`已成功复制卡组: ${clonedDeck.name}`);

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
        console.error('复制卡组失败:', error);
        showToast('复制卡组失败', { isSuccess: false });
    }
}

async function confirmDeleteDeck(deckId) {
    const result = await showConfirm('确定要删除这个卡组吗？此操作不可恢复。', { type: `error`, icon: `<svg class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>` })
    if (result) {
        deleteDeck(deckId);
        console.log('用户确认');
    }
    console.log('用户取消');
}

/**
 * 显示现代化确认对话框
 * @param {string} message - 确认消息
 * @param {Object} [options] - 配置选项
 * @param {string} [options.title='确认'] - 对话框标题
 * @param {string} [options.confirmText='确定'] - 确认按钮文本
 * @param {string} [options.cancelText='取消'] - 取消按钮文本
 * @param {string} [options.type='warning'] - 类型 (info, success, warning, error)
 * @param {string} [options.icon] - 自定义图标HTML
 * @returns {Promise<boolean>} - 返回用户选择结果(true: 确认, false: 取消)
 */
function showConfirm(message, {
    title = '确认',
    confirmText = '确定',
    cancelText = '取消',
    type = 'warning',
    icon = null
} = {}) {
    return new Promise((resolve) => {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        overlay.style.backdropFilter = 'blur(2px)';

        // 创建对话框容器
        const dialog = document.createElement('div');
        dialog.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 opacity-0 translate-y-4';

        // 图标配置
        const icons = {
            info: `<svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
            success: `<svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`,
            warning: `<svg class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`,
            error: `<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`
        };

        const dialogIcon = icon || icons[type];

        // 对话框内容
        dialog.innerHTML = `
            <div class="p-6">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        ${dialogIcon}
                    </div>
                    <div class="ml-4">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                            ${title}
                        </h3>
                        <div class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            <p>${message}</p>
                        </div>
                    </div>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" class="cancel-btn px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-300 dark:bg-gray-700 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                        ${cancelText}
                    </button>
                    <button type="button" class="confirm-btn px-4 py-2 text-sm font-medium text-white bg-${type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue'}-600 rounded-md hover:bg-${type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue'}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue'}-500">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden'; // 禁止背景滚动

        // 添加动画
        setTimeout(() => {
            dialog.style.opacity = '1';
            dialog.style.transform = 'translateY(0)';
        }, 10);

        // 确认按钮事件
        const confirmBtn = dialog.querySelector('.confirm-btn');
        confirmBtn.addEventListener('click', () => {
            closeDialog(true);
        });

        // 取消按钮事件
        const cancelBtn = dialog.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => {
            closeDialog(false);
        });

        // 点击遮罩层关闭（可选项）
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog(false);
            }
        });

        // 关闭对话框函数
        function closeDialog(result) {
            dialog.style.opacity = '0';
            dialog.style.transform = 'translateY(4px)';

            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.style.overflow = '';
                resolve(result);
            }, 300);
        }
    });
}

/**
 * 显示Toast通知
 * @param {string} message - 要显示的消息
 * @param {Object} [options] - 配置选项
 * @param {boolean} [options.isSuccess=true] - 是否为成功状态
 * @param {string} [options.position='top-right'] - 位置 (top-right, top-left, bottom-right, bottom-left)
 * @param {number} [options.duration=3000] - 显示时长(毫秒)
 * @param {string} [options.icon] - 自定义图标HTML
 */
function showToast(message, {
    isSuccess = true,
    position = 'top-right',
    duration = 3000,
    icon = null
} = {}) {
    // 创建Toast元素
    const toast = document.createElement('div');
    const toastId = `toast-${Date.now()}`;

    // 基础样式类
    const baseClasses = [
        'fixed',
        'z-50',
        'max-w-xs',
        'rounded-lg',
        'shadow-lg',
        'p-4',
        'flex',
        'items-start',
        'transform',
        'transition-all',
        'duration-300',
        'ease-in-out'
    ];

    // 根据状态添加颜色类
    const colorClasses = isSuccess
        ? ['bg-green-500', 'text-white']
        : ['bg-red-500', 'text-white'];

    // 根据位置添加定位类
    const positionMap = {
        'top-right': ['top-4', 'right-4'],
        'top-left': ['top-4', 'left-4'],
        'bottom-right': ['bottom-4', 'right-4'],
        'bottom-left': ['bottom-4', 'left-4']
    };

    // 合并所有类
    toast.className = [...baseClasses, ...colorClasses, ...positionMap[position]].join(' ');
    toast.id = toastId;
    toast.role = 'alert';
    toast.setAttribute('aria-live', 'assertive');

    // 默认图标
    const defaultIcon = isSuccess
        ? `<svg class="w-6 h-6 flex-shrink-0 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
           </svg>`
        : `<svg class="w-6 h-6 flex-shrink-0 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
           </svg>`;

    // 使用自定义图标或默认图标
    const toastIcon = icon || defaultIcon;

    // 添加内容
    toast.innerHTML = `
        ${toastIcon}
        <div class="flex-1">
            <p class="text-sm font-medium">${message}</p>
        </div>
        <button onclick="document.getElementById('${toastId}').remove()" class="ml-2 text-white opacity-70 hover:opacity-100 focus:outline-none">
            <span class="sr-only">关闭</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;

    // 添加淡入效果
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);

    // 自动关闭
    let timeoutId = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);

    // 鼠标悬停时暂停自动关闭
    toast.addEventListener('mouseenter', () => {
        clearTimeout(timeoutId);
    });

    toast.addEventListener('mouseleave', () => {
        toast.style.opacity = '1';
        timeoutId = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    });

    // 返回toast元素以便外部操作
    return toast;
}


function deleteDeck(deckId) {
    // 先执行视觉上的"删除"效果（即时反馈）
    const deletedCard = document.querySelector(`.deck-card[data-deck-id="${deckId}"]`);
    if (deletedCard) {
        // 立即开始动画效果（视觉上先隐藏）
        deletedCard.style.opacity = '0';
        deletedCard.style.transform = 'scale(0.8)';
        deletedCard.style.transition = 'all 0.2s ease';
    }

    // 然后在动画进行的同时处理数据和实际删除
    setTimeout(() => {
        const decks = JSON.parse(localStorage.getItem('conan-tcg-decks') || '[]');
        const deckToDelete = decks.find(d => d.deckid === deckId);
        const updatedDecks = decks.filter(d => d.deckid !== deckId);
        localStorage.setItem('conan-tcg-decks', JSON.stringify(updatedDecks));

        showToast(`已删除卡组: ${deckToDelete?.name || '未命名卡组'}`, {
            isSuccess: false,
            icon: `<svg class="w-6 h-6 flex-shrink-0 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
               </svg>`
        });

        // 动画完成后移除元素
        if (deletedCard) {
            deletedCard.remove();

            const allColors = new Set();
            updatedDecks.forEach(deck => {
                const deckColors = getDeckColors(deck);
                deck.colorTags = Array.from(deckColors).map(c => getColorName(c) || c).join(',');
                deckColors.forEach(color => allColors.add(color));
            });
            createColorTags(allColors);

            // 关闭模态框
            document.querySelector('.modal-backdrop')?.remove();

            // 检查是否还有卡组
            if (updatedDecks.length === 0) {
                document.getElementById('emptyDeckMessage').classList?.remove('hidden');
            }
        } else {
            // 常规处理（如果没有找到对应UI元素）
            document.querySelector('.modal-backdrop')?.remove();
            loadDecks();
        }
    }, 100); // 使用更短的延迟（100ms而非300ms）
}