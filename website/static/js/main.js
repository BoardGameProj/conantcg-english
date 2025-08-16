import { Card } from './core/Card.js';
import { DeckBuilder } from './core/DeckBuilder.js';
import { PopoverManager } from './core/PopoverManager.js';
import { copyToClipboard, registeredForRendering } from './utils.js';

// 初始化牌组构建器
window.deckBuilder = new DeckBuilder();

// 保留原有DOMContentLoaded逻辑
document.addEventListener("DOMContentLoaded", () => {
    for (const card of registeredForRendering) {
        card.render();
    }
    
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const deckId = urlParams.get('deckId');
    
    if (deckId) {
        window.deckBuilder.loadDeckById(deckId);
    }
});

// 暴露必要全局变量
window.copyToClipboard = copyToClipboard;
window.PopoverManager = PopoverManager;
window.Card = Card;