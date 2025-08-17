/**
 * Task - 読書タスクのデータモデルクラス
 * タスクの作成、バリデーション、UUID生成機能を提供
 */
class Task {
    /**
     * タスクを作成
     * @param {string} bookTitle - 書籍タイトル
     * @param {string} author - 著者名（オプション）
     */
    constructor(bookTitle, author = '') {
        this.id = this.generateUUID();
        this.bookTitle = bookTitle;
        this.author = author;
        this.status = 'active';
        this.createdAt = new Date();
        this.completedAt = null;
    }

    /**
     * UUIDを生成
     * @returns {string} UUID文字列
     */
    generateUUID() {
        // RFC 4122 version 4 UUID生成
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * タスクを完了状態にする
     */
    complete() {
        this.status = 'completed';
        this.completedAt = new Date();
    }

    /**
     * タスクがアクティブかどうかを判定
     * @returns {boolean} アクティブな場合true
     */
    isActive() {
        return this.status === 'active';
    }

    /**
     * タスクが完了済みかどうかを判定
     * @returns {boolean} 完了済みの場合true
     */
    isCompleted() {
        return this.status === 'completed';
    }

    /**
     * タスクデータをJSON形式で取得
     * @returns {Object} タスクデータ
     */
    toJSON() {
        return {
            id: this.id,
            bookTitle: this.bookTitle,
            author: this.author,
            status: this.status,
            createdAt: this.createdAt,
            completedAt: this.completedAt
        };
    }

    /**
     * JSONデータからTaskインスタンスを作成
     * @param {Object} data - タスクデータ
     * @returns {Task} Taskインスタンス
     */
    static fromJSON(data) {
        const task = new Task(data.bookTitle, data.author);
        task.id = data.id;
        task.status = data.status;
        task.createdAt = new Date(data.createdAt);
        task.completedAt = data.completedAt ? new Date(data.completedAt) : null;
        return task;
    }
}

/**
 * TaskValidator - タスクデータのバリデーション機能を提供
 */
class TaskValidator {
    /**
     * 書籍タイトルをバリデーション
     * @param {string} title - 書籍タイトル
     * @returns {Object} バリデーション結果
     */
    static validateBookTitle(title) {
        const errors = [];
        
        // 必須チェック
        if (!title || typeof title !== 'string') {
            errors.push('書籍タイトルは必須です');
        } else {
            // 空文字・空白のみチェック
            if (title.trim().length === 0) {
                errors.push('書籍タイトルを入力してください');
            }
            
            // 文字数制限（Xの文字数制限を考慮）
            if (title.length > 100) {
                errors.push('書籍タイトルは100文字以内で入力してください');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 著者名をバリデーション
     * @param {string} author - 著者名
     * @returns {Object} バリデーション結果
     */
    static validateAuthor(author) {
        const errors = [];
        
        // 著者名はオプションなので、空の場合はOK
        if (author && typeof author === 'string') {
            // 文字数制限
            if (author.length > 50) {
                errors.push('著者名は50文字以内で入力してください');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * タスクデータ全体をバリデーション
     * @param {Object} taskData - タスクデータ
     * @returns {Object} バリデーション結果
     */
    static validateTaskData(taskData) {
        const titleValidation = this.validateBookTitle(taskData.bookTitle);
        const authorValidation = this.validateAuthor(taskData.author);
        
        const allErrors = [...titleValidation.errors, ...authorValidation.errors];
        
        return {
            isValid: allErrors.length === 0,
            errors: allErrors,
            details: {
                title: titleValidation,
                author: authorValidation
            }
        };
    }

    /**
     * 入力データをサニタイズ
     * @param {string} input - 入力文字列
     * @returns {string} サニタイズされた文字列
     */
    static sanitizeInput(input) {
        if (typeof input !== 'string') {
            return '';
        }
        
        return input
            .trim()
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * タスク作成用のデータを準備・バリデーション
     * @param {string} bookTitle - 書籍タイトル
     * @param {string} author - 著者名
     * @returns {Object} 準備されたデータとバリデーション結果
     */
    static prepareTaskData(bookTitle, author = '') {
        // 入力データのサニタイズ
        const sanitizedTitle = this.sanitizeInput(bookTitle);
        const sanitizedAuthor = this.sanitizeInput(author);
        
        // バリデーション実行
        const validation = this.validateTaskData({
            bookTitle: sanitizedTitle,
            author: sanitizedAuthor
        });
        
        return {
            data: {
                bookTitle: sanitizedTitle,
                author: sanitizedAuthor
            },
            validation: validation
        };
    }
}