document.addEventListener('DOMContentLoaded', () => {
    // 从本地存储加载牌组
    loadDecks();

    // 加载卡牌数据以便显示牌组详情
    loadCards();
});

// 从本地存储加载牌组
function loadDecks() {
    try {
        // 使用新的localStorage键名"conan-tcg-decks"
        const decks = JSON.parse(localStorage.getItem('conan-tcg-decks') || '[]');
        const deckListContainer = document.getElementById('deckList');
        const emptyDeckMessage = document.getElementById('emptyDeckMessage');

        if (decks.length === 0) {
            emptyDeckMessage.style.display = 'block';
            return;
        }

        emptyDeckMessage.style.display = 'none';
        deckListContainer.innerHTML = '';

        decks.forEach(deck => {
            const deckElement = createDeckElement(deck);
            deckListContainer.appendChild(deckElement);
        });
    } catch (error) {
        console.error('Failed to load decks:', error);
    }
}


// 加载卡牌数据以便显示牌组详情
function loadCards() {
    // 尝试从全局变量获取卡牌数据
    if (window.cardsData) {
        // 卡牌数据已加载，更新牌组列表
        loadDecks();
    } else {
        // 否则从API获取
        fetch('/data/cards_ja.json')
            .then(response => response.json())
            .then(data => {
                window.cardsData = data;
                // 数据加载完成后更新牌组列表
                loadDecks();
            })
            .catch(error => {
                console.error('Failed to load cards:', error);
            });
    }
}

function createDeckElement(deck) {
    const deckElement = document.createElement('div');
    deckElement.className = 'border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200';

    // 计算卡牌数量
    const totalCardsCount = deck.cards ? deck.cards.length : 0;

    // 获取创建时间
    const createdTime = new Date(deck.timestamp).toLocaleString('zh-CN');

    deckElement.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <h3 class="text-lg font-bold dark:text-white">${deck.name || '未命名牌组'}</h3>
            <span class="text-sm text-gray-500 dark:text-gray-400">${totalCardsCount}张卡牌</span>
        </div>
        ${deck.description ? `<p class="text-sm text-gray-600 dark:text-gray-300 mb-4">${deck.description}</p>` : ''}
        <div class="mb-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">创建时间: ${createdTime}</p>
        </div>
        <div class="flex gap-2">
            <button class="view-deck-btn px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800" data-deck-id="${deck.deckid}">查看</button>
            <button class="delete-deck-btn px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800" data-deck-id="${deck.deckid}">删除</button>
        </div>
    `;

    // 添加事件监听器
    const viewBtn = deckElement.querySelector('.view-deck-btn');
    const deleteBtn = deckElement.querySelector('.delete-deck-btn');

    viewBtn.addEventListener('click', () => viewDeck(deck));
    deleteBtn.addEventListener('click', () => deleteDeck(deck.deckid));

    return deckElement;
}

// 查看牌组
function viewDeck(deck) {
    // 跳转到组牌器页面并加载该牌组
    // 首先将当前牌组数据存储到sessionStorage
    sessionStorage.setItem('viewedDeck', JSON.stringify(deck));
    // 然后跳转
    window.location.href = '/deck/';
}

// 删除牌组
function deleteDeck(deckId) {
    // 根据deckId找到牌组名称用于确认提示
    const decks = JSON.parse(localStorage.getItem('conan-tcg-decks') || '[]');
    const deckToDelete = decks.find(deck => deck.deckid === deckId);
    const deckName = deckToDelete ? deckToDelete.name : '未知牌组';

    if (confirm(`确定要删除牌组: ${deckName}吗？`)) {
        try {
            const updatedDecks = decks.filter(deck => deck.deckid !== deckId);
            localStorage.setItem('conan-tcg-decks', JSON.stringify(updatedDecks));
            // 重新加载牌组列表
            loadDecks();
            // 显示成功消息
            alert(`牌组 ${deckName} 已删除`);
        } catch (error) {
            console.error('Failed to delete deck:', error);
            alert('删除牌组失败');
        }
    }
}