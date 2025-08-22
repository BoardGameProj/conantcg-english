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
    element.className = originalClasses + ' text-green-500 dark:text-green-500 select-none'; // 添加成功样式

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


/**
 * 显示Toast通知
 * @param {string} message - 要显示的消息
 * @param {Object} [options] - 配置选项
 * @param {boolean} [options.isSuccess=true] - 是否为成功状态
 * @param {string} [options.position='top-right'] - 位置 (top-right, top-left, bottom-right, bottom-left)
 * @param {number} [options.duration=3000] - 显示时长(毫秒)
 * @param {string} [options.icon] - 自定义图标HTML
 */
export function showToast(message, {
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
export function showConfirm(message, {
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
                    <button type="button" class="cancel-btn px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
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

// 注册卡片渲染队列
export const registeredForRendering = [];
