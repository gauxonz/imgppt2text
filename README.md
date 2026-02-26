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

## 部署步骤

### 1. 创建 KV 命名空间

在部署 Workers 之前，需要先创建 KV 命名空间用于存储免费次数：

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers 和 Pages → KV
2. 点击「创建命名空间」
3. 输入名称，例如：`imgppt2txt_usage`
4. 创建成功后，复制「ID」

### 2. 部署后端 (Cloudflare Workers)

```bash
cd workers

# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 复制配置示例
cp wrangler.toml.example wrangler.toml

# 编辑 wrangler.toml，配置：
# - name: 项目名称
# - routes: 自定义域名
# - kv_namespaces.id: 填入上一步创建的 KV 命名空间 ID

# 设置敏感环境变量
wrangler secret put DEFAULT_API_KEY
# 输入你的阿里百炼 API Key（格式：sk-xxx）

wrangler secret put ADMIN_PASSWORD
# 输入管理员密码（可选，用于开启调试模式）

# 部署
wrangler deploy
```

### 3. 部署前端 (Cloudflare Pages)

前端只需要配置一个环境变量：`API_URL`（指向你的 Workers 地址）

```bash
cd imgppt2text-frontend

# 登录 Cloudflare
wrangler login

# 复制配置示例
cp wrangler.toml.example wrangler.toml

# 编辑 wrangler.toml，将 API_URL 改为你的 Workers 地址

# 创建 Pages 项目
wrangler pages project create imgppt2txt

# 部署
wrangler pages deploy .
```

### 4. 绑定自定义域名（可选）

部署完成后，可在 Cloudflare Dashboard 中绑定自定义域名：
- Workers: 进入 Workers → 你的项目 → 触发器 → 自定义域
- Pages: 进入 Pages → 你的项目 → 自定义域

## 配置说明

### Workers 环境变量

| 变量名 | 设置方式 | 说明 | 默认值 |
|--------|----------|------|--------|
| DEFAULT_API_KEY | `wrangler secret put` | 阿里百炼 API Key（必须） | - |
| ADMIN_PASSWORD | `wrangler secret put` | 管理员密码 | - |
| WEEKLY_LIMIT | wrangler.toml | 每周免费次数 | 50 |
| DEFAULT_MODEL | wrangler.toml | 默认模型 | qwen3.5-plus |
| DEFAULT_BASE_URL | wrangler.toml | API 地址 | https://dashscope.aliyuncs.com/compatible-mode/v1 |

### 前端环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| API_URL | 后端 Workers 地址（**唯一需要配置**） | `https://imgppt2txt-api.8611092.xyz/` |

前端会自动从 Worker 获取其他配置（DEFAULT_BASE_URL、DEFAULT_MODEL、WEEKLY_LIMIT）。

## 项目结构

```
├── imgppt2text-frontend/   # 前端页面
│   ├── index.html          # 主页面
│   ├── help.html           # 使用说明
│   ├── functions/          # Pages Functions（环境变量注入）
│   ├── wrangler.toml       # 部署配置（本地使用，不提交）
│   ├── wrangler.toml.example  # 配置示例
│   └── asset/              # 静态资源
├── workers/                # Cloudflare Workers
│   ├── workers.js          # 后端代码
│   ├── wrangler.toml       # 部署配置（本地使用，不提交）
│   └── wrangler.toml.example  # 配置示例
└── README.md               # 项目说明
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
