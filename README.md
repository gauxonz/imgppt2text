# 会拍总结

“会场咔咔拍，一键转文字！” —— 现场 PPT 照片转换为文字总结的工具。

## 技术架构

- **前端**: 纯 HTML/CSS/JavaScript，部署于 Cloudflare Pages
- **后端**: Cloudflare Workers (JavaScript)
- **AI服务**: 阿里百炼 DashScope (qwen3.5-plus 模型)，支持自定义 API

## 功能特性

- [x] 上传多张 PPT 照片
- [x] 多演讲人管理
- [x] AI 识别图片中的文字
- [x] 自动识别演讲人姓名和演讲标题
- [x] 生成会议总结
- [x] 支持自定义 API Key
- [x] 预览、复制、下载结果
- [x] 每日免费次数限制
- [x] 调试模式（管理员专用）

## 快速部署

### 1. 后端部署 (Cloudflare Workers)

```bash
cd workers

# 安装依赖
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
wrangler deploy
```

### 2. 配置环境变量

```bash
# 阿里百炼 API Key（必须）
wrangler secret put DEFAULT_API_KEY

# 管理员密码（可选，用于开启调试模式）
wrangler secret put ADMIN_PASSWORD

# 每日免费次数（可选，默认 100）
wrangler secret put DAILY_LIMIT
```

### 3. 前端部署 (Cloudflare Pages)

1. 进入 Cloudflare Dashboard → Pages
2. 创建新项目，连接 Git 仓库
3. 构建命令留空，输出目录填 `.`
4. 绑定自定义域名（可选）

### 4. 配置自定义域名（可选）

在 `workers/wrangler.toml` 中已配置自定义域：

```toml
routes = [
  { pattern = "your-domain.com", zone_name = "your-zone.com" }
]
```

## 配置说明

### Workers 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DEFAULT_API_KEY | 阿里百炼 API Key | （必须配置） |
| ADMIN_PASSWORD | 管理员密码 | - |
| DAILY_LIMIT | 每日免费次数 | 100 |
| DEFAULT_BASE_URL | API 地址 | https://dashscope.aliyuncs.com/compatible-mode/v1 |
| DEFAULT_MODEL | 默认模型 | qwen3.5-plus |

### 前端配置

前端默认连接 `https://imgppt2txt-api.8611092.xyz/`，如需修改请编辑 `index.html` 中的 `API_URL` 常量。

## 使用方法

1. 填写会议主题（必填）
2. 添加演讲人
3. 上传 PPT 照片
4. 点击“开始处理”
5. 查看结果，支持复制和下载

## 项目结构

```
├── imgppt2text-frontend/   # 前端页面
│   ├── index.html          # 主页面
│   ├── help.html           # 使用说明
│   └── asset/             # 静态资源（含赞赏码）
├── workers/                # Cloudflare Workers
│   ├── workers.js          # 后端代码
│   └── wrangler.toml      # 部署配置
└── CLAUDE.md              # 项目说明
```

## 赞赏支持

如果你觉得这个项目有用，欢迎赞赏支持！

![赞赏码](./imgppt2text-frontend/asset/赞赏码.png)

感谢你的支持！

## 开源协议

MIT License
