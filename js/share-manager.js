/**
 * ShareManager - X（旧Twitter）シェア機能を管理するクラス
 * 読書宣言と読了メッセージのテキスト生成とシェア機能を提供
 */
class ShareManager {
    constructor() {
        this.baseUrl = 'https://x.com/intent/post';
        this.maxTextLength = 280; // Xの文字数制限
    }

    /**
     * 読書宣言用のテキストを生成
     * @param {string} bookTitle - 書籍タイトル
     * @param {string} author - 著者名（オプション）
     * @returns {string} 生成されたテキスト
     */
    generateDeclarationText(bookTitle, author = '') {
        let text = `# 読書宣言\n\n「${bookTitle}」`;
        
        if (author && author.trim()) {
            text += ` by ${author.trim()}`;
        }
        
        text += '\n\n読み始めます！📚';
        
        // 文字数制限チェック
        if (text.length > this.maxTextLength) {
            // 長すぎる場合は短縮
            const maxTitleLength = this.maxTextLength - 50; // 余裕を持たせる
            const truncatedTitle = bookTitle.length > maxTitleLength 
                ? bookTitle.substring(0, maxTitleLength) + '...'
                : bookTitle;
            
            text = `# 読書宣言\n\n「${truncatedTitle}」`;
            if (author && author.trim()) {
                text += ` by ${author.trim()}`;
            }
            text += '\n\n読み始めます！📚';
        }
        
        return text;
    }

    /**
     * 読了用のテキストを生成
     * @param {string} bookTitle - 書籍タイトル
     * @param {string} author - 著者名（オプション）
     * @returns {string} 生成されたテキスト
     */
    generateCompletionText(bookTitle, author = '') {
        let text = `📖 読了報告\n\n「${bookTitle}」`;
        
        if (author && author.trim()) {
            text += ` by ${author.trim()}`;
        }
        
        text += '\n\n読み終わりました！✨\n\n#読了 #読書記録';
        
        // 文字数制限チェック
        if (text.length > this.maxTextLength) {
            // 長すぎる場合は短縮
            const maxTitleLength = this.maxTextLength - 70; // 余裕を持たせる
            const truncatedTitle = bookTitle.length > maxTitleLength 
                ? bookTitle.substring(0, maxTitleLength) + '...'
                : bookTitle;
            
            text = `📖 読了報告\n\n「${truncatedTitle}」`;
            if (author && author.trim()) {
                text += ` by ${author.trim()}`;
            }
            text += '\n\n読み終わりました！✨\n\n#読了 #読書記録';
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
            const encodedText = encodeURIComponent(text);
            return `${this.baseUrl}?text=${encodedText}`;
        } catch (error) {
            console.error('シェアURL生成エラー:', error);
            return null;
        }
    }

    /**
     * Xにシェア（新しいタブで開く）
     * @param {string} text - シェアするテキスト
     * @returns {Promise<boolean>} シェア成功時true
     */
    async shareToX(text) {
        try {
            const shareUrl = this.generateShareUrl(text);
            
            if (!shareUrl) {
                throw new Error('シェアURLの生成に失敗しました');
            }

            // 新しいタブでXのシェア画面を開く
            const popup = window.open(
                shareUrl,
                '_blank',
                'width=600,height=400,scrollbars=yes,resizable=yes'
            );

            // ポップアップがブロックされた場合の処理
            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                throw new Error('ポップアップがブロックされました');
            }

            return true;
        } catch (error) {
            console.error('Xシェアエラー:', error);
            return false;
        }
    }

    /**
     * 読書宣言をシェア
     * @param {string} bookTitle - 書籍タイトル
     * @param {string} author - 著者名（オプション）
     * @returns {Promise<Object>} シェア結果
     */
    async shareDeclaration(bookTitle, author = '') {
        try {
            const text = this.generateDeclarationText(bookTitle, author);
            const success = await this.shareToX(text);
            
            return {
                success,
                text,
                type: 'declaration'
            };
        } catch (error) {
            console.error('読書宣言シェアエラー:', error);
            return {
                success: false,
                error: error.message,
                type: 'declaration'
            };
        }
    }

    /**
     * 読了報告をシェア
     * @param {string} bookTitle - 書籍タイトル
     * @param {string} author - 著者名（オプション）
     * @returns {Promise<Object>} シェア結果
     */
    async shareCompletion(bookTitle, author = '') {
        try {
            const text = this.generateCompletionText(bookTitle, author);
            const success = await this.shareToX(text);
            
            return {
                success,
                text,
                type: 'completion'
            };
        } catch (error) {
            console.error('読了報告シェアエラー:', error);
            return {
                success: false,
                error: error.message,
                type: 'completion'
            };
        }
    }

    /**
     * テキストの文字数をチェック
     * @param {string} text - チェックするテキスト
     * @returns {Object} 文字数情報
     */
    checkTextLength(text) {
        return {
            length: text.length,
            maxLength: this.maxTextLength,
            isValid: text.length <= this.maxTextLength,
            remaining: this.maxTextLength - text.length
        };
    }

    /**
     * マニュアル投稿用のテキストをクリップボードにコピー
     * @param {string} text - コピーするテキスト
     * @returns {Promise<boolean>} コピー成功時true
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
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
                
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return success;
            }
        } catch (error) {
            console.error('クリップボードコピーエラー:', error);
            return false;
        }
    }
}