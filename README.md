# 姜言 - 随机姜胤表情包服务

<div align="center">
  <img src="public/images/imag4. 配置环境变量

复制示例配置文件并按需修改：

```bash
cp .env.example .env
```

环境变量说明：

| 变量名 | 描述 | 默认值 |
|-------|------|-------|
| PORT | 服务器监听端口 | 3000 |
| CACHE_TTL | 缓存过期时间(毫秒) | 3600000 (1小时) |
| IMAGES_DIRECTORY | 图片目录相对路径 | public/images/images |

5. 添加表情包="姜言示例" width="300px" style="border-radius: 8px;">
  <p><i>「随时随地，一键姜言」</i></p>
</div>

## 🎭 项目介绍

「姜言」是一个基于 NestJS 的随机表情包服务，专门提供姜胤的各种表情包。无论您是在即时通讯软件、文档还是博客中，都可以轻松插入姜胤表情包，为您的表达增添趣味与个性。

### 主要特点

- ✨ **随机表情**：每次请求随机返回一张姜胤表情包
- 🔄 **格式多样**：支持 JPG、PNG、GIF、WebP 等多种图片格式
- 🖼️ **尺寸调整**：支持通过 URL 参数调整图片大小
- ⚡ **高性能**：图片缓存机制，快速响应
- 🧩 **易集成**：简单的 API 接口，易于在各种场景中使用

## 🚀 在 Markdown 中使用

您可以在 Markdown 文档中轻松引用姜言表情包：

```markdown
![姜胤表情包](http://your-service-domain.com/memes/random)
```

如需调整图片大小：

```markdown
![姜胤表情包](http://your-service-domain.com/memes/random?width=200&height=200)
```

## 🛠️ 安装与配置

### 环境要求

- Node.js >= 16.x
- npm 或 pnpm 或 yarn

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/yourusername/jiangtokoto.git
cd jiangtokoto
```

2. 安装依赖

```bash
npm install
# 或使用 pnpm
pnpm install
```

3. 拉取子模块（表情包资源）

```bash
git submodule update --init --recursive
```

如果你想使用其他表情包资源，请将图片放在  `public/images/images` 目录。

4. 配置环境变量

复制示例配置文件并按需修改：

```bash
cp .env.example .env
```

环境变量说明：

| 变量名 | 描述 | 默认值 |
|-------|------|-------|
| PORT | 服务器监听端口 | 3000 |
| CACHE_TTL | 缓存过期时间(毫秒) | 3600000 (1小时) |
| IMAGES_DIRECTORY | 图片目录相对路径 | public/images/images |

5. 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run start:prod
```

## 🔌 API 接口

### 获取随机表情包

```
GET /memes/random
```

查询参数:
- `width`: 可选，调整图片宽度
- `height`: 可选，调整图片高度

### 获取表情包总数

```
GET /memes/count
```

返回:
```json
{
  "count": 123
}
```

## 🧪 测试

运行端到端测试：

```bash
./test.sh
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 🙏 致谢

- 感谢姜胤提供的精彩表情包素材
- 感谢 [NestJS](https://nestjs.com/) 提供的优秀框架
- 感谢所有贡献者和用户的支持

## 📋 常见问题

### 如何更新表情包资源？

表情包资源作为Git子模块管理，要更新到最新版本：

```bash
git submodule update --remote --merge
```

### 表情包目录为空怎么办？

确保已正确拉取子模块：

```bash
git submodule update --init --recursive
```

如果仍然为空，可能是权限问题或子模块仓库不可访问，可尝试手动克隆：

```bash
git clone https://github.com/unDefFtr/jiangtokoto-images.git public/images
```

---

<div align="center">
  <p>「姜言—因为有梗，所以有趣」</p>
</div>