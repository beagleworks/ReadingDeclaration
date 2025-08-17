/**
 * StorageManager - ローカルストレージの管理を行うクラス
 * ローカルストレージへの保存・読み込み・更新・削除機能を提供
 */
class StorageManager {
    constructor() {
        this.storageKey = 'reading-tasks';
        this.fallbackToSession = false;
    }

    /**
     * ローカルストレージが利用可能かチェック
     * @returns {boolean} 利用可能な場合true
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 使用するストレージを取得（ローカルストレージまたはセッションストレージ）
     * @returns {Storage} ストレージオブジェクト
     */
    getStorage() {
        if (this.isStorageAvailable()) {
            return localStorage;
        } else {
            this.fallbackToSession = true;
            return sessionStorage;
        }
    }

    /**
     * 全てのタスクを読み込み
     * @returns {Array} タスクの配列
     */
    loadTasks() {
        try {
            const storage = this.getStorage();
            const tasksJson = storage.getItem(this.storageKey);
            
            if (!tasksJson) {
                return [];
            }

            const tasks = JSON.parse(tasksJson);
            
            // 日付文字列をDateオブジェクトに変換
            return tasks.map(task => ({
                ...task,
                createdAt: new Date(task.createdAt),
                completedAt: task.completedAt ? new Date(task.completedAt) : null
            }));
        } catch (error) {
            console.error('タスクの読み込みに失敗しました:', error);
            return [];
        }
    }

    /**
     * 全てのタスクを保存
     * @param {Array} tasks - 保存するタスクの配列
     * @returns {boolean} 保存成功時true
     */
    saveTasks(tasks) {
        try {
            const storage = this.getStorage();
            const tasksJson = JSON.stringify(tasks);
            storage.setItem(this.storageKey, tasksJson);
            return true;
        } catch (error) {
            console.error('タスクの保存に失敗しました:', error);
            return false;
        }
    }

    /**
     * 単一のタスクを保存
     * @param {Object} task - 保存するタスク
     * @returns {boolean} 保存成功時true
     */
    saveTask(task) {
        // セキュリティ: タスクデータを検証
        if (!this.validateTaskData(task)) {
            console.error('無効なタスクデータです:', task);
            return false;
        }

        const tasks = this.loadTasks();
        const existingIndex = tasks.findIndex(t => t.id === task.id);
        
        // タスクデータをサニタイズ
        const sanitizedTask = this.sanitizeTaskData(task);
        
        if (existingIndex >= 0) {
            tasks[existingIndex] = sanitizedTask;
        } else {
            tasks.push(sanitizedTask);
        }
        
        return this.saveTasks(tasks);
    }

    /**
     * タスクを更新
     * @param {string} taskId - 更新するタスクのID
     * @param {Object} updates - 更新内容
     * @returns {boolean} 更新成功時true
     */
    updateTask(taskId, updates) {
        const tasks = this.loadTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            console.error('更新対象のタスクが見つかりません:', taskId);
            return false;
        }
        
        tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
        return this.saveTasks(tasks);
    }

    /**
     * タスクを削除
     * @param {string} taskId - 削除するタスクのID
     * @returns {boolean} 削除成功時true
     */
    deleteTask(taskId) {
        const tasks = this.loadTasks();
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        
        if (filteredTasks.length === tasks.length) {
            console.error('削除対象のタスクが見つかりません:', taskId);
            return false;
        }
        
        return this.saveTasks(filteredTasks);
    }

    /**
     * 全てのタスクを削除
     * @returns {boolean} 削除成功時true
     */
    clearAllTasks() {
        try {
            const storage = this.getStorage();
            storage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('全タスクの削除に失敗しました:', error);
            return false;
        }
    }

    /**
     * ストレージの使用状況を取得
     * @returns {Object} 使用状況の情報
     */
    getStorageInfo() {
        const storage = this.getStorage();
        const tasks = this.loadTasks();
        
        return {
            taskCount: tasks.length,
            storageType: this.fallbackToSession ? 'sessionStorage' : 'localStorage',
            isAvailable: this.isStorageAvailable()
        };
    }

    /**
     * タスクデータの検証
     * @param {Object} task - 検証するタスク
     * @returns {boolean} 有効な場合true
     */
    validateTaskData(task) {
        if (!task || typeof task !== 'object') {
            return false;
        }

        // 必須フィールドの確認
        const requiredFields = ['id', 'bookTitle', 'status', 'createdAt'];
        for (const field of requiredFields) {
            if (!(field in task)) {
                return false;
            }
        }

        // データ型の確認
        if (typeof task.id !== 'string' || task.id.length === 0) {
            return false;
        }

        if (typeof task.bookTitle !== 'string' || task.bookTitle.trim().length === 0) {
            return false;
        }

        if (!['active', 'completed'].includes(task.status)) {
            return false;
        }

        // 日付の確認
        if (!(task.createdAt instanceof Date) && typeof task.createdAt !== 'string') {
            return false;
        }

        if (task.completedAt !== null && 
            !(task.completedAt instanceof Date) && 
            typeof task.completedAt !== 'string') {
            return false;
        }

        // 文字列長の確認
        if (task.bookTitle.length > 100) {
            return false;
        }

        if (task.author && task.author.length > 50) {
            return false;
        }

        return true;
    }

    /**
     * タスクデータのサニタイゼーション
     * @param {Object} task - サニタイズするタスク
     * @returns {Object} サニタイズされたタスク
     */
    sanitizeTaskData(task) {
        const sanitized = {
            id: this.sanitizeString(task.id),
            bookTitle: this.sanitizeString(task.bookTitle),
            author: task.author ? this.sanitizeString(task.author) : '',
            status: task.status,
            createdAt: task.createdAt,
            completedAt: task.completedAt || null
        };

        return sanitized;
    }

    /**
     * 文字列のサニタイゼーション
     * @param {string} str - サニタイズする文字列
     * @returns {string} サニタイズされた文字列
     */
    sanitizeString(str) {
        if (typeof str !== 'string') {
            return '';
        }

        let sanitized = str;

        // 前後の空白を削除
        sanitized = sanitized.trim();

        // 制御文字を削除
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

        // HTMLタグを削除
        sanitized = sanitized.replace(/<[^>]*>/g, '');

        // 連続する空白を単一の空白に変換
        sanitized = sanitized.replace(/\s+/g, ' ');

        return sanitized;
    }
}