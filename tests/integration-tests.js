/**
 * 統合テスト - エンドツーエンド機能テスト
 * 読書宣言作成からシェアまでの完全フローと読了処理の統合テスト
 * Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.3
 */

class IntegrationTestSuite {
    constructor() {
        this.testResults = [];
        this.originalApp = null;
        this.testContainer = null;
        this.cleanup = [];
    }

    /**
     * テストヘルパーメソッド
     */
    assert(condition, message) {
        if (condition) {
            this.testResults.push({ status: 'PASS', message });
            console.log(`✅ PASS: ${message}`);
        } else {
            this.testResults.push({ status: 'FAIL', message });
            console.error(`❌ FAIL: ${message}`);
        }
    }

    assertEqual(actual, expected, message) {
        this.assert(actual === expected, `${message} (expected: ${expected}, actual: ${actual})`);
    }

    assertNotNull(value, message) {
        this.assert(value !== null && value !== undefined, message);
    }

    assertContains(container, item, message) {
        this.assert(container && container.includes && container.includes(item), message);
    }

    /**
     * テスト環境のセットアップ
     */
    async setUp() {
        // 既存のアプリインスタンスを保存
        this.originalApp = window.app;
        
        // テスト用のDOM環境を作成
        this.createTestEnvironment();
        
        // ローカルストレージをクリア
        localStorage.clear();
        sessionStorage.clear();
        
        // テスト用のアプリインスタンスを作成
        window.app = new ReadingDeclarationApp();
        
        // 少し待機してアプリが初期化されるのを待つ
        await this.wait(100);
    }

    /**
     * テスト環境のクリーンアップ
     */
    tearDown() {
        // クリーンアップ処理を実行
        this.cleanup.forEach(fn => {
            try {
                fn();
            } catch (error) {
                console.warn('Cleanup error:', error);
            }
        });
        this.cleanup = [];
        
        // テスト用DOM要素を削除
        if (this.testContainer) {
            document.body.removeChild(this.testContainer);
            this.testContainer = null;
        }
        
        // 元のアプリインスタンスを復元
        window.app = this.originalApp;
        
        // ストレージをクリア
        localStorage.clear();
        sessionStorage.clear();
    }

    /**
     * テスト用のDOM環境を作成
     */
    createTestEnvironment() {
        // 既存のテストコンテナがあれば削除
        const existingContainer = document.getElementById('test-container');
        if (existingContainer) {
            document.body.removeChild(existingContainer);
        }

        // テスト用のコンテナを作成
        this.testContainer = document.createElement('div');
        this.testContainer.id = 'test-container';
        this.testContainer.style.display = 'none'; // 非表示にしてテストの邪魔にならないようにする
        
        // 必要なDOM構造を作成
        this.testContainer.innerHTML = `
            <div id="app">
                <form id="book-form">
                    <input type="text" id="book-title" name="bookTitle" maxlength="100">
                    <input type="text" id="author" name="author" maxlength="50">
                    <button type="submit">読書宣言をシェア</button>
                </form>
                <div class="character-counter" id="book-title-counter">0/100文字</div>
                <div class="character-counter" id="author-counter">0/50文字</div>
                <div id="active-tasks" class="task-list"></div>
                <div id="completed-tasks" class="task-list"></div>
                <div id="message-container" class="message-container"></div>
            </div>
        `;
        
        document.body.appendChild(this.testContainer);
    }

    /**
     * 指定時間待機
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * フォーム入力をシミュレート
     */
    simulateFormInput(bookTitle, author = '') {
        const bookTitleInput = document.getElementById('book-title');
        const authorInput = document.getElementById('author');
        
        if (bookTitleInput) {
            bookTitleInput.value = bookTitle;
            bookTitleInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        if (authorInput) {
            authorInput.value = author;
            authorInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    /**
     * フォーム送信をシミュレート
     */
    async simulateFormSubmit() {
        const form = document.getElementById('book-form');
        if (form) {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
            await this.wait(100); // 処理完了を待機
        }
    }

    /**
     * ボタンクリックをシミュレート
     */
    async simulateButtonClick(selector) {
        const button = document.querySelector(selector);
        if (button) {
            button.click();
            await this.wait(100); // 処理完了を待機
        }
    }

    /**
     * Test 1: 読書宣言作成からシェアまでの完全フロー
     * Requirements: 1.1, 1.2, 3.1, 3.3
     */
    async testReadingDeclarationFlow() {
        console.log('\n--- Test 1: 読書宣言作成からシェアまでの完全フロー ---');
        
        const testBook = 'テスト本タイトル';
        const testAuthor = 'テスト著者';
        
        // 1. フォームに入力
        this.simulateFormInput(testBook, testAuthor);
        
        // 2. 入力値が正しく設定されているか確認
        const bookTitleInput = document.getElementById('book-title');
        const authorInput = document.getElementById('author');
        this.assertEqual(bookTitleInput.value, testBook, 'Book title input should be set correctly');
        this.assertEqual(authorInput.value, testAuthor, 'Author input should be set correctly');
        
        // 3. フォーム送信前のタスク数を確認
        const initialTasks = window.app.taskManager.getAllTasks();
        const initialTaskCount = initialTasks.length;
        
        // 4. ShareManagerのshareDeclarationメソッドをモック
        const originalShareDeclaration = window.app.shareManager.shareDeclaration;
        let shareCallCount = 0;
        let sharedBookTitle = '';
        let sharedAuthor = '';
        
        window.app.shareManager.shareDeclaration = async (bookTitle, author) => {
            shareCallCount++;
            sharedBookTitle = bookTitle;
            sharedAuthor = author;
            return { success: true, message: 'Test share successful' };
        };
        
        this.cleanup.push(() => {
            window.app.shareManager.shareDeclaration = originalShareDeclaration;
        });
        
        // 5. フォーム送信
        await this.simulateFormSubmit();
        
        // 6. タスクが作成されたか確認
        const newTasks = window.app.taskManager.getAllTasks();
        this.assertEqual(newTasks.length, initialTaskCount + 1, 'New task should be created');
        
        const newTask = newTasks[newTasks.length - 1];
        this.assertEqual(newTask.bookTitle, testBook, 'Task should have correct book title');
        this.assertEqual(newTask.author, testAuthor, 'Task should have correct author');
        this.assertEqual(newTask.status, 'active', 'Task should be active');
        
        // 7. シェア機能が呼ばれたか確認
        this.assertEqual(shareCallCount, 1, 'Share function should be called once');
        this.assertEqual(sharedBookTitle, testBook, 'Shared book title should match input');
        this.assertEqual(sharedAuthor, testAuthor, 'Shared author should match input');
        
        // 8. フォームがリセットされたか確認
        await this.wait(100);
        this.assertEqual(bookTitleInput.value, '', 'Book title input should be reset');
        this.assertEqual(authorInput.value, '', 'Author input should be reset');
        
        // 9. タスクがUIに表示されているか確認
        const activeTasksContainer = document.getElementById('active-tasks');
        this.assertContains(activeTasksContainer.innerHTML, testBook, 'Task should be displayed in active tasks');
    }

    /**
     * Test 2: 読了処理とタスク管理の統合テスト
     * Requirements: 2.1, 2.2, 3.1, 3.3
     */
    async testTaskCompletionFlow() {
        console.log('\n--- Test 2: 読了処理とタスク管理の統合テスト ---');
        
        const testBook = '完了テスト本';
        const testAuthor = '完了テスト著者';
        
        // 1. テスト用タスクを作成
        const task = window.app.taskManager.addTask(testBook, testAuthor);
        this.assertNotNull(task, 'Test task should be created');
        
        // 2. ShareManagerのshareCompletionメソッドをモック
        const originalShareCompletion = window.app.shareManager.shareCompletion;
        let completionShareCallCount = 0;
        let completionSharedBookTitle = '';
        let completionSharedAuthor = '';
        
        window.app.shareManager.shareCompletion = async (bookTitle, author) => {
            completionShareCallCount++;
            completionSharedBookTitle = bookTitle;
            completionSharedAuthor = author;
            return { success: true, message: 'Test completion share successful' };
        };
        
        this.cleanup.push(() => {
            window.app.shareManager.shareCompletion = originalShareCompletion;
        });
        
        // 3. タスクリストを更新してUIに表示
        window.app.displayTasks();
        await this.wait(100);
        
        // 4. 読了ボタンが表示されているか確認
        const activeTasksContainer = document.getElementById('active-tasks');
        this.assertContains(activeTasksContainer.innerHTML, '読了をシェア', 'Complete button should be displayed');
        
        // 5. 読了処理を実行
        await window.app.completeTask(task.id);
        
        // 6. タスクが完了状態になったか確認
        const completedTask = window.app.taskManager.getTask(task.id);
        this.assertEqual(completedTask.status, 'completed', 'Task should be completed');
        this.assertNotNull(completedTask.completedAt, 'Task should have completion date');
        
        // 7. 読了シェア機能が呼ばれたか確認
        this.assertEqual(completionShareCallCount, 1, 'Completion share function should be called once');
        this.assertEqual(completionSharedBookTitle, testBook, 'Completion shared book title should match');
        this.assertEqual(completionSharedAuthor, testAuthor, 'Completion shared author should match');
        
        // 8. タスクが完了済みリストに移動したか確認
        window.app.displayTasks();
        await this.wait(100);
        
        const completedTasksContainer = document.getElementById('completed-tasks');
        this.assertContains(completedTasksContainer.innerHTML, testBook, 'Completed task should be displayed in completed tasks');
        
        // 9. アクティブタスクリストから削除されたか確認
        const updatedActiveTasksContainer = document.getElementById('active-tasks');
        const activeTasksHtml = updatedActiveTasksContainer.innerHTML;
        
        // アクティブタスクがない場合は「読書中のタスクはありません」が表示される
        const hasNoActiveTasks = activeTasksHtml.includes('読書中のタスクはありません') || 
                                !activeTasksHtml.includes(testBook);
        this.assert(hasNoActiveTasks, 'Completed task should not be in active tasks');
    }

    /**
     * Test 3: ローカルストレージの永続化テスト
     * Requirements: 3.1, 3.3
     */
    async testLocalStoragePersistence() {
        console.log('\n--- Test 3: ローカルストレージの永続化テスト ---');
        
        const testBook1 = 'ストレージテスト本1';
        const testBook2 = 'ストレージテスト本2';
        const testAuthor = 'ストレージテスト著者';
        
        // 1. 複数のタスクを作成
        const task1 = window.app.taskManager.addTask(testBook1, testAuthor);
        const task2 = window.app.taskManager.addTask(testBook2, testAuthor);
        
        this.assertNotNull(task1, 'First task should be created');
        this.assertNotNull(task2, 'Second task should be created');
        
        // 2. 一つのタスクを完了
        await window.app.completeTask(task1.id);
        
        // 3. ローカルストレージに保存されているか確認
        const storedData = localStorage.getItem('reading-tasks');
        this.assertNotNull(storedData, 'Tasks should be stored in localStorage');
        
        const parsedData = JSON.parse(storedData);
        this.assertEqual(parsedData.length, 2, 'Two tasks should be stored');
        
        // 4. 新しいアプリインスタンスを作成してデータが復元されるか確認
        const newApp = new ReadingDeclarationApp();
        await this.wait(100);
        
        const restoredTasks = newApp.taskManager.getAllTasks();
        this.assertEqual(restoredTasks.length, 2, 'Tasks should be restored from storage');
        
        const restoredActiveTasks = newApp.taskManager.getActiveTasks();
        const restoredCompletedTasks = newApp.taskManager.getCompletedTasks();
        
        this.assertEqual(restoredActiveTasks.length, 1, 'One active task should be restored');
        this.assertEqual(restoredCompletedTasks.length, 1, 'One completed task should be restored');
        
        // 5. 復元されたタスクの内容が正しいか確認
        const activeTask = restoredActiveTasks[0];
        const completedTask = restoredCompletedTasks[0];
        
        this.assertEqual(activeTask.bookTitle, testBook2, 'Active task title should be correct');
        this.assertEqual(completedTask.bookTitle, testBook1, 'Completed task title should be correct');
        this.assertEqual(completedTask.status, 'completed', 'Completed task status should be correct');
    }

    /**
     * Test 4: エラーハンドリングの統合テスト
     * Requirements: 1.3, 2.4, 3.1, 4.4
     */
    async testErrorHandlingIntegration() {
        console.log('\n--- Test 4: エラーハンドリングの統合テスト ---');
        
        // 1. 無効な入力でのフォーム送信テスト
        this.simulateFormInput('', ''); // 空の書籍タイトル
        
        const initialTaskCount = window.app.taskManager.getAllTasks().length;
        await this.simulateFormSubmit();
        
        const tasksAfterInvalidSubmit = window.app.taskManager.getAllTasks();
        this.assertEqual(tasksAfterInvalidSubmit.length, initialTaskCount, 'No task should be created for invalid input');
        
        // 2. 存在しないタスクの完了処理テスト
        const nonExistentTaskId = 'non-existent-task-id';
        
        // NotificationManagerのerrorメソッドをモック
        const originalError = window.app.notificationManager.error;
        let errorCallCount = 0;
        let errorMessage = '';
        
        window.app.notificationManager.error = (message, options) => {
            errorCallCount++;
            errorMessage = message;
        };
        
        this.cleanup.push(() => {
            window.app.notificationManager.error = originalError;
        });
        
        await window.app.completeTask(nonExistentTaskId);
        
        this.assertEqual(errorCallCount, 1, 'Error notification should be called for non-existent task');
        this.assertContains(errorMessage, 'タスクが見つかりません', 'Error message should indicate task not found');
        
        // 3. 存在しないタスクの削除処理テスト
        let deleteErrorCallCount = 0;
        let deleteErrorMessage = '';
        
        window.app.notificationManager.error = (message, options) => {
            deleteErrorCallCount++;
            deleteErrorMessage = message;
        };
        
        window.app.deleteTask(nonExistentTaskId);
        
        this.assertEqual(deleteErrorCallCount, 1, 'Error notification should be called for non-existent task deletion');
        this.assertContains(deleteErrorMessage, 'タスクが見つかりません', 'Delete error message should indicate task not found');
    }

    /**
     * Test 5: UIインタラクションの統合テスト
     * Requirements: 1.1, 1.2, 2.1, 2.2
     */
    async testUIInteractionIntegration() {
        console.log('\n--- Test 5: UIインタラクションの統合テスト ---');
        
        const testBook = 'UIテスト本';
        const testAuthor = 'UIテスト著者';
        
        // 1. 文字カウンターの動作テスト
        this.simulateFormInput(testBook, testAuthor);
        
        const bookTitleCounter = document.getElementById('book-title-counter');
        const authorCounter = document.getElementById('author-counter');
        
        this.assertContains(bookTitleCounter.textContent, testBook.length.toString(), 'Book title counter should show correct count');
        this.assertContains(authorCounter.textContent, testAuthor.length.toString(), 'Author counter should show correct count');
        
        // 2. タスク作成とUI更新のテスト
        const task = window.app.taskManager.addTask(testBook, testAuthor);
        window.app.displayTasks();
        await this.wait(100);
        
        const activeTasksContainer = document.getElementById('active-tasks');
        this.assertContains(activeTasksContainer.innerHTML, testBook, 'Task should be displayed in UI');
        this.assertContains(activeTasksContainer.innerHTML, testAuthor, 'Author should be displayed in UI');
        this.assertContains(activeTasksContainer.innerHTML, '読了をシェア', 'Complete button should be displayed');
        this.assertContains(activeTasksContainer.innerHTML, '削除', 'Delete button should be displayed');
        
        // 3. タスク完了後のUI更新テスト
        await window.app.completeTask(task.id);
        window.app.displayTasks();
        await this.wait(100);
        
        const completedTasksContainer = document.getElementById('completed-tasks');
        this.assertContains(completedTasksContainer.innerHTML, testBook, 'Completed task should be displayed in completed section');
        
        // 完了済みタスクには読了ボタンがないことを確認
        const completedTaskHtml = completedTasksContainer.innerHTML;
        this.assert(!completedTaskHtml.includes('読了をシェア'), 'Completed task should not have complete button');
        
        // 4. タスク削除のテスト
        window.app.deleteTask(task.id);
        window.app.displayTasks();
        await this.wait(100);
        
        const updatedCompletedTasksContainer = document.getElementById('completed-tasks');
        const hasNoCompletedTasks = updatedCompletedTasksContainer.innerHTML.includes('完了したタスクはありません') || 
                                   !updatedCompletedTasksContainer.innerHTML.includes(testBook);
        this.assert(hasNoCompletedTasks, 'Deleted task should not be displayed');
    }

    /**
     * 全ての統合テストを実行
     */
    async runAllTests() {
        console.log('🧪 統合テスト開始...\n');
        
        const tests = [
            'testReadingDeclarationFlow',
            'testTaskCompletionFlow',
            'testLocalStoragePersistence',
            'testErrorHandlingIntegration',
            'testUIInteractionIntegration'
        ];

        for (const testName of tests) {
            try {
                await this.setUp();
                await this[testName]();
            } catch (error) {
                console.error(`❌ Test ${testName} threw an error:`, error);
                this.testResults.push({ status: 'ERROR', message: `${testName}: ${error.message}` });
            } finally {
                this.tearDown();
            }
        }

        this.printSummary();
        return this.getTestResults();
    }

    /**
     * テスト結果のサマリーを出力
     */
    printSummary() {
        console.log('\n📊 統合テスト結果:');
        console.log('==================');
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const errors = this.testResults.filter(r => r.status === 'ERROR').length;
        const total = this.testResults.length;

        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`💥 Errors: ${errors}`);
        console.log(`Success Rate: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);

        if (failed > 0 || errors > 0) {
            console.log('\n❌ Failed/Error Tests:');
            this.testResults
                .filter(r => r.status !== 'PASS')
                .forEach(r => console.log(`  ${r.status}: ${r.message}`));
        }
    }

    /**
     * テスト結果を取得
     */
    getTestResults() {
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const errors = this.testResults.filter(r => r.status === 'ERROR').length;
        const total = this.testResults.length;

        return { passed, failed, errors, total, results: this.testResults };
    }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IntegrationTestSuite };
}