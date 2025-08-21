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
        this.notificationManager = new NotificationManager();
        this.inputValidator = new InputValidator();
        
        // DOM要素の参照
        this.elements = {};
        
        // バリデーション状態
        this.validationState = {
            bookTitle: { isValid: false, errors: [] },
            author: { isValid: true, errors: [] } // 任意項目なので初期状態は有効
        };
        
        // ユーザーが操作したフィールドを追跡
        this.interactedFields = new Set();

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
            
            // 文字カウンター
            bookTitleCounter: document.getElementById('book-title-counter'),
            authorCounter: document.getElementById('author-counter'),
            
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
        this.setupInputValidation();

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // タスクリストのイベントデリゲーション
        const taskListClickHandler = (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;

            const taskItem = button.closest('.task-item[data-task-id]');
            if (!taskItem) return;

            const taskId = taskItem.dataset.taskId;
            const action = button.dataset.action;

            if (action === 'complete') {
                this.completeTask(taskId);
            } else if (action === 'delete') {
                this.deleteTask(taskId);
            }
        };

        if (this.elements.activeTasksList) {
            this.elements.activeTasksList.addEventListener('click', taskListClickHandler);
        }
        if (this.elements.completedTasksList) {
            this.elements.completedTasksList.addEventListener('click', taskListClickHandler);
        }
    }

    /**
     * 入力バリデーションの設定
     */
    setupInputValidation() {
        const setupFieldValidation = (inputElement, fieldName) => {
            if (!inputElement) return;

            // 初回インタラクション: 実際に値を入力した/貼り付けた場合のみ即時確定。
            // blur だけでは（未入力なら）インタラクション扱いにしないことで
            // 他ボタン（読了/削除）クリック時のフォーカス移動でエラー表示が出るのを防ぐ。
            const markInteracted = () => {
                if (!this.interactedFields.has(fieldName)) {
                    this.interactedFields.add(fieldName);
                }
            };

            inputElement.addEventListener('input', () => {
                // 実際に文字が入ったタイミングでインタラクション確定
                if (inputElement.value.length > 0) {
                    markInteracted();
                } else {
                    // 全て消去されたら「未操作」状態に戻し UI をクリア
                    if (this.interactedFields.has(fieldName)) {
                        this.interactedFields.delete(fieldName);
                    }
                    this.clearFieldValidationUI(inputElement);
                }
            });
            inputElement.addEventListener('paste', () => {
                setTimeout(() => {
                    if (inputElement.value.length > 0) {
                        markInteracted();
                    }
                }, 0);
            });
            inputElement.addEventListener('blur', () => {
                // フィールドを離れる時点で内容が入っていればインタラクション扱い
                if (inputElement.value.trim().length > 0) {
                    markInteracted();
                    // 既に検証済み結果があればUI反映（ユーザー入力があったケース）
                    const result = this.validationState[fieldName];
                    if (result) {
                        this.inputValidator.updateFieldUI(inputElement, result);
                    }
                }
            });

            // リアルタイムバリデーションを設定
            this.inputValidator.setupRealtimeValidation(
                inputElement,
                (name, result) => {
                    // バリデーション状態を更新
                    this.validationState[name] = result;

                    // 関連コンポーネントを更新
                    this.updateCharacterCounter(name);
                    this.updateSubmitButton();

                    // ユーザーが操作した（入力した）フィールドのみUIを更新
                    if (this.interactedFields.has(name)) {
                        this.inputValidator.updateFieldUI(inputElement, result);
                    }
                }
            );
        };

        setupFieldValidation(this.elements.bookTitleInput, 'bookTitle');
        setupFieldValidation(this.elements.authorInput, 'author');
    }

    /**
     * 単一フィールドのバリデーションUIをクリア
     * @param {HTMLElement} inputElement 
     */
    clearFieldValidationUI(inputElement) {
        const formGroup = inputElement.closest('.form-group');
        inputElement.classList.remove('valid', 'error');
        inputElement.setAttribute('aria-invalid', 'false');
        if (formGroup) {
            formGroup.classList.remove('has-success', 'has-error');
            const existingError = formGroup.querySelector('.field-error');
            if (existingError) existingError.remove();
        }
    }

    /**
     * 文字カウンターの更新
     * @param {string} fieldName - フィールド名
     */
    updateCharacterCounter(fieldName) {
        const input = this.elements[fieldName + 'Input'];
        const counter = this.elements[fieldName + 'Counter'];
        
        if (!input || !counter) return;

        const currentLength = input.value.length;
        const maxLength = input.getAttribute('maxlength') || 0;
        
        counter.textContent = `${currentLength}/${maxLength}文字`;
        
        // 文字数に応じてスタイルを変更
        counter.classList.remove('warning', 'error');
        
        if (currentLength > maxLength * 0.9) {
            counter.classList.add('warning');
        }
        
        if (currentLength >= maxLength) {
            counter.classList.add('error');
        }
    }

    /**
     * 送信ボタンの状態更新
     */
    updateSubmitButton() {
        const submitButton = this.elements.bookForm.querySelector('button[type="submit"]');
        if (!submitButton) return;

        const isFormValid = this.validationState.bookTitle.isValid && 
                           this.validationState.author.isValid;
        
        submitButton.disabled = !isFormValid;
        
        if (isFormValid) {
            submitButton.classList.remove('disabled');
            submitButton.setAttribute('aria-describedby', 'submit-help');
        } else {
            submitButton.classList.add('disabled');
            submitButton.setAttribute('aria-describedby', 'submit-help validation-error');
        }
    }

    /**
     * フォーム送信の処理
     */
    async handleFormSubmit() {
        try {
            // フォームデータを取得
            const formData = {
                bookTitle: this.elements.bookTitleInput.value,
                author: this.elements.authorInput.value
            };

            // 包括的なバリデーション
            const validationResult = this.inputValidator.validateForm(formData);
            
            if (!validationResult.isValid) {
                // バリデーションエラーを表示
                this.notificationManager.showValidationErrors(validationResult.errors);
                
                // 最初のエラーフィールドにフォーカス
                const firstErrorField = Object.keys(validationResult.fieldErrors)[0];
                if (firstErrorField && this.elements[firstErrorField + 'Input']) {
                    this.elements[firstErrorField + 'Input'].focus();
                }
                return;
            }

            // サニタイズされたデータを使用
            const { bookTitle, author } = validationResult.sanitizedData;

            // タスクを作成
            const task = this.taskManager.addTask(bookTitle, author);
            if (!task) {
                this.notificationManager.error('タスクの作成に失敗しました', {
                    details: 'ローカルストレージへの保存でエラーが発生しました',
                    actions: [
                        {
                            label: '再試行',
                            style: 'btn-primary',
                            handler: () => this.handleFormSubmit()
                        }
                    ]
                });
                return;
            }

            // Xにシェア
            const shareResult = await this.shareManager.shareDeclaration(bookTitle, author);
            
            if (shareResult.success) {
                this.notificationManager.success('読書宣言をシェアしました！', {
                    details: `「${bookTitle}」の読書を開始しました`
                });
            } else {
                // エラータイプに応じたメッセージを表示
                this.notificationManager.showShareError('読書宣言', shareResult);
            }

            // フォームをリセット
            this.resetForm();
            
            // タスクリストを更新
            this.displayTasks();

            // フォーカスを書籍タイトル入力フィールドに戻す
            this.elements.bookTitleInput.focus();

        } catch (error) {
            console.error('フォーム送信エラー:', error);
            this.notificationManager.critical('予期しないエラーが発生しました', {
                details: error.message,
                errorCode: 'FORM_SUBMIT_ERROR',
                retryHandler: () => this.handleFormSubmit()
            });
        }
    }

    /**
     * フォームをリセット
     */
    resetForm() {
        // フォーム要素をリセット
        this.elements.bookForm.reset();
        
        // バリデーション状態をリセット
        this.inputValidator.resetFormValidation(this.elements.bookForm);
        
        // バリデーション状態を初期化
        this.validationState = {
            bookTitle: { isValid: false, errors: [] },
            author: { isValid: true, errors: [] }
        };
        
        // 文字カウンターをリセット
        this.updateCharacterCounter('bookTitle');
        this.updateCharacterCounter('author');
        
        // 送信ボタンの状態を更新
        this.updateSubmitButton();
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

        // セキュリティ: すべてのユーザー入力をサニタイズ
        const sanitizedTitle = this.inputValidator.sanitizeForOutput(task.bookTitle);
        const sanitizedAuthor = task.author ? this.inputValidator.sanitizeForOutput(task.author) : '';
        const sanitizedId = this.escapeHtml(task.id);

        return `
            <div class="task-item ${isCompleted ? 'completed' : ''}" 
                 data-task-id="${sanitizedId}"
                 role="article"
                 aria-label="${sanitizedTitle}の読書タスク"
                 tabindex="0">
                <div class="task-info">
                    <h4 id="task-title-${sanitizedId}">${sanitizedTitle}</h4>
                    ${sanitizedAuthor ? `<p class="author">著者: ${sanitizedAuthor}</p>` : ''}
                    <p class="date">
                        開始: ${createdDate}
                        ${completedDate ? ` | 完了: ${completedDate}` : ''}
                    </p>
                </div>
                <div class="task-actions" role="group" aria-labelledby="task-title-${sanitizedId}">
                    ${!isCompleted ? `
                        <button class="btn btn-success btn-small" 
                                data-action="complete"
                                aria-label="${sanitizedTitle}の読了をシェア"
                                tabindex="0">
                            ✅ 読了をシェア
                        </button>
                    ` : ''}
                    <button class="btn btn-danger btn-small" 
                            data-action="delete"
                            aria-label="${sanitizedTitle}のタスクを削除"
                            tabindex="0">
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
                this.notificationManager.error('タスクが見つかりません', {
                    details: '指定されたタスクIDが存在しません',
                    errorCode: 'TASK_NOT_FOUND'
                });
                return;
            }

            // タスクを完了状態に更新
            const completedTask = this.taskManager.completeTask(taskId);
            if (!completedTask) {
                this.notificationManager.error('タスクの完了処理に失敗しました', {
                    details: 'ローカルストレージの更新でエラーが発生しました',
                    actions: [
                        {
                            label: '再試行',
                            style: 'btn-primary',
                            handler: () => this.completeTask(taskId)
                        }
                    ]
                });
                return;
            }

            // 読了報告をシェア
            const shareResult = await this.shareManager.shareCompletion(task.bookTitle, task.author);
            
            if (shareResult.success) {
                this.notificationManager.success('読了報告をシェアしました！', {
                    details: `「${task.bookTitle}」を読み終わりました`
                });
            } else {
                // エラータイプに応じたメッセージを表示
                this.notificationManager.showShareError('読了報告', shareResult);
            }

            // タスクリストを更新
            this.displayTasks();

            // フォーカスを適切な場所に移動
            this.manageFocusAfterTaskUpdate();

        } catch (error) {
            console.error('タスク完了エラー:', error);
            this.notificationManager.critical('タスク完了処理でエラーが発生しました', {
                details: error.message,
                errorCode: 'TASK_COMPLETE_ERROR',
                retryHandler: () => this.completeTask(taskId)
            });
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
                this.notificationManager.error('タスクが見つかりません', {
                    details: '指定されたタスクIDが存在しません',
                    errorCode: 'TASK_NOT_FOUND'
                });
                return;
            }

            // 確認ダイアログ
            const confirmed = confirm(`「${task.bookTitle}」を削除しますか？`);
            if (!confirmed) return;

            // タスクを削除
            const deleted = this.taskManager.deleteTask(taskId);
            if (deleted) {
                this.notificationManager.success('タスクを削除しました', {
                    details: `「${task.bookTitle}」を削除しました`
                });
                this.displayTasks();
                
                // フォーカスを適切な場所に移動
                this.manageFocusAfterTaskUpdate();
            } else {
                this.notificationManager.error('タスクの削除に失敗しました', {
                    details: 'ローカルストレージからの削除でエラーが発生しました',
                    actions: [
                        {
                            label: '再試行',
                            style: 'btn-primary',
                            handler: () => this.deleteTask(taskId)
                        }
                    ]
                });
            }

        } catch (error) {
            console.error('タスク削除エラー:', error);
            this.notificationManager.critical('タスク削除処理でエラーが発生しました', {
                details: error.message,
                errorCode: 'TASK_DELETE_ERROR',
                retryHandler: () => this.deleteTask(taskId)
            });
        }
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

        // Escapeキーでメッセージを閉じる
        if (e.key === 'Escape') {
            this.notificationManager.clearAll();
        }

        // タスクリスト内でのキーボードナビゲーション
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            this.handleTaskListNavigation(e);
        }

        // Enterキーまたはスペースキーでボタンを実行
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('btn')) {
            e.preventDefault();
            e.target.click();
        }
    }

    /**
     * タスクリスト内でのキーボードナビゲーション
     * @param {KeyboardEvent} e - キーボードイベント
     */
    handleTaskListNavigation(e) {
        const focusableElements = document.querySelectorAll('.task-item .btn, .task-item');
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
        
        if (currentIndex === -1) return;

        e.preventDefault();
        
        let nextIndex;
        if (e.key === 'ArrowDown') {
            nextIndex = (currentIndex + 1) % focusableElements.length;
        } else {
            nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
        }
        
        focusableElements[nextIndex].focus();
    }



    /**
     * タスク更新後のフォーカス管理
     */
    manageFocusAfterTaskUpdate() {
        // 最初のアクティブなタスクまたは書籍タイトル入力フィールドにフォーカス
        const firstActiveTask = document.querySelector('.task-item:not(.completed)');
        if (firstActiveTask) {
            firstActiveTask.focus();
        } else {
            // アクティブなタスクがない場合は入力フィールドにフォーカス
            if (this.elements.bookTitleInput) {
                this.elements.bookTitleInput.focus();
            }
        }
    }

    /**
     * ストレージの状態確認
     */
    checkStorageStatus() {
        const storageInfo = this.storageManager.getStorageInfo();
        
        if (!storageInfo.isAvailable) {
            this.notificationManager.warning('ローカルストレージが利用できません', {
                details: 'セッションストレージを使用します。ブラウザを閉じるとデータが失われます。',
                persistent: true,
                actions: [
                    {
                        label: 'ブラウザ設定を確認',
                        style: 'btn-primary',
                        handler: () => {
                            this.notificationManager.info('ブラウザの設定でローカルストレージを有効にしてください');
                        }
                    }
                ]
            });
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
    // グローバルスコープでアプリインスタンスを利用可能にする
    window.app = new ReadingDeclarationApp();
});