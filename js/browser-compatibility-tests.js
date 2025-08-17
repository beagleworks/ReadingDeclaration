/**
 * ブラウザ互換性とレスポンシブテスト
 * 主要ブラウザでの動作確認とモバイルデバイスでのレスポンシブ表示テスト
 * Requirements: 5.1, 5.2, 5.3, 4.4
 */

class BrowserCompatibilityTestSuite {
    constructor() {
        this.testResults = [];
        this.browserInfo = this.getBrowserInfo();
        this.deviceInfo = this.getDeviceInfo();
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

    /**
     * ブラウザ情報を取得
     */
    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        const browserInfo = {
            userAgent: userAgent,
            isChrome: /Chrome/.test(userAgent) && !/Edge/.test(userAgent),
            isFirefox: /Firefox/.test(userAgent),
            isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
            isEdge: /Edge/.test(userAgent) || /Edg/.test(userAgent),
            isIE: /MSIE|Trident/.test(userAgent),
            isMobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
            supportsLocalStorage: typeof(Storage) !== "undefined",
            supportsES6: (function() {
                try {
                    eval('const test = () => {};');
                    return true;
                } catch (e) {
                    return false;
                }
            })(),
            supportsFetch: typeof fetch !== 'undefined',
            supportsPromises: typeof Promise !== 'undefined'
        };

        return browserInfo;
    }

    /**
     * デバイス情報を取得
     */
    getDeviceInfo() {
        return {
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown',
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
        };
    }

    /**
     * Test 1: ブラウザ基本機能の互換性テスト
     * Requirements: 5.1, 4.4
     */
    testBrowserBasicCompatibility() {
        console.log('\n--- Test 1: ブラウザ基本機能の互換性テスト ---');
        console.log(`ブラウザ: ${this.browserInfo.userAgent}`);
        
        // 必須JavaScript機能のサポート確認
        this.assert(this.browserInfo.supportsES6, 'ES6 syntax support (arrow functions, const/let)');
        this.assert(this.browserInfo.supportsPromises, 'Promise support');
        this.assert(this.browserInfo.supportsLocalStorage, 'LocalStorage support');
        
        // DOM API の基本機能確認
        this.assert(typeof document.getElementById === 'function', 'document.getElementById support');
        this.assert(typeof document.querySelector === 'function', 'document.querySelector support');
        this.assert(typeof document.addEventListener === 'function', 'document.addEventListener support');
        
        // イベント処理の確認
        this.assert(typeof Event === 'function', 'Event constructor support');
        this.assert(typeof CustomEvent === 'function', 'CustomEvent constructor support');
        
        // JSON処理の確認
        this.assert(typeof JSON.parse === 'function', 'JSON.parse support');
        this.assert(typeof JSON.stringify === 'function', 'JSON.stringify support');
        
        // 日付処理の確認
        this.assert(typeof Date === 'function', 'Date constructor support');
        this.assert(typeof Date.prototype.toLocaleDateString === 'function', 'Date.toLocaleDateString support');
        
        // 配列メソッドの確認
        this.assert(typeof Array.prototype.filter === 'function', 'Array.filter support');
        this.assert(typeof Array.prototype.map === 'function', 'Array.map support');
        this.assert(typeof Array.prototype.find === 'function', 'Array.find support');
        
        // 文字列メソッドの確認
        this.assert(typeof String.prototype.includes === 'function', 'String.includes support');
        this.assert(typeof String.prototype.trim === 'function', 'String.trim support');
    }

    /**
     * Test 2: ローカルストレージの互換性テスト
     * Requirements: 3.1, 3.3, 4.4
     */
    testLocalStorageCompatibility() {
        console.log('\n--- Test 2: ローカルストレージの互換性テスト ---');
        
        if (!this.browserInfo.supportsLocalStorage) {
            this.assert(false, 'LocalStorage is not supported in this browser');
            return;
        }
        
        try {
            // 基本的な読み書きテスト
            const testKey = 'browser-compat-test';
            const testValue = 'test-value-' + Date.now();
            
            localStorage.setItem(testKey, testValue);
            const retrievedValue = localStorage.getItem(testKey);
            this.assertEqual(retrievedValue, testValue, 'LocalStorage basic read/write');
            
            // JSON データの保存・読み込みテスト
            const testObject = { id: '123', title: 'テスト', date: new Date().toISOString() };
            localStorage.setItem(testKey + '-json', JSON.stringify(testObject));
            const retrievedObject = JSON.parse(localStorage.getItem(testKey + '-json'));
            this.assertEqual(retrievedObject.id, testObject.id, 'LocalStorage JSON data persistence');
            
            // 削除テスト
            localStorage.removeItem(testKey);
            localStorage.removeItem(testKey + '-json');
            const deletedValue = localStorage.getItem(testKey);
            this.assertEqual(deletedValue, null, 'LocalStorage item removal');
            
            // 容量制限テスト（簡易版）
            try {
                const largeData = 'x'.repeat(1000000); // 1MB のデータ
                localStorage.setItem('large-test', largeData);
                localStorage.removeItem('large-test');
                this.assert(true, 'LocalStorage can handle large data (1MB)');
            } catch (e) {
                this.assert(false, `LocalStorage large data handling failed: ${e.message}`);
            }
            
        } catch (error) {
            this.assert(false, `LocalStorage functionality error: ${error.message}`);
        }
    }

    /**
     * Test 3: CSS機能の互換性テスト
     * Requirements: 5.2, 5.3
     */
    testCSSCompatibility() {
        console.log('\n--- Test 3: CSS機能の互換性テスト ---');
        
        // テスト用要素を作成
        const testElement = document.createElement('div');
        testElement.style.display = 'none';
        document.body.appendChild(testElement);
        
        try {
            // CSS Grid サポート確認
            testElement.style.display = 'grid';
            const supportsGrid = testElement.style.display === 'grid';
            this.assert(supportsGrid, 'CSS Grid support');
            
            // Flexbox サポート確認
            testElement.style.display = 'flex';
            const supportsFlex = testElement.style.display === 'flex';
            this.assert(supportsFlex, 'CSS Flexbox support');
            
            // CSS Variables サポート確認
            testElement.style.setProperty('--test-var', 'test');
            const supportsVariables = testElement.style.getPropertyValue('--test-var') === 'test';
            this.assert(supportsVariables, 'CSS Variables support');
            
            // Transform サポート確認
            testElement.style.transform = 'translateX(10px)';
            const supportsTransform = testElement.style.transform !== '';
            this.assert(supportsTransform, 'CSS Transform support');
            
            // Transition サポート確認
            testElement.style.transition = 'all 0.3s ease';
            const supportsTransition = testElement.style.transition !== '';
            this.assert(supportsTransition, 'CSS Transition support');
            
            // Border-radius サポート確認
            testElement.style.borderRadius = '5px';
            const supportsBorderRadius = testElement.style.borderRadius !== '';
            this.assert(supportsBorderRadius, 'CSS Border-radius support');
            
            // Box-shadow サポート確認
            testElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            const supportsBoxShadow = testElement.style.boxShadow !== '';
            this.assert(supportsBoxShadow, 'CSS Box-shadow support');
            
        } finally {
            document.body.removeChild(testElement);
        }
    }

    /**
     * Test 4: レスポンシブデザインのテスト
     * Requirements: 5.2, 5.3
     */
    testResponsiveDesign() {
        console.log('\n--- Test 4: レスポンシブデザインのテスト ---');
        console.log(`画面サイズ: ${this.deviceInfo.viewportWidth}x${this.deviceInfo.viewportHeight}`);
        console.log(`デバイス: ${this.deviceInfo.touchSupport ? 'タッチデバイス' : 'デスクトップ'}`);
        
        // メディアクエリのサポート確認
        const supportsMediaQueries = window.matchMedia && window.matchMedia('(min-width: 0px)').matches;
        this.assert(supportsMediaQueries, 'Media Queries support');
        
        if (!supportsMediaQueries) return;
        
        // 各ブレークポイントでの表示確認
        const breakpoints = [
            { name: 'Mobile', query: '(max-width: 767px)' },
            { name: 'Tablet', query: '(min-width: 768px) and (max-width: 1023px)' },
            { name: 'Desktop', query: '(min-width: 1024px)' }
        ];
        
        breakpoints.forEach(bp => {
            const matches = window.matchMedia(bp.query).matches;
            if (matches) {
                console.log(`現在のブレークポイント: ${bp.name}`);
                this.testBreakpointLayout(bp.name);
            }
        });
        
        // ビューポートメタタグの確認
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        this.assertNotNull(viewportMeta, 'Viewport meta tag should be present');
        
        if (viewportMeta) {
            const content = viewportMeta.getAttribute('content');
            this.assert(content.includes('width=device-width'), 'Viewport should include width=device-width');
            this.assert(content.includes('initial-scale=1'), 'Viewport should include initial-scale=1');
        }
        
        // タッチデバイスでの操作性確認
        if (this.deviceInfo.touchSupport) {
            this.testTouchInteraction();
        }
    }

    /**
     * ブレークポイント別のレイアウトテスト
     */
    testBreakpointLayout(breakpoint) {
        console.log(`\n--- ${breakpoint} レイアウトテスト ---`);
        
        // メインコンテナの確認
        const appContainer = document.getElementById('app');
        if (appContainer) {
            const styles = window.getComputedStyle(appContainer);
            this.assertNotNull(styles.display, `App container should have display style (${breakpoint})`);
        }
        
        // フォーム要素の確認
        const bookForm = document.getElementById('book-form');
        if (bookForm) {
            const formStyles = window.getComputedStyle(bookForm);
            this.assertNotNull(formStyles.display, `Form should have display style (${breakpoint})`);
            
            // モバイルでのフォーム幅確認
            if (breakpoint === 'Mobile') {
                const formWidth = bookForm.offsetWidth;
                const containerWidth = bookForm.parentElement.offsetWidth;
                const widthRatio = formWidth / containerWidth;
                this.assert(widthRatio > 0.8, `Form should use most of container width on mobile (${Math.round(widthRatio * 100)}%)`);
            }
        }
        
        // 入力フィールドの確認
        const inputs = document.querySelectorAll('input[type="text"]');
        inputs.forEach((input, index) => {
            const inputStyles = window.getComputedStyle(input);
            this.assertNotNull(inputStyles.fontSize, `Input ${index + 1} should have readable font size (${breakpoint})`);
            
            // モバイルでの最小タップサイズ確認
            if (breakpoint === 'Mobile') {
                const height = parseInt(inputStyles.height) || input.offsetHeight;
                this.assert(height >= 44, `Input ${index + 1} should have minimum tap size on mobile (${height}px)`);
            }
        });
        
        // ボタンの確認
        const buttons = document.querySelectorAll('button');
        buttons.forEach((button, index) => {
            const buttonStyles = window.getComputedStyle(button);
            this.assertNotNull(buttonStyles.fontSize, `Button ${index + 1} should have readable font size (${breakpoint})`);
            
            // モバイルでの最小タップサイズ確認
            if (breakpoint === 'Mobile') {
                const height = parseInt(buttonStyles.height) || button.offsetHeight;
                this.assert(height >= 44, `Button ${index + 1} should have minimum tap size on mobile (${height}px)`);
            }
        });
    }

    /**
     * タッチインタラクションのテスト
     */
    testTouchInteraction() {
        console.log('\n--- タッチインタラクションテスト ---');
        
        // タッチイベントのサポート確認
        this.assert('ontouchstart' in window, 'Touch events support');
        this.assert(navigator.maxTouchPoints > 0, 'Multi-touch support');
        
        // タッチ対応要素の確認
        const interactiveElements = document.querySelectorAll('button, input, [onclick]');
        interactiveElements.forEach((element, index) => {
            const styles = window.getComputedStyle(element);
            const width = element.offsetWidth;
            const height = element.offsetHeight;
            
            // 最小タップサイズ（44px x 44px）の確認
            this.assert(width >= 44 && height >= 44, 
                `Interactive element ${index + 1} should meet minimum tap size (${width}x${height}px)`);
        });
    }

    /**
     * Test 5: フォーム機能の互換性テスト
     * Requirements: 1.1, 1.2, 5.1
     */
    testFormCompatibility() {
        console.log('\n--- Test 5: フォーム機能の互換性テスト ---');
        
        // HTML5 フォーム機能のサポート確認
        const testInput = document.createElement('input');
        
        // Required 属性のサポート
        testInput.required = true;
        this.assert(testInput.required === true, 'HTML5 required attribute support');
        
        // Maxlength 属性のサポート
        testInput.maxLength = 100;
        this.assert(testInput.maxLength === 100, 'HTML5 maxlength attribute support');
        
        // Placeholder 属性のサポート
        testInput.placeholder = 'test placeholder';
        this.assert(testInput.placeholder === 'test placeholder', 'HTML5 placeholder attribute support');
        
        // フォームバリデーション API のサポート
        this.assert(typeof testInput.checkValidity === 'function', 'HTML5 form validation API support');
        this.assert(typeof testInput.setCustomValidity === 'function', 'HTML5 custom validation support');
        
        // 実際のフォーム要素での確認
        const bookTitleInput = document.getElementById('book-title');
        if (bookTitleInput) {
            this.assert(typeof bookTitleInput.value === 'string', 'Form input value property');
            this.assert(typeof bookTitleInput.focus === 'function', 'Form input focus method');
            this.assert(typeof bookTitleInput.blur === 'function', 'Form input blur method');
        }
        
        // フォーム送信イベントの確認
        const bookForm = document.getElementById('book-form');
        if (bookForm) {
            this.assert(typeof bookForm.addEventListener === 'function', 'Form event listener support');
            this.assert(typeof bookForm.reset === 'function', 'Form reset method support');
        }
    }

    /**
     * Test 6: パフォーマンステスト
     * Requirements: 4.4, 5.1
     */
    testPerformance() {
        console.log('\n--- Test 6: パフォーマンステスト ---');
        
        // Performance API のサポート確認
        const supportsPerformance = typeof performance !== 'undefined' && typeof performance.now === 'function';
        this.assert(supportsPerformance, 'Performance API support');
        
        if (!supportsPerformance) return;
        
        // DOM操作のパフォーマンステスト
        const startTime = performance.now();
        
        // 大量のDOM要素作成テスト
        const testContainer = document.createElement('div');
        testContainer.style.display = 'none';
        document.body.appendChild(testContainer);
        
        for (let i = 0; i < 100; i++) {
            const element = document.createElement('div');
            element.textContent = `Test element ${i}`;
            testContainer.appendChild(element);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        document.body.removeChild(testContainer);
        
        this.assert(duration < 100, `DOM manipulation should be fast (${duration.toFixed(2)}ms for 100 elements)`);
        
        // メモリ使用量の確認（可能な場合）
        if (performance.memory) {
            const memoryInfo = performance.memory;
            console.log(`メモリ使用量: ${Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)}MB`);
            this.assert(memoryInfo.usedJSHeapSize < memoryInfo.jsHeapSizeLimit, 'Memory usage within limits');
        }
    }

    /**
     * 全てのブラウザ互換性テストを実行
     */
    runAllTests() {
        console.log('🧪 ブラウザ互換性テスト開始...\n');
        console.log(`ブラウザ情報: ${this.browserInfo.userAgent}`);
        console.log(`画面サイズ: ${this.deviceInfo.viewportWidth}x${this.deviceInfo.viewportHeight}`);
        console.log(`タッチサポート: ${this.deviceInfo.touchSupport ? 'あり' : 'なし'}\n`);
        
        const tests = [
            'testBrowserBasicCompatibility',
            'testLocalStorageCompatibility',
            'testCSSCompatibility',
            'testResponsiveDesign',
            'testFormCompatibility',
            'testPerformance'
        ];

        tests.forEach(testName => {
            try {
                this[testName]();
            } catch (error) {
                console.error(`❌ Test ${testName} threw an error:`, error);
                this.testResults.push({ status: 'ERROR', message: `${testName}: ${error.message}` });
            }
        });

        this.printSummary();
        return this.getTestResults();
    }

    /**
     * テスト結果のサマリーを出力
     */
    printSummary() {
        console.log('\n📊 ブラウザ互換性テスト結果:');
        console.log('============================');
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const errors = this.testResults.filter(r => r.status === 'ERROR').length;
        const total = this.testResults.length;

        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`💥 Errors: ${errors}`);
        console.log(`Success Rate: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);

        // ブラウザ情報のサマリー
        console.log('\n🌐 ブラウザ環境:');
        console.log(`- Chrome: ${this.browserInfo.isChrome ? '✅' : '❌'}`);
        console.log(`- Firefox: ${this.browserInfo.isFirefox ? '✅' : '❌'}`);
        console.log(`- Safari: ${this.browserInfo.isSafari ? '✅' : '❌'}`);
        console.log(`- Edge: ${this.browserInfo.isEdge ? '✅' : '❌'}`);
        console.log(`- Mobile: ${this.browserInfo.isMobile ? '✅' : '❌'}`);
        console.log(`- LocalStorage: ${this.browserInfo.supportsLocalStorage ? '✅' : '❌'}`);
        console.log(`- ES6: ${this.browserInfo.supportsES6 ? '✅' : '❌'}`);

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

        return { 
            passed, 
            failed, 
            errors, 
            total, 
            results: this.testResults,
            browserInfo: this.browserInfo,
            deviceInfo: this.deviceInfo
        };
    }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrowserCompatibilityTestSuite };
}