# 会拍总结

"会场咔咔拍，一键转文字！" —— 现场 PPT 照片转换为文字总结的工具。

## 技术架构

- **前端**: 纯 HTML/CSS/JavaScript，部署于 Cloudflare Pages
- **后端**: Cloudflare Workers (JavaScript)
- **存储**: Cloudflare KV（免费次数统计）
- **AI服务**: 阿里百炼 DashScope (qwen3.5-plus 模型)，支持自定义 API

## 功能特性

- [x] 上传多张 PPT 照片
- [x] 多演讲人管理
- [x] AI 识别图片中的文字
- [x] 自动识别演讲人姓名和演讲标题
- [x] 生成会议总结
- [x] 支持自定义 API Key
- [x] 预览、复制、下载结果
- [x] 每周免费次数限制（默认50次/周）
- [x] 调试模式（管理员专用）

## 快速部署

### 1. 后端部署 (Cloudflare Workers)

```bash
cd workers

# 安装依赖
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 复制配置示例文件
cp wrangler.toml.example wrangler.toml

# 编辑 wrangler.toml，配置你的：
# - 自定义域名 (routes)
# - KV 命名空间 ID

# 部署
wrangler deploy
```

### 2. 配置敏感环境变量

```bash
# 阿里百炼 API Key（必须）
wrangler secret put DEFAULT_API_KEY
# 输入你的 API Key（格式：sk-xxx）

# 管理员密码（可选，用于开启调试模式）
wrangler secret put ADMIN_PASSWORD
# 输入管理员密码
```

### 3. 前端部署 (Cloudflare Pages)

有两种方式部署前端：

#### 方式一：连接 GitHub 仓库（推荐）

1. 将 `imgppt2text-frontend` 文件夹作为独立仓库推送到 GitHub
2. 进入 Cloudflare Dashboard → Pages
3. 创建新项目，连接该 GitHub 仓库
4. 构建命令留空，输出目录填 `.`
5. **重要：添加环境变量**

在 Pages 项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| API_URL | 后端 Workers 地址 | `https://your-workers.workers.dev/` |
| DEFAULT_BASE_URL | 阿里百炼 API 地址 | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| DEFAULT_MODEL | 使用的模型 | `qwen3.5-plus` |
| DEFAULT_WEEKLY_LIMIT | 每周免费次数 | `50` |

6. 部署完成，访问你的 Pages 域名

#### 方式二：使用 Wrangler CLI

```bash
cd imgppt2text-frontend

# 登录 Cloudflare
wrangler login

# 创建 Pages 项目（如需要）
wrangler pages project create imgppt2text-frontend

# 设置环境变量并部署
wrangler pages deploy . --project-name=imgppt2text-frontend
# 在 Cloudflare Dashboard 中为项目添加环境变量（见方式一）
```

**注意**：无论使用哪种方式，都需要在 Cloudflare Dashboard 的 Pages 项目设置中添加环境变量。

### 4. 配置自定义域名（可选）

Workers 部署后，在 Cloudflare Dashboard 中添加自定义域名即可。

## 配置说明

### Workers 环境变量

通过 `wrangler secret` 设置（敏感信息）：

| 变量名 | 说明 |
|--------|------|
| DEFAULT_API_KEY | 阿里百炼 API Key（必须） |
| ADMIN_PASSWORD | 管理员密码 |

通过 `wrangler.toml` 或 Dashboard 设置：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DEFAULT_BASE_URL | API 地址 | https://dashscope.aliyuncs.com/compatible-mode/v1 |
| DEFAULT_MODEL | 默认模型 | qwen3.5-plus |
| WEEKLY_LIMIT | 每周免费次数 | 50 |

### 前端环境变量

在 Cloudflare Pages 项目设置中配置：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| API_URL | 后端 Workers 地址 | `https://your-workers.workers.dev/` |
| DEFAULT_BASE_URL | 阿里百炼 API 地址 | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| DEFAULT_MODEL | 使用的模型 | `qwen3.5-plus` |
| DEFAULT_WEEKLY_LIMIT | 每周免费次数 | `50` |

前端通过 Cloudflare Pages Functions 动态注入配置，详见 `functions/[[path]].js`。

## 项目结构

```
├── imgppt2text-frontend/   # 前端页面
│   ├── index.html          # 主页面
│   ├── help.html           # 使用说明
│   ├── functions/          # Pages Functions（环境变量注入）
│   ├── wrangler.toml.example  # 配置示例
│   ├── .env.example        # 环境变量示例
│   └── asset/             # 静态资源
├── workers/                # Cloudflare Workers
│   ├── workers.js          # 后端代码
│   ├── wrangler.toml.example  # 配置示例
│   └── wrangler.toml       # 部署配置（本地使用，不提交）
└── README.md              # 项目说明
```

## 本地开发

### Workers

```bash
cd workers
cp wrangler.toml.example wrangler.toml
# 编辑 wrangler.toml 填入你的配置
wrangler dev
```

### 前端

前端使用 Cloudflare Pages Functions，需要部署后才能测试完整功能。

也可以直接修改 `index.html` 中的默认配置进行本地测试。

## 使用方法

1. 填写会议主题（必填）
2. 添加演讲人
3. 上传 PPT 照片
4. 点击"开始处理"
5. 查看结果，支持复制和下载

## 赞赏支持

如果你觉得这个项目有用，欢迎赞赏支持！

![赞赏码](./imgppt2text-frontend/asset/赞赏码.png)

感谢你的支持！

## 开源协议

MIT License
