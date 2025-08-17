/**
 * NotificationManager - エラーメッセージとユーザー通知システム
 * 各種エラー状況に対応したメッセージ表示機能と成功時の確認メッセージを提供
 */
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        this.init();
    }

    /**
     * 通知システムの初期化
     */
    init() {
        this.container = document.getElementById('message-container');
        if (!this.container) {
            console.error('メッセージコンテナが見つかりません');
            this.createContainer();
        }
        
        // 既存の通知をクリア
        this.clearAll();
        
        console.log('通知システムが初期化されました');
    }

    /**
     * メッセージコンテナを動的に作成
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'message-container';
        this.container.className = 'message-container';
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', '通知メッセージ');
        this.container.setAttribute('aria-live', 'polite');
        document.body.appendChild(this.container);
    }

    /**
     * 通知を表示
     * @param {string} message - 表示するメッセージ
     * @param {string} type - 通知タイプ ('success', 'error', 'warning', 'info')
     * @param {Object} options - オプション設定
     * @returns {string} 通知ID
     */
    show(message, type = 'info', options = {}) {
        const config = {
            duration: options.duration || this.defaultDuration,
            persistent: options.persistent || false,
            actions: options.actions || [],
            details: options.details || null,
            errorCode: options.errorCode || null,
            priority: options.priority || 'normal', // 'low', 'normal', 'high', 'critical'
            ...options
        };

        // 重複チェック
        if (this.isDuplicate(message, type)) {
            return null;
        }

        // 最大通知数チェック
        if (this.notifications.size >= this.maxNotifications) {
            this.removeOldest();
        }

        const notificationId = this.generateId();
        const notification = this.createNotification(notificationId, message, type, config);
        
        this.notifications.set(notificationId, {
            element: notification,
            type: type,
            message: message,
            timestamp: Date.now(),
            config: config
        });

        this.container.appendChild(notification);
        
        // アニメーション開始
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // 自動削除の設定
        if (!config.persistent && config.duration > 0) {
            setTimeout(() => {
                this.remove(notificationId);
            }, config.duration);
        }

        // 高優先度の場合はフォーカス
        if (config.priority === 'critical' || type === 'error') {
            notification.focus();
        }

        // アクセシビリティ通知
        this.announceToScreenReader(message, type);

        return notificationId;
    }

    /**
     * 通知要素を作成
     * @param {string} id - 通知ID
     * @param {string} message - メッセージ
     * @param {string} type - 通知タイプ
     * @param {Object} config - 設定
     * @returns {HTMLElement} 通知要素
     */
    createNotification(id, message, type, config) {
        const notification = document.createElement('div');
        notification.id = `notification-${id}`;
        notification.className = `message ${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        notification.setAttribute('tabindex', '0');
        notification.setAttribute('data-notification-id', id);

        // メッセージ内容
        const content = document.createElement('div');
        content.className = 'message-content';
        
        // メインメッセージ
        const messageElement = document.createElement('div');
        messageElement.className = 'message-text';
        messageElement.textContent = message;
        content.appendChild(messageElement);

        // エラーコード表示
        if (config.errorCode) {
            const errorCode = document.createElement('div');
            errorCode.className = 'message-error-code';
            errorCode.textContent = `エラーコード: ${config.errorCode}`;
            content.appendChild(errorCode);
        }

        // 詳細情報
        if (config.details) {
            const details = document.createElement('div');
            details.className = 'message-details';
            details.innerHTML = this.escapeHtml(config.details);
            content.appendChild(details);
        }

        notification.appendChild(content);

        // アクションボタン
        if (config.actions && config.actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'message-actions';
            
            config.actions.forEach(action => {
                const button = document.createElement('button');
                button.className = `btn btn-small message-action-btn ${action.style || 'btn-secondary'}`;
                button.textContent = action.label;
                button.setAttribute('aria-label', action.ariaLabel || action.label);
                
                button.onclick = (e) => {
                    e.stopPropagation();
                    if (action.handler) {
                        action.handler(id);
                    }
                    if (action.dismissOnClick !== false) {
                        this.remove(id);
                    }
                };
                
                actionsContainer.appendChild(button);
            });
            
            notification.appendChild(actionsContainer);
        }

        // 閉じるボタン
        if (!config.persistent) {
            const closeButton = document.createElement('button');
            closeButton.className = 'message-close';
            closeButton.innerHTML = '×';
            closeButton.setAttribute('aria-label', 'メッセージを閉じる');
            closeButton.onclick = (e) => {
                e.stopPropagation();
                this.remove(id);
            };
            notification.appendChild(closeButton);
        }

        // 進行状況バー（自動削除の場合）
        if (!config.persistent && config.duration > 0 && config.showProgress !== false) {
            const progressBar = document.createElement('div');
            progressBar.className = 'message-progress';
            progressBar.innerHTML = '<div class="message-progress-bar"></div>';
            notification.appendChild(progressBar);
            
            // プログレスバーのアニメーション
            const progressBarInner = progressBar.querySelector('.message-progress-bar');
            progressBarInner.style.animationDuration = `${config.duration}ms`;
        }

        return notification;
    }

    /**
     * 成功メッセージを表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {string} 通知ID
     */
    success(message, options = {}) {
        return this.show(message, 'success', {
            duration: 3000,
            ...options
        });
    }

    /**
     * エラーメッセージを表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {string} 通知ID
     */
    error(message, options = {}) {
        return this.show(message, 'error', {
            duration: 8000,
            priority: 'high',
            ...options
        });
    }

    /**
     * 警告メッセージを表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {string} 通知ID
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', {
            duration: 6000,
            ...options
        });
    }

    /**
     * 情報メッセージを表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {string} 通知ID
     */
    info(message, options = {}) {
        return this.show(message, 'info', {
            duration: 4000,
            ...options
        });
    }

    /**
     * 重大なエラーメッセージを表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {string} 通知ID
     */
    critical(message, options = {}) {
        return this.show(message, 'error', {
            persistent: true,
            priority: 'critical',
            actions: [
                {
                    label: '再試行',
                    style: 'btn-primary',
                    handler: options.retryHandler || null
                },
                {
                    label: '閉じる',
                    style: 'btn-secondary',
                    handler: () => {}
                }
            ],
            ...options
        });
    }

    /**
     * ストレージエラーの表示
     * @param {string} operation - 操作名
     * @param {Error} error - エラーオブジェクト
     */
    showStorageError(operation, error) {
        const message = `ストレージ操作に失敗しました: ${operation}`;
        return this.error(message, {
            details: error.message,
            errorCode: 'STORAGE_ERROR',
            actions: [
                {
                    label: 'ページを再読み込み',
                    style: 'btn-primary',
                    handler: () => window.location.reload()
                }
            ]
        });
    }

    /**
     * ネットワークエラーの表示
     * @param {string} operation - 操作名
     * @param {Error} error - エラーオブジェクト
     */
    showNetworkError(operation, error) {
        const message = `ネットワークエラーが発生しました: ${operation}`;
        return this.error(message, {
            details: 'インターネット接続を確認してください',
            errorCode: 'NETWORK_ERROR',
            actions: [
                {
                    label: '再試行',
                    style: 'btn-primary',
                    handler: () => window.location.reload()
                }
            ]
        });
    }

    /**
     * バリデーションエラーの表示
     * @param {Array} errors - エラーメッセージの配列
     */
    showValidationErrors(errors) {
        const message = 'フォームに入力エラーがあります';
        const details = errors.map(error => `• ${error}`).join('\n');
        
        return this.error(message, {
            details: details,
            errorCode: 'VALIDATION_ERROR',
            duration: 6000
        });
    }

    /**
     * シェアエラーの表示
     * @param {string} shareType - シェアタイプ
     * @param {Object} shareResult - シェア結果
     */
    showShareError(shareType, shareResult) {
        const { errorType, error, manualOption } = shareResult;
        
        let message = '';
        let actions = [];
        
        switch (errorType) {
            case 'POPUP_BLOCKED':
                message = 'ポップアップがブロックされました';
                actions = [
                    {
                        label: 'ポップアップを許可',
                        style: 'btn-primary',
                        handler: () => {
                            this.info('ブラウザの設定でポップアップを許可してから再試行してください');
                        }
                    }
                ];
                break;
                
            case 'URL_GENERATION_ERROR':
                message = `${shareType}のURL生成に失敗しました`;
                break;
                
            case 'CRITICAL_ERROR':
                message = `${shareType}のシェアに失敗しました`;
                break;
                
            default:
                message = `${shareType}のシェアでエラーが発生しました`;
        }
        
        // マニュアル投稿オプションがある場合
        if (manualOption && manualOption.text) {
            actions.push({
                label: '手動投稿用テキストを表示',
                style: 'btn-info',
                handler: () => {
                    this.showManualPostText(manualOption.text);
                }
            });
        }
        
        return this.error(message, {
            details: error,
            errorCode: errorType,
            actions: actions
        });
    }

    /**
     * 手動投稿用テキストを表示
     * @param {string} text - 投稿テキスト
     */
    showManualPostText(text) {
        return this.info('手動投稿用テキスト', {
            persistent: true,
            details: `以下のテキストをコピーしてXに投稿してください:\n\n${text}`,
            actions: [
                {
                    label: 'テキストをコピー',
                    style: 'btn-primary',
                    handler: async () => {
                        try {
                            await navigator.clipboard.writeText(text);
                            this.success('テキストをクリップボードにコピーしました');
                        } catch (error) {
                            this.error('コピーに失敗しました');
                        }
                    }
                },
                {
                    label: 'Xを開く',
                    style: 'btn-secondary',
                    handler: () => {
                        window.open('https://x.com/compose/post', '_blank');
                    }
                }
            ]
        });
    }

    /**
     * 通知を削除
     * @param {string} id - 通知ID
     */
    remove(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        const element = notification.element;
        
        // 削除アニメーション
        element.classList.add('dismissing');
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(id);
        }, 300);
    }

    /**
     * 全ての通知をクリア
     */
    clearAll() {
        this.notifications.forEach((notification, id) => {
            this.remove(id);
        });
    }

    /**
     * 特定のタイプの通知をクリア
     * @param {string} type - 通知タイプ
     */
    clearByType(type) {
        this.notifications.forEach((notification, id) => {
            if (notification.type === type) {
                this.remove(id);
            }
        });
    }

    /**
     * 重複チェック
     * @param {string} message - メッセージ
     * @param {string} type - タイプ
     * @returns {boolean} 重複している場合true
     */
    isDuplicate(message, type) {
        for (const notification of this.notifications.values()) {
            if (notification.message === message && notification.type === type) {
                // 既存の通知を更新（点滅効果）
                notification.element.classList.add('duplicate-flash');
                setTimeout(() => {
                    notification.element.classList.remove('duplicate-flash');
                }, 500);
                return true;
            }
        }
        return false;
    }

    /**
     * 最も古い通知を削除
     */
    removeOldest() {
        let oldestId = null;
        let oldestTime = Date.now();
        
        this.notifications.forEach((notification, id) => {
            if (notification.timestamp < oldestTime) {
                oldestTime = notification.timestamp;
                oldestId = id;
            }
        });
        
        if (oldestId) {
            this.remove(oldestId);
        }
    }

    /**
     * スクリーンリーダー用の通知
     * @param {string} message - メッセージ
     * @param {string} type - タイプ
     */
    announceToScreenReader(message, type) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `${type}: ${message}`;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * 一意のIDを生成
     * @returns {string} 生成されたID
     */
    generateId() {
        return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * HTMLエスケープ
     * @param {string} text - エスケープするテキスト
     * @returns {string} エスケープされたテキスト
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 通知の統計情報を取得
     * @returns {Object} 統計情報
     */
    getStats() {
        const stats = {
            total: this.notifications.size,
            byType: {}
        };
        
        this.notifications.forEach(notification => {
            const type = notification.type;
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });
        
        return stats;
    }
}