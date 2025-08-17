/**
 * ReadingDeclarationApp - メインアプリケーションクラス
 * 全コンポーネントの初期化と連携、イベントハンドリングを管理
 */
class ReadingDeclarationApp {
    constructor() {
        // 各マネージャーの初期化
        this.storageManager = new StorageManager();
        this.shareManager = new ShareManager();
        this.taskManager = new TaskManager(this.storageManager);
        
        // DOM要素の参照
        this.elements = {};
        
        // 初期化
        this.init();
    }

    /**
     * アプリケーションの初期化
     */
    init() {
        // DOM要素の取得
        this.initializeElements();
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 初期データの読み込みと表示
        this.loadAndDisplayTasks();
        
        // ストレージ情報の確認
        this.checkStorageStatus();
        
        console.log('読書宣言アプリが初期化されました');
    }

    /**
     * DOM要素の参照を取得
     */
    initializeElements() {
        this.elements = {
            // フォーム関連
            bookForm: document.getElementById('book-form'),
            bookTitleInput: document.getElementById('book-title'),
            authorInput: document.getElementById('author'),
            
            // タスクリスト関連
            activeTasksList: document.getElementById('active-tasks'),
            completedTasksList: document.getElementById('completed-tasks'),
            
            // メッセージ関連
            messageContainer: document.getElementById('message-container')
        };

        // 必須要素の存在確認
        const requiredElements = ['bookForm', 'bookTitleInput', 'activeTasksList', 'completedTasksList'];
        for (const elementName of requiredElements) {
            if (!this.elements[elementName]) {
                console.error(`必須要素が見つかりません: ${elementName}`);
            }
        }
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // フォーム送信イベント
        if (this.elements.bookForm) {
            this.elements.bookForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        // 入力フィールドのリアルタイムバリデーション
        if (this.elements.bookTitleInput) {
            this.elements.bookTitleInput.addEventListener('input', () => {
                this.validateBookTitle();
            });
        }

        // ページ離脱前の確認（アクティブなタスクがある場合）
        window.addEventListener('beforeunload', (e) => {
            const activeTasks = this.taskManager.getActiveTasks();
            if (activeTasks.length > 0) {
                e.preventDefault();
                e.returnValue = '読書中のタスクがあります。本当にページを離れますか？';
            }
        });

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * フォーム送信の処理
     */
    async handleFormSubmit() {
        try {
            const bookTitle = this.elements.bookTitleInput.value.trim();
            const author = this.elements.authorInput.value.trim();

            // バリデーション
            if (!bookTitle) {
                this.showMessage('書籍タイトルを入力してください', 'error');
                this.elements.bookTitleInput.focus();
                return;
            }

            // タスクを作成
            const task = this.taskManager.addTask(bookTitle, author);
            if (!task) {
                this.showMessage('タスクの作成に失敗しました', 'error');
                return;
            }

            // Xにシェア
            const shareResult = await this.shareManager.shareDeclaration(bookTitle, author);
            
            if (shareResult.success) {
                this.showMessage('読書宣言をシェアしました！', 'success');
            } else {
                this.showMessage('シェアに失敗しました。手動で投稿してください。', 'error');
                // クリップボードにコピーを試行
                const copied = await this.shareManager.copyToClipboard(shareResult.text);
                if (copied) {
                    this.showMessage('投稿内容をクリップボードにコピーしました', 'info');
                }
            }

            // フォームをリセット
            this.elements.bookForm.reset();
            
            // タスクリストを更新
            this.displayTasks();

        } catch (error) {
            console.error('フォーム送信エラー:', error);
            this.showMessage('エラーが発生しました', 'error');
        }
    }

    /**
     * 書籍タイトルのバリデーション
     */
    validateBookTitle() {
        const input = this.elements.bookTitleInput;
        const value = input.value.trim();
        
        if (value.length === 0) {
            input.setCustomValidity('書籍タイトルは必須です');
        } else if (value.length > 100) {
            input.setCustomValidity('書籍タイトルは100文字以内で入力してください');
        } else {
            input.setCustomValidity('');
        }
    }

    /**
     * タスクの読み込みと表示
     */
    loadAndDisplayTasks() {
        this.taskManager.refresh();
        this.displayTasks();
    }

    /**
     * タスクリストの表示
     */
    displayTasks() {
        this.displayActiveTasks();
        this.displayCompletedTasks();
    }

    /**
     * アクティブなタスクの表示
     */
    displayActiveTasks() {
        const activeTasks = this.taskManager.getActiveTasks();
        const sortedTasks = this.taskManager.sortTasksByDate(activeTasks, 'desc');
        
        if (!this.elements.activeTasksList) return;

        if (sortedTasks.length === 0) {
            this.elements.activeTasksList.innerHTML = '<p class="no-tasks">読書中のタスクはありません</p>';
            return;
        }

        this.elements.activeTasksList.innerHTML = sortedTasks
            .map(task => this.createTaskItemHTML(task))
            .join('');
    }

    /**
     * 完了済みタスクの表示
     */
    displayCompletedTasks() {
        const completedTasks = this.taskManager.getCompletedTasks();
        const sortedTasks = this.taskManager.sortTasksByDate(completedTasks, 'desc');
        
        if (!this.elements.completedTasksList) return;

        if (sortedTasks.length === 0) {
            this.elements.completedTasksList.innerHTML = '<p class="no-tasks">完了したタスクはありません</p>';
            return;
        }

        this.elements.completedTasksList.innerHTML = sortedTasks
            .map(task => this.createTaskItemHTML(task))
            .join('');
    }

    /**
     * タスクアイテムのHTMLを生成
     * @param {Object} task - タスクオブジェクト
     * @returns {string} 生成されたHTML
     */
    createTaskItemHTML(task) {
        const isCompleted = task.status === 'completed';
        const createdDate = new Date(task.createdAt).toLocaleDateString('ja-JP');
        const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString('ja-JP') : '';

        return `
            <div class="task-item ${isCompleted ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-info">
                    <h4>${this.escapeHtml(task.bookTitle)}</h4>
                    ${task.author ? `<p class="author">著者: ${this.escapeHtml(task.author)}</p>` : ''}
                    <p class="date">
                        開始: ${createdDate}
                        ${completedDate ? ` | 完了: ${completedDate}` : ''}
                    </p>
                </div>
                <div class="task-actions">
                    ${!isCompleted ? `
                        <button class="btn btn-success btn-small" onclick="app.completeTask('${task.id}')">
                            ✅ 読了をシェア
                        </button>
                    ` : ''}
                    <button class="btn btn-danger btn-small" onclick="app.deleteTask('${task.id}')">
                        🗑️ 削除
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * タスクの完了処理
     * @param {string} taskId - 完了するタスクのID
     */
    async completeTask(taskId) {
        try {
            const task = this.taskManager.getTask(taskId);
            if (!task) {
                this.showMessage('タスクが見つかりません', 'error');
                return;
            }

            // タスクを完了状態に更新
            const completedTask = this.taskManager.completeTask(taskId);
            if (!completedTask) {
                this.showMessage('タスクの完了処理に失敗しました', 'error');
                return;
            }

            // 読了報告をシェア
            const shareResult = await this.shareManager.shareCompletion(task.bookTitle, task.author);
            
            if (shareResult.success) {
                this.showMessage('読了報告をシェアしました！', 'success');
            } else {
                this.showMessage('シェアに失敗しました。手動で投稿してください。', 'error');
                // クリップボードにコピーを試行
                const copied = await this.shareManager.copyToClipboard(shareResult.text);
                if (copied) {
                    this.showMessage('投稿内容をクリップボードにコピーしました', 'info');
                }
            }

            // タスクリストを更新
            this.displayTasks();

        } catch (error) {
            console.error('タスク完了エラー:', error);
            this.showMessage('エラーが発生しました', 'error');
        }
    }

    /**
     * タスクの削除処理
     * @param {string} taskId - 削除するタスクのID
     */
    deleteTask(taskId) {
        try {
            const task = this.taskManager.getTask(taskId);
            if (!task) {
                this.showMessage('タスクが見つかりません', 'error');
                return;
            }

            // 確認ダイアログ
            const confirmed = confirm(`「${task.bookTitle}」を削除しますか？`);
            if (!confirmed) return;

            // タスクを削除
            const deleted = this.taskManager.deleteTask(taskId);
            if (deleted) {
                this.showMessage('タスクを削除しました', 'success');
                this.displayTasks();
            } else {
                this.showMessage('タスクの削除に失敗しました', 'error');
            }

        } catch (error) {
            console.error('タスク削除エラー:', error);
            this.showMessage('エラーが発生しました', 'error');
        }
    }

    /**
     * メッセージの表示
     * @param {string} message - 表示するメッセージ
     * @param {string} type - メッセージタイプ ('success', 'error', 'info')
     */
    showMessage(message, type = 'info') {
        if (!this.elements.messageContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;

        this.elements.messageContainer.appendChild(messageElement);

        // 5秒後に自動削除
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 5000);
    }

    /**
     * キーボードショートカットの処理
     * @param {KeyboardEvent} e - キーボードイベント
     */
    handleKeyboardShortcuts(e) {
        // Ctrl+Enter または Cmd+Enter でフォーム送信
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (document.activeElement === this.elements.bookTitleInput || 
                document.activeElement === this.elements.authorInput) {
                e.preventDefault();
                this.handleFormSubmit();
            }
        }
    }

    /**
     * ストレージの状態確認
     */
    checkStorageStatus() {
        const storageInfo = this.storageManager.getStorageInfo();
        
        if (!storageInfo.isAvailable) {
            this.showMessage('ローカルストレージが利用できません。セッションストレージを使用します。', 'info');
        }
        
        console.log('ストレージ情報:', storageInfo);
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
}

// アプリケーションの初期化
let app;

// DOMContentLoadedイベントでアプリを初期化
document.addEventListener('DOMContentLoaded', () => {
    app = new ReadingDeclarationApp();
});

// グローバルスコープでアプリインスタンスを利用可能にする
window.app = app;