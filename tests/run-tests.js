#!/usr/bin/env node

/**
 * Simple Node.js test runner for TaskManager tests
 */

const fs = require('fs');
const path = require('path');

// Mock localStorage and sessionStorage for Node.js environment
global.localStorage = {
    data: {},
    setItem(key, value) {
        this.data[key] = value;
    },
    getItem(key) {
        return this.data[key] || null;
    },
    removeItem(key) {
        delete this.data[key];
    },
    clear() {
        this.data = {};
    }
};

global.sessionStorage = {
    data: {},
    setItem(key, value) {
        this.data[key] = value;
    },
    getItem(key) {
        return this.data[key] || null;
    },
    removeItem(key) {
        delete this.data[key];
    },
    clear() {
        this.data = {};
    }
};

try {
    // Load the JavaScript files in order
    const taskModelCode = fs.readFileSync(path.join(__dirname, 'js/task-model.js'), 'utf8');
    const storageManagerCode = fs.readFileSync(path.join(__dirname, 'js/storage-manager.js'), 'utf8');
    const taskManagerCode = fs.readFileSync(path.join(__dirname, 'js/task-manager.js'), 'utf8');
    const testCode = fs.readFileSync(path.join(__dirname, 'js/task-manager.test.js'), 'utf8');

    // Execute the code in global scope
    eval(taskModelCode);
    eval(storageManagerCode);
    eval(taskManagerCode);
    eval(testCode);

    // Run the tests
    console.log('🧪 Running TaskManager Unit Tests in Node.js...\n');
    
    const testSuite = new TaskManagerTestSuite();
    const results = testSuite.runAllTests();
    
    // Exit with appropriate code
    if (results.failed > 0 || results.errors > 0) {
        process.exit(1);
    } else {
        console.log('\n🎉 All tests passed successfully!');
        process.exit(0);
    }
    
} catch (error) {
    console.error('❌ Failed to run tests:', error.message);
    console.error(error.stack);
    process.exit(1);
}