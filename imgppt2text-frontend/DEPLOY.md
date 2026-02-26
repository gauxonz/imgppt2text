# 部署指南

本项目使用 Cloudflare Pages + Cloudflare Workers 部署。

## 部署步骤

### 1. 部署后端 (Cloudflare Workers)

```bash
cd workers

# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 复制配置示例
cp wrangler.toml.example wrangler.toml

# 编辑 wrangler.toml，配置：
# - 自定义域名 (routes)
# - KV 命名空间 ID（在 Cloudflare Dashboard 创建）

# 设置敏感环境变量
wrangler secret put DEFAULT_API_KEY
# 输入你的阿里百炼 API Key

wrangler secret put ADMIN_PASSWORD
# 输入管理员密码（可选）

# 部署
wrangler deploy
```

### 2. 部署前端 (Cloudflare Pages)

1. 进入 Cloudflare Dashboard → Pages
2. 创建新项目，连接 Git 仓库
3. 构建命令留空，输出目录填 `.`
4. **添加环境变量**（非常重要！）：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| API_URL | `https://your-workers.workers.dev/` | 你的 Workers 地址 |
| DEFAULT_BASE_URL | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 阿里百炼 API |
| DEFAULT_MODEL | `qwen3.5-plus` | 使用的模型 |
| DEFAULT_WEEKLY_LIMIT | `50` | 每周免费次数 |

5. 部署完成！

## 环境变量说明

### Workers 端

| 变量名 | 设置方式 | 说明 |
|--------|----------|------|
| DEFAULT_API_KEY | `wrangler secret put` | 阿里百炼 API Key |
| ADMIN_PASSWORD | `wrangler secret put` | 管理员密码 |
| WEEKLY_LIMIT | wrangler.toml | 每周免费次数 |
| DEFAULT_MODEL | wrangler.toml | 默认模型 |
| DEFAULT_BASE_URL | wrangler.toml | API 地址 |

### Pages 端

| 变量名 | 说明 |
|--------|------|
| API_URL | 后端 Workers 地址 |
| DEFAULT_BASE_URL | 阿里百炼 API 地址 |
| DEFAULT_MODEL | 使用的模型 |
| DEFAULT_WEEKLY_LIMIT | 每周免费次数 |

## 功能特性

- [x] 多图上传
- [x] 多演讲人管理
- [x] AI 识别图片文字
- [x] 自动识别演讲人信息
- [x] 生成会议总结
- [x] 每周免费次数限制
- [x] 支持自定义 API Key
- [x] 复制/下载结果
- [x] 响应式设计

## 注意事项

1. Workers 免费版有 100,000 次/天 请求限制
2. 阿里百炼 API 调用会计费
3. 请妥善保管 API Key，不要提交到代码仓库
