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
    deckElement.dataset.deckId = deck.deckid; // 为元素添加data属性以便识别

    // 计算卡牌数量
    const totalCardsCount = deck.cards ? deck.cards.length : 0;

    // 获取创建时间
    const createdTime = new Date(deck.timestamp).toLocaleString('zh-CN');

    deckElement.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div class="flex items-center gap-2">
                <h3 class="text-lg font-bold dark:text-white deck-name">${deck.name || '未命名牌组'}</h3>
                <button class="edit-deck-btn text-gray-500 hover:text-blue-500 focus:outline-none" data-deck-id="${deck.deckid}" title="重命名牌组">
                    <!-- 重命名图标 -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                </button>
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400">${totalCardsCount}张卡牌</span>
        </div>
        ${deck.description ? `<p class="text-sm text-gray-600 dark:text-gray-300 mb-4">${deck.description}</p>` : ''}
        <div class="mb-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">创建时间: ${createdTime}</p>
        </div>
    `;

    // 添加编辑按钮的事件监听器
    const editBtn = deckElement.querySelector('.edit-deck-btn');
    editBtn.addEventListener('click', () => editDeckName(deck, deckElement));

    return deckElement;
}

// 编辑牌组名称
function editDeckName(deck, deckElement) {
    const nameElement = deckElement.querySelector('.deck-name');
    const currentName = deck.name || '未命名牌组';
    
    // 创建输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'text-lg font-bold dark:text-white bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500';
    
    // 保存原始内容和样式
    const originalContent = nameElement.innerHTML;
    const originalClassName = nameElement.className;
    
    // 替换内容
    nameElement.innerHTML = '';
    nameElement.appendChild(input);
    input.focus();
    
    // 处理保存逻辑
    const saveChanges = () => {
        const newName = input.value.trim();
        
        // 如果用户没有输入任何内容，则恢复为"未命名牌组"
        const finalName = newName || '未命名牌组';
        
        // 如果名称没有改变，则不进行任何操作
        if (finalName === currentName) {
            // 恢复原始内容
            nameElement.innerHTML = originalContent;
            nameElement.className = originalClassName;
            return;
        }
        
        // 更新牌组名称
        deck.name = finalName;
        
        // 保存到localStorage
        saveDeckToLocalStorage(deck);
        
        // 更新页面显示
        nameElement.textContent = finalName;
        nameElement.className = originalClassName;
    };
    
    // 监听回车键保存
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveChanges();
        }
    });
    
    // 监听失去焦点时保存
    input.addEventListener('blur', saveChanges);
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