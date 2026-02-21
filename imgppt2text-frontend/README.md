# PPT图片转文字 - Web版本

使用 Cloudflare Workers + HTML 前端实现的 PPT 图片转文字工具。

## 技术架构

- **前端**: 纯 HTML/CSS/JavaScript
- **后端**: Cloudflare Workers (Python)
- **AI服务**: 阿里百炼 DashScope (qwen3.5-plus 模型)

## 快速部署

### 1. 创建 Workers

```bash
# 安装 wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建新项目
wrangler init ppt-processor --type=python
```

### 2. 配置 Workers

将 `workers/py` 目录下的代码复制到 Workers 中，或使用 `wrangler deploy`。

### 3. 设置环境变量

```bash
wrangler secret put DASHSCOPE_API_KEY
# 输入你的阿里百炼 API Key
```

### 4. 前端部署

将 `workers/html` 目录下的文件部署到 Cloudflare Pages 或任何静态托管。

## 功能

- [x] 上传多张 PPT 照片
- [x] AI 识别图片中的文字
- [x] 生成整体总结
- [x] 支持自定义 API Key
- [x] 复制结果到剪贴板
