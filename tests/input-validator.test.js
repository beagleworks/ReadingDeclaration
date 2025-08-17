/**
 * InputValidator テストスイート
 * 入力バリデーションとサニタイゼーション機能のテスト
 */

// テスト用のシンプルなテストフレームワーク
class SimpleTest {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    run() {
        console.log('🧪 InputValidator テスト開始\n');
        
        for (const { name, testFn } of this.tests) {
            try {
                testFn();
                this.passed++;
                console.log(`✅ ${name}`);
            } catch (error) {
                this.failed++;
                console.error(`❌ ${name}: ${error.message}`);
            }
        }
        
        console.log(`\n📊 テスト結果: ${this.passed}件成功, ${this.failed}件失敗`);
        
        if (this.failed === 0) {
            console.log('🎉 全てのテストが成功しました！');
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'アサーションが失敗しました');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `期待値: ${expected}, 実際の値: ${actual}`);
        }
    }

    assertArrayEqual(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(message || `期待値: ${JSON.stringify(expected)}, 実際の値: ${JSON.stringify(actual)}`);
        }
    }
}

// テスト実行
function runInputValidatorTests() {
    const test = new SimpleTest();
    const validator = new InputValidator();

    // 基本的なバリデーションテスト
    test.test('有効な書籍タイトルのバリデーション', () => {
        const result = validator.validateField('bookTitle', '吾輩は猫である');
        test.assert(result.isValid, '有効な書籍タイトルが無効と判定された');
        test.assertEqual(result.sanitizedValue, '吾輩は猫である');
    });

    test.test('空の書籍タイトルのバリデーション', () => {
        const result = validator.validateField('bookTitle', '');
        test.assert(!result.isValid, '空の書籍タイトルが有効と判定された');
        test.assert(result.errors.length > 0, 'エラーメッセージが生成されていない');
    });

    test.test('長すぎる書籍タイトルのバリデーション', () => {
        const longTitle = 'あ'.repeat(101);
        const result = validator.validateField('bookTitle', longTitle);
        test.assert(!result.isValid, '長すぎる書籍タイトルが有効と判定された');
    });

    test.test('有効な著者名のバリデーション', () => {
        const result = validator.validateField('author', '夏目漱石');
        test.assert(result.isValid, '有効な著者名が無効と判定された');
        test.assertEqual(result.sanitizedValue, '夏目漱石');
    });

    test.test('空の著者名のバリデーション（任意項目）', () => {
        const result = validator.validateField('author', '');
        test.assert(result.isValid, '空の著者名が無効と判定された（任意項目のため有効であるべき）');
    });

    // サニタイゼーションテスト
    test.test('HTMLタグのサニタイゼーション', () => {
        const result = validator.validateField('bookTitle', '<script>alert("xss")</script>吾輩は猫である');
        test.assert(!result.sanitizedValue.includes('<script>'), 'HTMLタグがサニタイズされていない');
    });

    test.test('前後の空白のサニタイゼーション', () => {
        const result = validator.validateField('bookTitle', '  吾輩は猫である  ');
        test.assertEqual(result.sanitizedValue, '吾輩は猫である', '前後の空白が削除されていない');
    });

    test.test('連続する空白のサニタイゼーション', () => {
        const result = validator.validateField('bookTitle', '吾輩は    猫である');
        test.assertEqual(result.sanitizedValue, '吾輩は 猫である', '連続する空白が正規化されていない');
    });

    // XSS対策テスト
    test.test('JavaScriptインジェクションの検出', () => {
        const maliciousInput = 'javascript:alert("xss")';
        const result = validator.validateField('bookTitle', maliciousInput);
        test.assert(!result.isValid, 'JavaScriptインジェクションが検出されていない');
    });

    test.test('イベントハンドラーの検出', () => {
        const maliciousInput = 'onclick=alert("xss")';
        const result = validator.validateField('bookTitle', maliciousInput);
        test.assert(!result.isValid, 'イベントハンドラーが検出されていない');
    });

    // フォーム全体のバリデーションテスト
    test.test('有効なフォームデータのバリデーション', () => {
        const formData = {
            bookTitle: '吾輩は猫である',
            author: '夏目漱石'
        };
        const result = validator.validateForm(formData);
        test.assert(result.isValid, '有効なフォームデータが無効と判定された');
        test.assertEqual(result.sanitizedData.bookTitle, '吾輩は猫である');
        test.assertEqual(result.sanitizedData.author, '夏目漱石');
    });

    test.test('無効なフォームデータのバリデーション', () => {
        const formData = {
            bookTitle: '', // 必須項目が空
            author: '夏目漱石'
        };
        const result = validator.validateForm(formData);
        test.assert(!result.isValid, '無効なフォームデータが有効と判定された');
        test.assert(result.errors.length > 0, 'エラーメッセージが生成されていない');
    });

    // 特殊文字のテスト
    test.test('日本語文字の処理', () => {
        const result = validator.validateField('bookTitle', 'こんにちは世界！？（テスト）');
        test.assert(result.isValid, '日本語文字が無効と判定された');
    });

    test.test('英数字の処理', () => {
        const result = validator.validateField('bookTitle', 'Hello World 123');
        test.assert(result.isValid, '英数字が無効と判定された');
    });

    // エラーメッセージのテスト
    test.test('エラーメッセージの生成', () => {
        const message = validator.getErrorMessage('bookTitle', 'required');
        test.assert(message.includes('書籍タイトル'), 'エラーメッセージにフィールド名が含まれていない');
        test.assert(message.includes('必須'), 'エラーメッセージに適切な内容が含まれていない');
    });

    // 出力用サニタイゼーションのテスト
    test.test('出力用サニタイゼーション', () => {
        const input = '<script>alert("xss")</script>安全なテキスト';
        const result = validator.sanitizeForOutput(input);
        test.assert(!result.includes('<script>'), '出力用サニタイゼーションでHTMLタグが除去されていない');
        test.assert(result.includes('安全なテキスト'), '正常なテキストが削除されている');
    });

    // URL用サニタイゼーションのテスト
    test.test('URL用サニタイゼーション', () => {
        const input = 'テスト & 特殊文字';
        const result = validator.sanitizeForUrl(input);
        test.assert(result.includes('%'), 'URLエンコードが実行されていない');
    });

    // CSV用サニタイゼーションのテスト
    test.test('CSV用サニタイゼーション', () => {
        const input = '=FORMULA()';
        const result = validator.sanitizeForCsv(input);
        test.assert(result.startsWith("'"), 'CSVインジェクション対策が実行されていない');
    });

    test.run();
}

// テストが実行可能な環境かチェック
if (typeof InputValidator !== 'undefined') {
    runInputValidatorTests();
} else {
    console.error('InputValidator クラスが見つかりません。input-validator.js を先に読み込んでください。');
}