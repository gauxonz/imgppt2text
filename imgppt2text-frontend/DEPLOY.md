# 部署指南

本项目使用 Cloudflare Pages + Cloudflare Workers 部署。

## 部署步骤

### 1. 部署后端 (Cloudflare Workers)

#### 1.1 创建 KV 命名空间

在部署 Workers 之前，需要先创建 KV 命名空间用于存储免费次数：

1. 进入 Cloudflare Dashboard → Workers 和 Pages → KV
2. 点击「创建命名空间」
3. 输入名称，例如：`imgppt2txt_usage`
4. 创建成功后，复制「ID」

#### 1.2 部署 Workers

```bash
cd workers

# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 复制配置示例
cp wrangler.toml_example wrangler.toml

# 编辑 wrangler.toml，配置：
# - name: 项目名称
# - routes: 自定义域名
# - kv_namespaces.id: 填入上一步创建的 KV 命名空间 ID

# 设置敏感环境变量
wrangler secret put DEFAULT_API_KEY
# 输入你的阿里百炼 API Key

wrangler secret put ADMIN_PASSWORD
# 输入管理员密码（可选）

# 部署
wrangler deploy
```

### 2. 部署前端 (Cloudflare Pages)

前端只需要配置一个环境变量：`API_URL`（指向你的 Workers 地址）

#### 方式一：连接 GitHub 仓库

1. 将此文件夹作为独立仓库推送到 GitHub
2. 进入 Cloudflare Dashboard → Pages
3. 创建新项目，连接该 GitHub 仓库
4. 构建命令留空，输出目录填 `.`
5. 添加环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| API_URL | `https://your-workers.workers.dev/` | 你的 Workers 地址 |

6. 部署完成！

#### 方式二：使用 Wrangler CLI

```bash
cd imgppt2text-frontend

# 登录 Cloudflare
wrangler login

# 复制配置示例
cp wrangler.toml.example wrangler.toml

# 编辑 wrangler.toml，填入你的 Workers 地址

# 创建 Pages 项目
wrangler pages project create imgppt2txt

# 部署
wrangler pages deploy .
```

部署后可在 Cloudflare Dashboard → Pages → 自定义域 中绑定自定义域名。

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
| API_URL | 后端 Workers 地址（**唯一需要配置**） |

其他配置（DEFAULT_BASE_URL、DEFAULT_MODEL、WEEKLY_LIMIT）会从前端加载时自动从 Worker 获取。

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
