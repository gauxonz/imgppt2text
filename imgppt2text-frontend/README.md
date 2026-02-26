# 会拍总结 - 前端

“会场咔咔拍，一键转文字！” —— 现场 PPT 照片转换为文字总结的工具。

## 部署

### 方式一：Cloudflare Pages

1. 进入 Cloudflare Dashboard → Pages
2. 创建新项目，绑定本仓库
3. 构建命令留空，输出目录填 `.`
4. 绑定自定义域名（可选）

### 方式二：其他静态托管

将 `index.html`、`help.html` 和 `asset` 文件夹上传到任何静态托管服务即可。

## 前端配置

如需修改后端 API 地址，编辑 `index.html` 中的 `API_URL` 常量：

```javascript
const API_URL = 'https://your-api-domain.com/';
```

## 文件说明

| 文件 | 说明 |
|------|------|
| index.html | 主页面 |
| help.html | 使用说明 |
| asset/logo.png | Logo 图片 |
