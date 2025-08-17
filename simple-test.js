#!/usr/bin/env node

/**
 * Simple functional test for TaskManager
 */

const fs = require('fs');
const path = require('path');

// Mock localStorage for Node.js
global.localStorage = {
    data: {},
    setItem(key, value) { this.data[key] = value; },
    getItem(key) { return this.data[key] || null; },
    removeItem(key) { delete this.data[key]; },
    clear() { this.data = {}; }
};

global.sessionStorage = global.localStorage;

// Load and execute the source files
try {
    eval(fs.readFileSync(path.join(__dirname, 'js/task-model.js'), 'utf8'));
    eval(fs.readFileSync(path.join(__dirname, 'js/storage-manager.js'), 'utf8'));
    eval(fs.readFileSync(path.join(__dirname, 'js/task-manager.js'), 'utf8'));
    
    console.log('🧪 Running Basic TaskManager Functionality Tests...\n');
    
    // Create instances
    const storageManager = new StorageManager();
    const taskManager = new TaskManager(storageManager);
    
    let testsPassed = 0;
    let testsTotal = 0;
    
    function test(description, testFn) {
        testsTotal++;
        try {
            const result = testFn();
            if (result) {
                console.log(`✅ ${description}`);
                testsPassed++;
            } else {
                console.log(`❌ ${description}`);
            }
        } catch (error) {
            console.log(`❌ ${description} - Error: ${error.message}`);
        }
    }
    
    // Test 1: Add task
    test('Should add a new task', () => {
        const task = taskManager.addTask('テスト本', 'テスト著者');
        return task && task.bookTitle === 'テスト本' && task.author === 'テスト著者' && task.status === 'active';
    });
    
    // Test 2: Get all tasks
    test('Should retrieve all tasks', () => {
        const tasks = taskManager.getAllTasks();
        return Array.isArray(tasks) && tasks.length === 1;
    });
    
    // Test 3: Get active tasks
    test('Should retrieve active tasks', () => {
        const activeTasks = taskManager.getActiveTasks();
        return Array.isArray(activeTasks) && activeTasks.length === 1 && activeTasks[0].status === 'active';
    });
    
    // Test 4: Complete task
    test('Should complete a task', () => {
        const tasks = taskManager.getAllTasks();
        const taskId = tasks[0].id;
        const completedTask = taskManager.completeTask(taskId);
        return completedTask && completedTask.status === 'completed' && completedTask.completedAt;
    });
    
    // Test 5: Get completed tasks
    test('Should retrieve completed tasks', () => {
        const completedTasks = taskManager.getCompletedTasks();
        return Array.isArray(completedTasks) && completedTasks.length === 1 && completedTasks[0].status === 'completed';
    });
    
    // Test 6: Get task stats
    test('Should calculate task statistics', () => {
        const stats = taskManager.getTaskStats();
        return stats.total === 1 && stats.active === 0 && stats.completed === 1 && stats.completionRate === 100;
    });
    
    // Test 7: Delete task
    test('Should delete a task', () => {
        const tasks = taskManager.getAllTasks();
        const taskId = tasks[0].id;
        const deleted = taskManager.deleteTask(taskId);
        const remainingTasks = taskManager.getAllTasks();
        return deleted === true && remainingTasks.length === 0;
    });
    
    // Test 8: Handle invalid input
    test('Should handle invalid input gracefully', () => {
        const invalidTask = taskManager.addTask('');
        return invalidTask === null;
    });
    
    // Test 9: Add task without author
    test('Should add task without author', () => {
        const task = taskManager.addTask('本のみ');
        return task && task.bookTitle === '本のみ' && task.author === '';
    });
    
    // Test 10: Get specific task
    test('Should retrieve specific task by ID', () => {
        const tasks = taskManager.getAllTasks();
        const taskId = tasks[0].id;
        const retrievedTask = taskManager.getTask(taskId);
        return retrievedTask && retrievedTask.id === taskId;
    });
    
    console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);
    
    if (testsPassed === testsTotal) {
        console.log('🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed');
        process.exit(1);
    }
    
} catch (error) {
    console.error('❌ Failed to run tests:', error.message);
    process.exit(1);
}