# Design Document

## Overview

読書宣言アプリは、シンプルなWebアプリケーションとして設計されます。フロントエンドのみで動作し、ローカルストレージを使用してデータを管理します。X（旧Twitter）のシェア機能を活用して、認証なしで投稿を可能にします。

## Architecture

### システム構成

```
┌─────────────────────────────────────┐
│           Web Browser               │
├─────────────────────────────────────┤
│  Reading Declaration App (Frontend) │
│  ┌─────────────────────────────────┐ │
│  │        User Interface           │ │
│  ├─────────────────────────────────┤ │
│  │     Application Logic          │ │
│  ├─────────────────────────────────┤ │
│  │    Local Storage Manager       │ │
│  └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│        Local Storage                │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│      X (Twitter) Share API          │
│    (External Service - No Auth)     │
└─────────────────────────────────────┘
```

### 技術スタック

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **データストレージ**: Browser Local Storage
- **外部連携**: X Share URL (https://x.com/intent/post)
- **スタイリング**: CSS Grid/Flexbox, レスポンシブデザイン

## Components and Interfaces

### 1. User Interface Components

#### MainApp Component
- 読書タスクの一覧表示
- 新規読書宣言フォーム
- 完了済みタスクの表示

#### BookForm Component
- 書籍タイトル入力フィールド
- 著者名入力フィールド（オプション）
- 読書宣言投稿ボタン

#### TaskList Component
- 進行中の読書タスク表示
- 各タスクの読了ボタン
- タスク削除ボタン

#### TaskItem Component
- 個別タスクの表示
- 読了シェアボタン
- タスク削除機能

### 2. Application Logic Components

#### TaskManager Class
```javascript
class TaskManager {
  constructor()
  addTask(bookTitle, author)
  completeTask(taskId)
  deleteTask(taskId)
  getAllTasks()
  getActiveTasks()
  getCompletedTasks()
}
```

#### ShareManager Class
```javascript
class ShareManager {
  generateDeclarationText(bookTitle, author)
  generateCompletionText(bookTitle, author)
  shareToX(text)
}
```

#### StorageManager Class
```javascript
class StorageManager {
  saveTask(task)
  loadTasks()
  updateTask(taskId, updates)
  deleteTask(taskId)
}
```

## Data Models

### Task Model
```javascript
{
  id: string,           // UUID
  bookTitle: string,    // 書籍タイトル
  author: string,       // 著者名（オプション）
  status: 'active' | 'completed',
  createdAt: Date,      // 作成日時
  completedAt: Date | null  // 完了日時
}
```

### Local Storage Schema
```javascript
{
  "reading-tasks": [
    {
      id: "uuid-1",
      bookTitle: "サンプル本",
      author: "著者名",
      status: "active",
      createdAt: "2025-01-15T10:00:00Z",
      completedAt: null
    }
  ]
}
```

## Error Handling

### Local Storage Errors
- ストレージ容量不足の場合: ユーザーに警告メッセージを表示
- ストレージアクセス不可の場合: セッションストレージにフォールバック

### X Share Errors
- ポップアップブロックの場合: ユーザーにポップアップ許可を促すメッセージ
- シェアURL生成エラー: エラーメッセージとマニュアル投稿オプション

### Input Validation
- 書籍タイトルの必須チェック
- 文字数制限（Xの文字数制限を考慮）
- 特殊文字のエスケープ処理

## Testing Strategy

### Unit Tests
- TaskManager クラスのメソッド
- ShareManager のテキスト生成機能
- StorageManager のCRUD操作

### Integration Tests
- フォーム送信からローカルストレージ保存まで
- タスク完了からシェア機能まで
- ページリロード時のデータ復元

### Manual Tests
- レスポンシブデザインの確認
- 各ブラウザでの動作確認
- X シェア機能の実際の動作確認

### User Experience Tests
- フォームの使いやすさ
- タスク管理の直感性
- エラーメッセージの分かりやすさ