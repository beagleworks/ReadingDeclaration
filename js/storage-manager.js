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
        const tasks = this.loadTasks();
        const existingIndex = tasks.findIndex(t => t.id === task.id);
        
        if (existingIndex >= 0) {
            tasks[existingIndex] = task;
        } else {
            tasks.push(task);
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
}