# 部署指南

## 方式一：使用 Cloudflare Workers（推荐）

### 步骤 1：安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 步骤 2：登录 Cloudflare

```bash
wrangler login
```

### 步骤 3：创建 Workers 项目

```bash
cd web/workers/py
wrangler init ppt-processor --type=python
```

将 `main.py` 的内容复制到创建的项目中。

### 步骤 4：设置 API Key

```bash
wrangler secret put DASHSCOPE_API_KEY
# 输入你的阿里百炼 API Key: sk-6a9f85b7fb8944ed8b5743b5d36ed974
```

### 步骤 5：部署

```bash
wrangler deploy
```

部署后会得到一个 URL，例如：`https://ppt-processor.your-account.workers.dev`

### 步骤 6：更新前端 URL

编辑 `web/index.html`，将 `API_URL` 替换为你的 Workers URL：

```javascript
const API_URL = 'https://ppt-processor.your-account.workers.dev';
```

---

## 方式二：使用 Cloudflare Pages

### 步骤 1：上传 Workers 代码

同方式一的步骤 1-5。

### 步骤 2：创建 Pages 项目

1. 进入 Cloudflare Dashboard → Pages
2. 创建项目 → 直接上传
3. 上传 `web/index.html`
4. 绑定 Workers 函数（可选，也可以直接修改 index.html 中的 API_URL 指向 Workers URL）

---

## 方式三：使用自己的服务器

如果你有自己的服务器，只需要：

1. 部署 Python 后端（参考 `main.py`）
2. 将 `index.html` 部署到服务器
3. 修改 `index.html` 中的 `API_URL` 指向你的后端地址

---

## 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| DASHSCOPE_API_KEY | 阿里百炼 API Key | 是 |

## 功能特性

- [x] 多图上传（最多20张）
- [x] 图片压缩（前端 Base64 转换）
- [x] 逐页 AI 识别
- [x] 自动生成总结
- [x] 剩余次数显示
- [x] 支持自定义 API Key
- [x] 复制结果到剪贴板
- [x] 响应式设计（支持手机/电脑）

## 注意事项

1. Cloudflare Workers 免费版有 100,000 次/天 请求限制
2. 阿里百炼 API 调用会计费
3. 图片过大会导致请求超时，建议在前端进行压缩
