/**
 * InputValidator - 入力バリデーションとサニタイゼーション
 * フォーム入力の検証とエラー表示機能、XSS対策とデータサニタイゼーション機能を提供
 */
class InputValidator {
    constructor() {
        this.validationRules = {
            bookTitle: {
                required: true,
                minLength: 1,
                maxLength: 100,
                pattern: null,
                sanitize: true
            },
            author: {
                required: false,
                minLength: 0,
                maxLength: 50,
                pattern: null,
                sanitize: true
            }
        };
        
        // XSS対策用の危険なパターン
        this.xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
            /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
            /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
            /<link\b[^>]*>/gi,
            /<meta\b[^>]*>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /data:text\/html/gi,
            /on\w+\s*=/gi
        ];
        
        // 許可される文字パターン
        this.allowedPatterns = {
            bookTitle: /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBFa-zA-Z0-9\s\-\.\,\!\?\:\;\(\)\[\]\{\}「」『』〈〉《》【】〔〕・～ー！？」（）]+$/,
            author: /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBFa-zA-Z0-9\s\-\.\,]+$/
        };
    }

    /**
     * フォームデータを検証
     * @param {Object} formData - 検証するフォームデータ
     * @returns {Object} 検証結果
     */
    validateForm(formData) {
        const errors = [];
        const sanitizedData = {};
        const fieldErrors = {};

        for (const [fieldName, value] of Object.entries(formData)) {
            const fieldResult = this.validateField(fieldName, value);
            
            if (fieldResult.isValid) {
                sanitizedData[fieldName] = fieldResult.sanitizedValue;
            } else {
                errors.push(...fieldResult.errors);
                fieldErrors[fieldName] = fieldResult.errors;
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            fieldErrors: fieldErrors,
            sanitizedData: sanitizedData
        };
    }

    /**
     * 単一フィールドを検証
     * @param {string} fieldName - フィールド名
     * @param {string} value - 検証する値
     * @returns {Object} 検証結果
     */
    validateField(fieldName, value) {
        const rule = this.validationRules[fieldName];
        if (!rule) {
            return {
                isValid: true,
                sanitizedValue: value,
                errors: []
            };
        }

        const errors = [];
        let sanitizedValue = value;

        // 基本的なサニタイゼーション
        if (rule.sanitize) {
            sanitizedValue = this.sanitizeInput(sanitizedValue);
        }

        // 必須チェック
        if (rule.required && this.isEmpty(sanitizedValue)) {
            errors.push(this.getErrorMessage(fieldName, 'required'));
        }

        // 空でない場合のみ以下の検証を実行
        if (!this.isEmpty(sanitizedValue)) {
            // 長さチェック
            if (rule.minLength !== undefined && sanitizedValue.length < rule.minLength) {
                errors.push(this.getErrorMessage(fieldName, 'minLength', rule.minLength));
            }

            if (rule.maxLength !== undefined && sanitizedValue.length > rule.maxLength) {
                errors.push(this.getErrorMessage(fieldName, 'maxLength', rule.maxLength));
            }

            // パターンチェック
            if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
                errors.push(this.getErrorMessage(fieldName, 'pattern'));
            }

            // 許可される文字チェック
            const allowedPattern = this.allowedPatterns[fieldName];
            if (allowedPattern && !allowedPattern.test(sanitizedValue)) {
                errors.push(this.getErrorMessage(fieldName, 'invalidCharacters'));
            }

            // XSSチェック
            if (this.containsXSS(sanitizedValue)) {
                errors.push(this.getErrorMessage(fieldName, 'xss'));
            }

            // 追加のセキュリティチェック
            if (this.containsSuspiciousContent(sanitizedValue)) {
                errors.push(this.getErrorMessage(fieldName, 'suspicious'));
            }
        }

        return {
            isValid: errors.length === 0,
            sanitizedValue: sanitizedValue,
            errors: errors
        };
    }

    /**
     * 入力値をサニタイズ
     * @param {string} input - サニタイズする入力値
     * @returns {string} サニタイズされた値
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return '';
        }

        let sanitized = input;

        // 前後の空白を削除
        sanitized = sanitized.trim();

        // HTMLエンティティをエスケープ
        sanitized = this.escapeHtml(sanitized);

        // 制御文字を削除
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

        // 連続する空白を単一の空白に変換
        sanitized = sanitized.replace(/\s+/g, ' ');

        // XSSパターンを削除
        for (const pattern of this.xssPatterns) {
            sanitized = sanitized.replace(pattern, '');
        }

        return sanitized;
    }

    /**
     * HTMLエスケープ
     * @param {string} text - エスケープするテキスト
     * @returns {string} エスケープされたテキスト
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * XSSパターンをチェック
     * @param {string} input - チェックする入力値
     * @returns {boolean} XSSパターンが含まれている場合true
     */
    containsXSS(input) {
        for (const pattern of this.xssPatterns) {
            if (pattern.test(input)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 疑わしいコンテンツをチェック
     * @param {string} input - チェックする入力値
     * @returns {boolean} 疑わしいコンテンツが含まれている場合true
     */
    containsSuspiciousContent(input) {
        const suspiciousPatterns = [
            /\beval\s*\(/gi,
            /\bFunction\s*\(/gi,
            /\bsetTimeout\s*\(/gi,
            /\bsetInterval\s*\(/gi,
            /\bdocument\s*\./gi,
            /\bwindow\s*\./gi,
            /\balert\s*\(/gi,
            /\bconfirm\s*\(/gi,
            /\bprompt\s*\(/gi,
            /<\s*\/?\s*[a-z]/gi,
            /\{\{.*\}\}/gi, // テンプレート構文
            /\$\{.*\}/gi,   // テンプレートリテラル
            /<%.*%>/gi      // サーバーサイドテンプレート
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(input)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 値が空かどうかチェック
     * @param {string} value - チェックする値
     * @returns {boolean} 空の場合true
     */
    isEmpty(value) {
        return !value || value.trim().length === 0;
    }

    /**
     * エラーメッセージを取得
     * @param {string} fieldName - フィールド名
     * @param {string} errorType - エラータイプ
     * @param {*} param - パラメータ
     * @returns {string} エラーメッセージ
     */
    getErrorMessage(fieldName, errorType, param = null) {
        const fieldDisplayName = this.getFieldDisplayName(fieldName);
        
        const messages = {
            required: `${fieldDisplayName}は必須項目です`,
            minLength: `${fieldDisplayName}は${param}文字以上で入力してください`,
            maxLength: `${fieldDisplayName}は${param}文字以内で入力してください`,
            pattern: `${fieldDisplayName}の形式が正しくありません`,
            invalidCharacters: `${fieldDisplayName}に使用できない文字が含まれています`,
            xss: `${fieldDisplayName}にセキュリティ上問題のある内容が含まれています`,
            suspicious: `${fieldDisplayName}に疑わしい内容が含まれています`
        };

        return messages[errorType] || `${fieldDisplayName}に入力エラーがあります`;
    }

    /**
     * フィールドの表示名を取得
     * @param {string} fieldName - フィールド名
     * @returns {string} 表示名
     */
    getFieldDisplayName(fieldName) {
        const displayNames = {
            bookTitle: '書籍タイトル',
            author: '著者名'
        };
        
        return displayNames[fieldName] || fieldName;
    }

    /**
     * リアルタイムバリデーション
     * @param {HTMLElement} input - 入力要素
     * @param {Function} callback - バリデーション結果のコールバック
     */
    setupRealtimeValidation(input, callback) {
        const fieldName = input.name || input.id;
        
        const validate = () => {
            const result = this.validateField(fieldName, input.value);
            
            // UI更新の責務を呼び出し元に委譲
            // this.updateFieldUI(input, result);
            
            // コールバック実行
            if (callback) {
                callback(fieldName, result);
            }
        };

        // イベントリスナーを設定
        input.addEventListener('input', validate);
        input.addEventListener('blur', validate);
        input.addEventListener('paste', () => {
            // ペースト後に少し遅延してバリデーション
            setTimeout(validate, 10);
        });

        return validate;
    }

    /**
     * フィールドのUI更新
     * @param {HTMLElement} input - 入力要素
     * @param {Object} validationResult - バリデーション結果
     */
    updateFieldUI(input, validationResult) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        // 既存のエラーメッセージを削除
        const existingError = formGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // aria-invalid属性を更新
        input.setAttribute('aria-invalid', validationResult.isValid ? 'false' : 'true');

        if (validationResult.isValid) {
            // 成功状態
            input.classList.remove('error');
            input.classList.add('valid');
            formGroup.classList.remove('has-error');
            formGroup.classList.add('has-success');
        } else {
            // エラー状態
            input.classList.remove('valid');
            input.classList.add('error');
            formGroup.classList.remove('has-success');
            formGroup.classList.add('has-error');

            // エラーメッセージを表示
            if (validationResult.errors.length > 0) {
                const errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                errorElement.setAttribute('role', 'alert');
                errorElement.setAttribute('aria-live', 'polite');
                errorElement.textContent = validationResult.errors[0]; // 最初のエラーのみ表示
                
                formGroup.appendChild(errorElement);
            }
        }
    }

    /**
     * フォーム全体のバリデーション状態をリセット
     * @param {HTMLElement} form - フォーム要素
     */
    resetFormValidation(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.classList.remove('valid', 'error');
            input.setAttribute('aria-invalid', 'false');
            
            const formGroup = input.closest('.form-group');
            if (formGroup) {
                formGroup.classList.remove('has-success', 'has-error');
                
                const errorElement = formGroup.querySelector('.field-error');
                if (errorElement) {
                    errorElement.remove();
                }
            }
        });
    }

    /**
     * カスタムバリデーションルールを追加
     * @param {string} fieldName - フィールド名
     * @param {Object} rule - バリデーションルール
     */
    addValidationRule(fieldName, rule) {
        this.validationRules[fieldName] = {
            ...this.validationRules[fieldName],
            ...rule
        };
    }

    /**
     * 安全な文字列として出力用にサニタイズ
     * @param {string} input - サニタイズする文字列
     * @returns {string} 出力用にサニタイズされた文字列
     */
    sanitizeForOutput(input) {
        if (typeof input !== 'string') {
            return '';
        }

        // HTMLエスケープ
        let sanitized = this.escapeHtml(input);

        // 改行文字を<br>に変換（必要に応じて）
        // sanitized = sanitized.replace(/\n/g, '<br>');

        return sanitized;
    }

    /**
     * URL用にサニタイズ
     * @param {string} input - サニタイズする文字列
     * @returns {string} URL用にサニタイズされた文字列
     */
    sanitizeForUrl(input) {
        if (typeof input !== 'string') {
            return '';
        }

        // 基本的なサニタイゼーション
        let sanitized = this.sanitizeInput(input);

        // URLエンコード
        sanitized = encodeURIComponent(sanitized);

        return sanitized;
    }

    /**
     * CSVエクスポート用にサニタイズ
     * @param {string} input - サニタイズする文字列
     * @returns {string} CSV用にサニタイズされた文字列
     */
    sanitizeForCsv(input) {
        if (typeof input !== 'string') {
            return '';
        }

        let sanitized = this.sanitizeInput(input);

        // CSVインジェクション対策
        if (sanitized.match(/^[=+\-@]/)) {
            sanitized = "'" + sanitized;
        }

        // ダブルクォートをエスケープ
        sanitized = sanitized.replace(/"/g, '""');

        // 必要に応じてダブルクォートで囲む
        if (sanitized.includes(',') || sanitized.includes('\n') || sanitized.includes('"')) {
            sanitized = '"' + sanitized + '"';
        }

        return sanitized;
    }
}

// Node.js環境でグローバルに公開
if (typeof global !== 'undefined') {
    global.InputValidator = InputValidator;
}