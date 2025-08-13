document.addEventListener('DOMContentLoaded', () => {
    loadDecks();
});

// 从本地存储加载牌组
function loadDecks() {
    try {
        // 使用localStorage键名"conan-tcg-decks"获取牌组数据
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
    `;

    return deckElement;
}