// 工具函数
export function kebabize(str) {
    let result = ''; // Use a single string to build the result
    for (let i = 0; i < str.length; i++) {
        let char = str[i];
        // Check if the character is uppercase
        if (char === char.toUpperCase() && i !== 0) { // Add a dash before uppercase letters, except the first character
            result += '-';
        }
        result += char.toLowerCase(); // Add the lowercase version of the current character to the result
    }
    return result;
}

export function copyToClipboard(element, event) {
    // 阻止事件冒泡，避免触发父元素的事件
    if (event) {
        event.stopPropagation();
    }

    // 保存原始文本和类
    const originalText = element.textContent;
    const originalClasses = element.className;

    // 防止重复点击
    if (element.dataset.copying === 'true') {
        return;
    }

    // 标记为正在复制中
    element.dataset.copying = 'true';

    // 获取要复制的文本 - 确保总是获取原始文本
    const textToCopy = originalText;

    // 更新UI反馈
    element.textContent = '已复制!';
    element.className = originalClasses + ' text-green-500'; // 添加成功样式

    // 使用Clipboard API
    navigator.clipboard.writeText(textToCopy)
        .catch(err => {
            console.error('复制失败:', err);
            // 降级方案：使用document.execCommand
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        })
        .finally(() => {
            // 恢复原始状态
            setTimeout(() => {
                element.textContent = originalText;
                element.className = originalClasses; // 完全恢复原始类
                element.dataset.copying = 'false';
            }, 500);
        });
}


// 注册卡片渲染队列
export const registeredForRendering = [];