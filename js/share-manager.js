/**
 * ShareManager - Xシェア機能の管理を行うクラス
 * 読書宣言と読了メッセージのテキスト生成、XシェアURL生成とポップアップ機能を提供
 */
class ShareManager {
    constructor() {
        this.xShareBaseUrl = 'https://x.com/intent/post';
        this.maxTweetLength = 280;
    }

    /**
     * 読書宣言のテキストを生成
     * @param {string} bookTitle - 書籍タイトル
     * @param {string} author - 著者名（オプション）
     * @returns {string} 生成されたテキスト
     */
    generateDeclarationText(bookTitle, author = '') {
        // セキュリティ: 入力をサニタイズ
        const sanitizedTitle = this.sanitizeForShare(bookTitle);
        const sanitizedAuthor = author ? this.sanitizeForShare(author) : '';
        
        let text = `# 読書宣言\n\n「${sanitizedTitle}」`;
        
        if (sanitizedAuthor && sanitizedAuthor.trim()) {
            text += `\n著者: ${sanitizedAuthor}`;
        }
        
        text += '\n\n読書開始！📚';
        
        // 文字数制限チェック
        if (text.length > this.maxTweetLength) {
            // 長すぎる場合は短縮
            const baseText = `# 読書宣言\n\n「${sanitizedTitle}」\n\n読書開始！📚`;
            if (baseText.length > this.maxTweetLength) {
                // タイトルも短縮が必要
                const availableLength = this.maxTweetLength - '# 読書宣言\n\n「」\n\n読書開始！📚'.length;
                const truncatedTitle = sanitizedTitle.substring(0, availableLength - 3) + '...';
                text = `# 読書宣言\n\n「${truncatedTitle}」\n\n読書開始！📚`;
            } else {
                text = baseText;
            }
        }
        
        return text;
    }

    /**
     * 読了メッセージのテキストを生成
     * @param {string} bookTitle - 書籍タイトル
     * @param {string} author - 著者名（オプション）
     * @returns {string} 生成されたテキスト
     */
    generateCompletionText(bookTitle, author = '') {
        // セキュリティ: 入力をサニタイズ
        const sanitizedTitle = this.sanitizeForShare(bookTitle);
        const sanitizedAuthor = author ? this.sanitizeForShare(author) : '';
        
        let text = `📖 読了報告\n\n「${sanitizedTitle}」`;
        
        if (sanitizedAuthor && sanitizedAuthor.trim()) {
            text += `\n著者: ${sanitizedAuthor}`;
        }
        
        text += '\n\n読み終わりました！✨\n\n#読書記録';
        
        // 文字数制限チェック
        if (text.length > this.maxTweetLength) {
            // 長すぎる場合は短縮
            const baseText = `📖 読了報告\n\n「${sanitizedTitle}」\n\n読み終わりました！✨\n\n#読書記録`;
            if (baseText.length > this.maxTweetLength) {
                // タイトルも短縮が必要
                const availableLength = this.maxTweetLength - '📖 読了報告\n\n「」\n\n読み終わりました！✨\n\n#読書記録'.length;
                const truncatedTitle = sanitizedTitle.substring(0, availableLength - 3) + '...';
                text = `📖 読了報告\n\n「${truncatedTitle}」\n\n読み終わりました！✨\n\n#読書記録`;
            } else {
                text = baseText;
            }
        }
        
        return text;
    }

    /**
     * XシェアURLを生成
     * @param {string} text - シェアするテキスト
     * @returns {string} 生成されたURL
     */
    generateShareUrl(text) {
        try {
            // テキストの検証
            if (!text || typeof text !== 'string') {
                throw new Error('無効なテキストです');
            }

            // 文字数制限チェック
            if (text.length > this.maxTweetLength) {
                throw new Error(`テキストが長すぎます（${text.length}文字 > ${this.maxTweetLength}文字）`);
            }

            const encodedText = encodeURIComponent(text);
            const url = `${this.xShareBaseUrl}?text=${encodedText}`;
            
            // URL長さの検証（一般的なURL長さ制限）
            if (url.length > 2048) {
                throw new Error('生成されたURLが長すぎます');
            }
            
            return url;
        } catch (error) {
            console.error('シェアURL生成エラー:', error);
            throw new Error(`シェアURLの生成に失敗しました: ${error.message}`);
        }
    }

    /**
     * 新しいタブでXシェア画面を開く
     * @param {string} url - シェアURL
     * @returns {Promise<Object>} シェア結果
     */
    async openSharePopup(url) {
        try {
            // ポップアップウィンドウのオプション
            const windowFeatures = 'width=600,height=400,scrollbars=yes,resizable=yes,toolbar=no,menubar=no';
            
            // 新しいウィンドウを開く
            const popup = window.open(url, 'xshare', windowFeatures);
            
            // ポップアップブロック検出
            const isBlocked = await this.detectPopupBlock(popup);
            
            if (isBlocked) {
                throw new Error('ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。');
            }
            
            // ポップアップにフォーカス
            if (popup) {
                popup.focus();
            }
            
            return {
                success: true,
                popup: popup
            };
        } catch (error) {
            console.error('ポップアップ開始エラー:', error);
            return {
                success: false,
                error: error.message,
                errorType: 'POPUP_BLOCKED'
            };
        }
    }

    /**
     * ポップアップブロックを検出
     * @param {Window|null} popup - ポップアップウィンドウ
     * @returns {Promise<boolean>} ブロックされている場合true
     */
    async detectPopupBlock(popup) {
        return new Promise((resolve) => {
            // ポップアップが開けなかった場合
            if (!popup) {
                resolve(true);
                return;
            }

            // ポップアップが即座に閉じられた場合の検出
            setTimeout(() => {
                try {
                    if (popup.closed || !popup.location || popup.location.href === 'about:blank') {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                } catch (e) {
                    // クロスオリジンエラーの場合は正常とみなす
                    resolve(false);
                }
            }, 100);
        });
    }

    /**
     * 読書宣言をXにシェア
     * @param {string} bookTitle - 書籍タイトル
     * @param {string} author - 著者名（オプション）
     * @returns {Promise<Object>} シェア結果
     */
    async shareDeclaration(bookTitle, author = '') {
        try {
            const text = this.generateDeclarationText(bookTitle, author);
            return await this.executeShareWithErrorHandling(text, 'declaration');
        } catch (error) {
            console.error('読書宣言シェアエラー:', error);
            
            // 最後の手段としてマニュアル投稿オプションを提供
            const text = this.generateDeclarationText(bookTitle, author);
            const manualResult = await this.provideManualPostingOption(text);
            
            return {
                success: false,
                method: 'manual',
                text: text,
                error: error.message,
                errorType: 'CRITICAL_ERROR',
                manualOption: manualResult
            };
        }
    }

    /**
     * 読了報告をXにシェア
     * @param {string} bookTitle - 書籍タイトル
     * @param {string} author - 著者名（オプション）
     * @returns {Promise<Object>} シェア結果
     */
    async shareCompletion(bookTitle, author = '') {
        try {
            const text = this.generateCompletionText(bookTitle, author);
            return await this.executeShareWithErrorHandling(text, 'completion');
        } catch (error) {
            console.error('読了報告シェアエラー:', error);
            
            // 最後の手段としてマニュアル投稿オプションを提供
            const text = this.generateCompletionText(bookTitle, author);
            const manualResult = await this.provideManualPostingOption(text);
            
            return {
                success: false,
                method: 'manual',
                text: text,
                error: error.message,
                errorType: 'CRITICAL_ERROR',
                manualOption: manualResult
            };
        }
    }

    /**
     * テキストをクリップボードにコピー
     * @param {string} text - コピーするテキスト
     * @returns {Promise<boolean>} コピー成功時true
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // フォールバック: 古いブラウザ対応
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                return successful;
            }
        } catch (error) {
            console.error('クリップボードコピーエラー:', error);
            return false;
        }
    }

    /**
     * マニュアル投稿オプションを提供
     * @param {string} text - 投稿テキスト
     * @returns {Promise<Object>} マニュアル投稿の結果
     */
    async provideManualPostingOption(text) {
        try {
            // クリップボードにコピーを試行
            const copied = await this.copyToClipboard(text);
            
            // Xの投稿ページを新しいタブで開く
            const xUrl = 'https://x.com/compose/post';
            window.open(xUrl, '_blank');
            
            return {
                success: true,
                copied: copied,
                message: copied 
                    ? 'テキストをクリップボードにコピーしました。Xの投稿画面に貼り付けてください。'
                    : 'Xの投稿画面を開きました。以下のテキストをコピーして貼り付けてください。',
                text: text
            };
        } catch (error) {
            console.error('マニュアル投稿オプションエラー:', error);
            return {
                success: false,
                copied: false,
                message: '手動投稿の準備に失敗しました。以下のテキストを手動でコピーしてXに投稿してください。',
                text: text,
                error: error.message
            };
        }
    }

    /**
     * エラーハンドリング付きシェア実行
     * @param {string} text - シェアするテキスト
     * @param {string} shareType - シェアタイプ（'declaration' または 'completion'）
     * @returns {Promise<Object>} シェア結果
     */
    async executeShareWithErrorHandling(text, shareType = 'declaration') {
        try {
            // URL生成を試行
            const url = this.generateShareUrl(text);
            
            // ポップアップでシェアを試行
            const popupResult = await this.openSharePopup(url);
            
            if (popupResult.success) {
                return {
                    success: true,
                    method: 'popup',
                    text: text,
                    url: url
                };
            } else {
                // ポップアップが失敗した場合はマニュアル投稿オプションを提供
                const manualResult = await this.provideManualPostingOption(text);
                
                return {
                    success: false,
                    method: 'manual',
                    text: text,
                    error: popupResult.error,
                    errorType: popupResult.errorType,
                    manualOption: manualResult
                };
            }
        } catch (error) {
            console.error(`${shareType}シェアエラー:`, error);
            
            // URL生成エラーの場合もマニュアル投稿オプションを提供
            const manualResult = await this.provideManualPostingOption(text);
            
            return {
                success: false,
                method: 'manual',
                text: text,
                error: error.message,
                errorType: 'URL_GENERATION_ERROR',
                manualOption: manualResult
            };
        }
    }

    /**
     * シェア用テキストのサニタイゼーション
     * @param {string} text - サニタイズするテキスト
     * @returns {string} サニタイズされたテキスト
     */
    sanitizeForShare(text) {
        if (typeof text !== 'string') {
            return '';
        }

        let sanitized = text;

        // 前後の空白を削除
        sanitized = sanitized.trim();

        // 制御文字を削除
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

        // 危険なパターンを削除
        const dangerousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /data:text\/html/gi,
            /on\w+\s*=/gi
        ];

        for (const pattern of dangerousPatterns) {
            sanitized = sanitized.replace(pattern, '');
        }

        // 連続する空白を単一の空白に変換
        sanitized = sanitized.replace(/\s+/g, ' ');

        // 改行文字を正規化
        sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        return sanitized;
    }
}

// Node.js環境でグローバルに公開
if (typeof global !== 'undefined') {
    global.ShareManager = ShareManager;
}