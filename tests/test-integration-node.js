#!/usr/bin/env node

/**
 * Node.js Integration Test Runner
 * 統合テストの基本的な動作確認
 */

const fs = require('fs');
const path = require('path');

// Mock browser environment for Node.js
global.window = {
    localStorage: {
        data: {},
        setItem(key, value) { this.data[key] = value; },
        getItem(key) { return this.data[key] || null; },
        removeItem(key) { delete this.data[key]; },
        clear() { this.data = {}; }
    },
    sessionStorage: {
        data: {},
        setItem(key, value) { this.data[key] = value; },
        getItem(key) { return this.data[key] || null; },
        removeItem(key) { delete this.data[key]; },
        clear() { this.data = {}; }
    },
    navigator: {
        userAgent: 'Node.js Test Environment'
    },
    screen: {
        width: 1920,
        height: 1080
    },
    innerWidth: 1920,
    innerHeight: 1080,
    matchMedia: function(query) {
        return { matches: true };
    }
};

global.localStorage = global.window.localStorage;
global.sessionStorage = global.window.sessionStorage;
global.navigator = global.window.navigator;

// Mock document
global.document = {
    getElementById: function(id) {
        return {
            value: '',
            innerHTML: '',
            textContent: '',
            style: {},
            offsetWidth: 100,
            offsetHeight: 50,
            addEventListener: function() {},
            dispatchEvent: function() {},
            focus: function() {},
            blur: function() {},
            reset: function() {},
            querySelector: function() { return null; },
            querySelectorAll: function() { return []; }
        };
    },
    querySelector: function() { return null; },
    querySelectorAll: function() { return []; },
    createElement: function(tag) {
        return {
            style: {},
            innerHTML: '',
            textContent: '',
            appendChild: function() {},
            setAttribute: function() {},
            getAttribute: function() { return null; },
            addEventListener: function() {},
            dispatchEvent: function() {},
            offsetWidth: 100,
            offsetHeight: 50
        };
    },
    body: {
        appendChild: function() {},
        removeChild: function() {}
    },
    addEventListener: function() {}
};

try {
    console.log('🧪 Node.js 統合テスト検証開始...\n');
    
    // Load source files
    const sourceFiles = [
        'js/task-model.js',
        'js/storage-manager.js',
        'js/share-manager.js',
        'js/task-manager.js',
        'js/notification-manager.js',
        'js/input-validator.js'
    ];
    
    sourceFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ Loading ${file}`);
            eval(fs.readFileSync(filePath, 'utf8'));
        } else {
            console.log(`❌ File not found: ${file}`);
        }
    });
    
    console.log('\n📋 基本機能テスト:');
    
    // Test 1: StorageManager
    console.log('\n1. StorageManager テスト');
    const storageManager = new StorageManager();
    const testTask = {
        id: 'test-1',
        bookTitle: 'テスト本',
        author: 'テスト著者',
        status: 'active',
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    
    const saved = storageManager.saveTask(testTask);
    console.log(`   保存テスト: ${saved ? '✅ 成功' : '❌ 失敗'}`);
    
    const loaded = storageManager.loadTasks();
    console.log(`   読み込みテスト: ${Array.isArray(loaded) ? '✅ 成功' : '❌ 失敗'}`);
    
    // Test 2: TaskManager
    console.log('\n2. TaskManager テスト');
    const taskManager = new TaskManager(storageManager);
    
    const newTask = taskManager.addTask('Node.js テスト本', 'Node.js 著者');
    console.log(`   タスク作成: ${newTask ? '✅ 成功' : '❌ 失敗'}`);
    
    const allTasks = taskManager.getAllTasks();
    console.log(`   タスク取得: ${Array.isArray(allTasks) && allTasks.length > 0 ? '✅ 成功' : '❌ 失敗'}`);
    
    if (newTask) {
        const completed = taskManager.completeTask(newTask.id);
        console.log(`   タスク完了: ${completed ? '✅ 成功' : '❌ 失敗'}`);
        
        const deleted = taskManager.deleteTask(newTask.id);
        console.log(`   タスク削除: ${deleted ? '✅ 成功' : '❌ 失敗'}`);
    }
    
    // Test 3: ShareManager
    console.log('\n3. ShareManager テスト');
    const shareManager = new ShareManager();
    
    const declarationText = shareManager.generateDeclarationText('テスト本', 'テスト著者');
    console.log(`   宣言テキスト生成: ${declarationText.includes('読書宣言') ? '✅ 成功' : '❌ 失敗'}`);
    
    const completionText = shareManager.generateCompletionText('テスト本', 'テスト著者');
    console.log(`   完了テキスト生成: ${completionText.includes('読了') ? '✅ 成功' : '❌ 失敗'}`);
    
    // Test 4: InputValidator
    console.log('\n4. InputValidator テスト');
    const validator = new InputValidator();
    
    const validResult = validator.validateField('bookTitle', 'テスト本');
    console.log(`   有効入力検証: ${validResult.isValid ? '✅ 成功' : '❌ 失敗'}`);
    
    const invalidResult = validator.validateField('bookTitle', '');
    console.log(`   無効入力検証: ${!invalidResult.isValid ? '✅ 成功' : '❌ 失敗'}`);
    
    const sanitized = validator.sanitizeForOutput('<script>alert("xss")</script>テスト');
    console.log(`   サニタイゼーション: ${!sanitized.includes('<script>') ? '✅ 成功' : '❌ 失敗'}`);
    
    // Test 5: NotificationManager
    console.log('\n5. NotificationManager テスト');
    const notificationManager = new NotificationManager();
    
    // NotificationManagerは基本的にDOM操作なので、エラーが出ないことを確認
    try {
        notificationManager.success('テストメッセージ');
        console.log(`   通知機能: ✅ 成功（エラーなし）`);
    } catch (error) {
        console.log(`   通知機能: ❌ 失敗（${error.message}）`);
    }
    
    console.log('\n🎉 Node.js 統合テスト検証完了！');
    console.log('\n📝 次のステップ:');
    console.log('   1. integration-test-runner.html をブラウザで開く');
    console.log('   2. 「全テスト実行」ボタンをクリック');
    console.log('   3. 統合テストとブラウザ互換性テストの結果を確認');
    
    process.exit(0);
    
} catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
    console.error(error.stack);
    process.exit(1);
}