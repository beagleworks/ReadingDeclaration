/**
 * TaskManager - 読書タスクの管理を行うクラス
 * タスクの作成、完了、削除、取得機能を提供
 */
class TaskManager {
    constructor(storageManager, options = {}) {
        this.storageManager = storageManager;
        this.tasks = [];
        this.enableLogging = options.enableLogging !== false; // デフォルトで有効
        this.loadTasks();
    }



    /**
     * ストレージからタスクを読み込み
     */
    loadTasks() {
        try {
            this.tasks = this.storageManager.loadTasks();
        } catch (error) {
            if (this.enableLogging) console.error('タスクの読み込みに失敗しました:', error);
            this.tasks = [];
        }
    }

    /**
     * 新しい読書タスクを追加
     * @param {string} bookTitle - 書籍タイトル
     * @param {string} author - 著者名（オプション）
     * @returns {Object|null} 作成されたタスク、失敗時はnull
     */
    addTask(bookTitle, author = '') {
        try {
            // 入力データの準備とバリデーション
            const prepared = TaskValidator.prepareTaskData(bookTitle, author);
            
            if (!prepared.validation.isValid) {
                throw new Error(prepared.validation.errors.join(', '));
            }

            // Taskモデルを使用してタスクを作成
            const task = new Task(prepared.data.bookTitle, prepared.data.author);

            // ストレージに保存
            const saved = this.storageManager.saveTask(task.toJSON());
            if (!saved) {
                throw new Error('タスクの保存に失敗しました');
            }

            // ストレージから再読み込みして、メモリとストレージの状態を同期
            this.loadTasks();

            return task.toJSON();
        } catch (error) {
            if (this.enableLogging) console.error('タスクの追加に失敗しました:', error);
            return null;
        }
    }

    /**
     * タスクを完了状態に変更
     * @param {string} taskId - 完了するタスクのID
     * @returns {Object|null} 更新されたタスク、失敗時はnull
     */
    completeTask(taskId) {
        try {
            const taskData = this.getTask(taskId);
            if (!taskData) {
                throw new Error('指定されたタスクが見つかりません');
            }

            if (taskData.status === 'completed') {
                throw new Error('このタスクは既に完了しています');
            }

            // TaskモデルからTaskインスタンスを作成して完了処理
            const task = Task.fromJSON(taskData);
            task.complete();
            const updatedTaskData = task.toJSON();

            // ストレージに保存
            const saved = this.storageManager.updateTask(taskId, {
                status: 'completed',
                completedAt: updatedTaskData.completedAt
            });

            if (!saved) {
                throw new Error('タスクの更新に失敗しました');
            }

            // ストレージから再読み込み
            this.loadTasks();

            return updatedTaskData;
        } catch (error) {
            if (this.enableLogging) console.error('タスクの完了処理に失敗しました:', error);
            return null;
        }
    }

    /**
     * タスクを削除
     * @param {string} taskId - 削除するタスクのID
     * @returns {boolean} 削除成功時true
     */
    deleteTask(taskId) {
        try {
            if (!this.getTask(taskId)) {
                throw new Error('指定されたタスクが見つかりません');
            }

            // ストレージから削除
            const deleted = this.storageManager.deleteTask(taskId);
            if (!deleted) {
                throw new Error('タスクの削除に失敗しました');
            }

            // ストレージから再読み込み
            this.loadTasks();

            return true;
        } catch (error) {
            if (this.enableLogging) console.error('タスクの削除に失敗しました:', error);
            return false;
        }
    }

    /**
     * 全てのタスクを取得
     * @returns {Array} 全タスクの配列
     */
    getAllTasks() {
        return [...this.tasks];
    }

    /**
     * アクティブなタスクを取得
     * @returns {Array} アクティブタスクの配列
     */
    getActiveTasks() {
        return this.tasks.filter(task => task.status === 'active');
    }

    /**
     * 完了済みタスクを取得
     * @returns {Array} 完了済みタスクの配列
     */
    getCompletedTasks() {
        return this.tasks.filter(task => task.status === 'completed');
    }

    /**
     * 特定のタスクを取得
     * @param {string} taskId - 取得するタスクのID
     * @returns {Object|null} タスク、見つからない場合はnull
     */
    getTask(taskId) {
        return this.tasks.find(task => task.id === taskId) || null;
    }

    /**
     * タスクの統計情報を取得
     * @returns {Object} 統計情報
     */
    getTaskStats() {
        const allTasks = this.getAllTasks();
        const activeTasks = this.getActiveTasks();
        const completedTasks = this.getCompletedTasks();

        return {
            total: allTasks.length,
            active: activeTasks.length,
            completed: completedTasks.length,
            completionRate: allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0
        };
    }

    /**
     * タスクを日付順でソート
     * @param {Array} tasks - ソートするタスクの配列
     * @param {string} order - ソート順 ('asc' または 'desc')
     * @returns {Array} ソートされたタスクの配列
     */
    sortTasksByDate(tasks, order = 'desc') {
        return [...tasks].sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            
            if (order === 'asc') {
                return dateA - dateB;
            } else {
                return dateB - dateA;
            }
        });
    }

    /**
     * 全てのタスクを削除
     * @returns {boolean} 削除成功時true
     */
    clearAllTasks() {
        try {
            // ストレージから全削除
            const cleared = this.storageManager.clearAllTasks();
            if (!cleared) {
                throw new Error('ストレージからの削除に失敗しました');
            }

            // メモリ上のタスクもクリア
            this.tasks = [];
            return true;
        } catch (error) {
            if (this.enableLogging) console.error('全タスクの削除に失敗しました:', error);
            return false;
        }
    }

    /**
     * タスクデータを再読み込み
     */
    refresh() {
        this.loadTasks();
    }
}

// Node.js環境でグローバルに公開
if (typeof global !== 'undefined') {
    global.TaskManager = TaskManager;
}