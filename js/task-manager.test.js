/**
 * TaskManager Unit Tests
 * TaskManagerクラスの各メソッドの動作確認とエラーハンドリングのテスト
 */

// Mock StorageManager for testing
class MockStorageManager {
    constructor() {
        this.tasks = [];
        this.shouldFail = false;
    }

    loadTasks() {
        if (this.shouldFail) {
            throw new Error('Storage load failed');
        }
        return [...this.tasks];
    }

    saveTask(task) {
        if (this.shouldFail) {
            return false;
        }
        const existingIndex = this.tasks.findIndex(t => t.id === task.id);
        if (existingIndex >= 0) {
            this.tasks[existingIndex] = task;
        } else {
            this.tasks.push(task);
        }
        return true;
    }

    updateTask(taskId, updates) {
        if (this.shouldFail) {
            return false;
        }
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            return false;
        }
        this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
        return true;
    }

    deleteTask(taskId) {
        if (this.shouldFail) {
            return false;
        }
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        return this.tasks.length < initialLength;
    }

    clearAllTasks() {
        if (this.shouldFail) {
            return false;
        }
        this.tasks = [];
        return true;
    }

    setFailMode(shouldFail) {
        this.shouldFail = shouldFail;
    }
}

// Test Suite
class TaskManagerTestSuite {
    constructor() {
        this.testResults = [];
        this.mockStorage = new MockStorageManager();
        this.taskManager = new TaskManager(this.mockStorage);
    }

    // Test helper methods
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

    assertNull(value, message) {
        this.assert(value === null || value === undefined, message);
    }

    assertArrayLength(array, expectedLength, message) {
        this.assert(Array.isArray(array) && array.length === expectedLength, 
                   `${message} (expected length: ${expectedLength}, actual: ${array ? array.length : 'not array'})`);
    }

    // Setup and teardown
    setUp() {
        this.mockStorage = new MockStorageManager();
        this.taskManager = new TaskManager(this.mockStorage);
        this.mockStorage.setFailMode(false);
    }

    tearDown() {
        this.mockStorage.clearAllTasks();
    }

    // Test: addTask method
    testAddTask() {
        console.log('\n--- Testing addTask method ---');
        
        // Test successful task creation
        const task = this.taskManager.addTask('テスト本', 'テスト著者');
        this.assertNotNull(task, 'Should create task successfully');
        this.assertEqual(task.bookTitle, 'テスト本', 'Should set correct book title');
        this.assertEqual(task.author, 'テスト著者', 'Should set correct author');
        this.assertEqual(task.status, 'active', 'Should set status to active');
        this.assertNotNull(task.id, 'Should generate task ID');
        this.assertNotNull(task.createdAt, 'Should set creation date');
        this.assertNull(task.completedAt, 'Should not set completion date for new task');

        // Test task without author
        const taskNoAuthor = this.taskManager.addTask('本のみ');
        this.assertNotNull(taskNoAuthor, 'Should create task without author');
        this.assertEqual(taskNoAuthor.author, '', 'Should set empty author');

        // Test invalid input - empty title
        const invalidTask = this.taskManager.addTask('');
        this.assertNull(invalidTask, 'Should return null for empty title');

        // Test invalid input - null title
        const nullTask = this.taskManager.addTask(null);
        this.assertNull(nullTask, 'Should return null for null title');

        // Test storage failure
        this.mockStorage.setFailMode(true);
        const failedTask = this.taskManager.addTask('失敗テスト');
        this.assertNull(failedTask, 'Should return null when storage fails');
    }

    // Test: completeTask method
    testCompleteTask() {
        console.log('\n--- Testing completeTask method ---');
        
        // Setup: Create a task first
        this.mockStorage.setFailMode(false);
        const task = this.taskManager.addTask('完了テスト本', '著者');
        this.assertNotNull(task, 'Setup: Should create task for completion test');

        // Test successful completion
        const completedTask = this.taskManager.completeTask(task.id);
        this.assertNotNull(completedTask, 'Should complete task successfully');
        this.assertEqual(completedTask.status, 'completed', 'Should set status to completed');
        this.assertNotNull(completedTask.completedAt, 'Should set completion date');

        // Test completing already completed task
        const alreadyCompleted = this.taskManager.completeTask(task.id);
        this.assertNull(alreadyCompleted, 'Should return null for already completed task');

        // Test completing non-existent task
        const nonExistent = this.taskManager.completeTask('non-existent-id');
        this.assertNull(nonExistent, 'Should return null for non-existent task');

        // Test storage failure during completion
        const newTask = this.taskManager.addTask('失敗テスト本');
        this.mockStorage.setFailMode(true);
        const failedCompletion = this.taskManager.completeTask(newTask.id);
        this.assertNull(failedCompletion, 'Should return null when storage update fails');
    }

    // Test: deleteTask method
    testDeleteTask() {
        console.log('\n--- Testing deleteTask method ---');
        
        // Setup: Create a task first
        this.mockStorage.setFailMode(false);
        const task = this.taskManager.addTask('削除テスト本', '著者');
        this.assertNotNull(task, 'Setup: Should create task for deletion test');

        // Test successful deletion
        const deleted = this.taskManager.deleteTask(task.id);
        this.assertEqual(deleted, true, 'Should delete task successfully');

        // Verify task is actually deleted
        const deletedTask = this.taskManager.getTask(task.id);
        this.assertNull(deletedTask, 'Task should not exist after deletion');

        // Test deleting non-existent task
        const nonExistentDeleted = this.taskManager.deleteTask('non-existent-id');
        this.assertEqual(nonExistentDeleted, false, 'Should return false for non-existent task');

        // Test storage failure during deletion
        const newTask = this.taskManager.addTask('失敗削除テスト');
        this.mockStorage.setFailMode(true);
        const failedDeletion = this.taskManager.deleteTask(newTask.id);
        this.assertEqual(failedDeletion, false, 'Should return false when storage deletion fails');
    }

    // Test: getAllTasks method
    testGetAllTasks() {
        console.log('\n--- Testing getAllTasks method ---');
        
        this.mockStorage.setFailMode(false);
        
        // Test with no tasks
        this.taskManager.clearAllTasks();
        const emptyTasks = this.taskManager.getAllTasks();
        this.assertArrayLength(emptyTasks, 0, 'Should return empty array when no tasks');

        // Test with multiple tasks
        this.taskManager.addTask('本1', '著者1');
        this.taskManager.addTask('本2', '著者2');
        const allTasks = this.taskManager.getAllTasks();
        this.assertArrayLength(allTasks, 2, 'Should return all tasks');

        // Verify returned array is a copy (not reference)
        allTasks.push({ id: 'fake' });
        const originalTasks = this.taskManager.getAllTasks();
        this.assertArrayLength(originalTasks, 2, 'Should return copy, not reference');
    }

    // Test: getActiveTasks method
    testGetActiveTasks() {
        console.log('\n--- Testing getActiveTasks method ---');
        
        this.mockStorage.setFailMode(false);
        this.taskManager.clearAllTasks();

        // Add tasks and complete one
        const task1 = this.taskManager.addTask('アクティブ本1');
        const task2 = this.taskManager.addTask('アクティブ本2');
        const task3 = this.taskManager.addTask('完了予定本');
        
        this.taskManager.completeTask(task3.id);

        const activeTasks = this.taskManager.getActiveTasks();
        this.assertArrayLength(activeTasks, 2, 'Should return only active tasks');
        
        // Verify all returned tasks are active
        const allActive = activeTasks.every(task => task.status === 'active');
        this.assert(allActive, 'All returned tasks should have active status');
    }

    // Test: getCompletedTasks method
    testGetCompletedTasks() {
        console.log('\n--- Testing getCompletedTasks method ---');
        
        this.mockStorage.setFailMode(false);
        this.taskManager.clearAllTasks();

        // Add tasks and complete some
        const task1 = this.taskManager.addTask('完了本1');
        const task2 = this.taskManager.addTask('アクティブ本');
        const task3 = this.taskManager.addTask('完了本2');
        
        this.taskManager.completeTask(task1.id);
        this.taskManager.completeTask(task3.id);

        const completedTasks = this.taskManager.getCompletedTasks();
        this.assertArrayLength(completedTasks, 2, 'Should return only completed tasks');
        
        // Verify all returned tasks are completed
        const allCompleted = completedTasks.every(task => task.status === 'completed');
        this.assert(allCompleted, 'All returned tasks should have completed status');
    }

    // Test: getTask method
    testGetTask() {
        console.log('\n--- Testing getTask method ---');
        
        this.mockStorage.setFailMode(false);
        this.taskManager.clearAllTasks();

        const task = this.taskManager.addTask('個別取得テスト本');
        
        // Test getting existing task
        const retrievedTask = this.taskManager.getTask(task.id);
        this.assertNotNull(retrievedTask, 'Should retrieve existing task');
        this.assertEqual(retrievedTask.id, task.id, 'Should return correct task');

        // Test getting non-existent task
        const nonExistent = this.taskManager.getTask('non-existent-id');
        this.assertNull(nonExistent, 'Should return null for non-existent task');
    }

    // Test: getTaskStats method
    testGetTaskStats() {
        console.log('\n--- Testing getTaskStats method ---');
        
        this.mockStorage.setFailMode(false);
        this.taskManager.clearAllTasks();

        // Test with no tasks
        const emptyStats = this.taskManager.getTaskStats();
        this.assertEqual(emptyStats.total, 0, 'Should show 0 total tasks');
        this.assertEqual(emptyStats.active, 0, 'Should show 0 active tasks');
        this.assertEqual(emptyStats.completed, 0, 'Should show 0 completed tasks');
        this.assertEqual(emptyStats.completionRate, 0, 'Should show 0% completion rate');

        // Add tasks and complete some
        const task1 = this.taskManager.addTask('統計テスト本1');
        const task2 = this.taskManager.addTask('統計テスト本2');
        const task3 = this.taskManager.addTask('統計テスト本3');
        
        this.taskManager.completeTask(task1.id);

        const stats = this.taskManager.getTaskStats();
        this.assertEqual(stats.total, 3, 'Should show correct total tasks');
        this.assertEqual(stats.active, 2, 'Should show correct active tasks');
        this.assertEqual(stats.completed, 1, 'Should show correct completed tasks');
        this.assertEqual(Math.round(stats.completionRate), 33, 'Should calculate correct completion rate');
    }

    // Test: Error handling and edge cases
    testErrorHandling() {
        console.log('\n--- Testing Error Handling ---');
        
        // Test storage load failure
        this.mockStorage.setFailMode(true);
        const taskManagerWithFailure = new TaskManager(this.mockStorage);
        const tasks = taskManagerWithFailure.getAllTasks();
        this.assertArrayLength(tasks, 0, 'Should handle storage load failure gracefully');

        // Test clearAllTasks with storage failure
        this.mockStorage.setFailMode(true);
        const clearResult = this.taskManager.clearAllTasks();
        this.assertEqual(clearResult, false, 'Should return false when clear fails');
    }

    // Run all tests
    runAllTests() {
        console.log('🧪 Starting TaskManager Unit Tests...\n');
        
        const tests = [
            'testAddTask',
            'testCompleteTask', 
            'testDeleteTask',
            'testGetAllTasks',
            'testGetActiveTasks',
            'testGetCompletedTasks',
            'testGetTask',
            'testGetTaskStats',
            'testErrorHandling'
        ];

        tests.forEach(testName => {
            this.setUp();
            try {
                this[testName]();
            } catch (error) {
                console.error(`❌ Test ${testName} threw an error:`, error);
                this.testResults.push({ status: 'ERROR', message: `${testName}: ${error.message}` });
            }
            this.tearDown();
        });

        this.printSummary();
    }

    // Print test summary
    printSummary() {
        console.log('\n📊 Test Summary:');
        console.log('================');
        
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

        return { passed, failed, errors, total };
    }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TaskManagerTestSuite, MockStorageManager };
}