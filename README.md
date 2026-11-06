# 高松灯主题博客

基于 Astro 搭建的静态博客，部署在 GitHub Pages：<https://altria358.github.io/Tomori/>

这个仓库就是博客的全部内容。**改文章、加项目、换文案，全部在 GitHub 网页上点点鼠标就能完成，提交后会自动重新发布**（约 1–2 分钟）。

---

## 一、写新文章

1. 打开 <https://github.com/Altria358/Tomori/new/main/src/content/posts>
2. 文件名填 `你想要的英文名.md`，例如 `2026-11-07-stone.md`
3. 把下面的模板粘进去，改掉内容：

```markdown
---
title: 文章标题
published: 2026-11-07
description: 一句话简介，会显示在列表和搜索结果里
tags: [随笔]
category: 随笔
pinned: false
---

正文从这里开始，正常写 Markdown 就行。

## 小标题

- 列表
- `行内代码`
```

4. 页面上拉到最下面，点 **Commit changes…** → 再点 **Commit changes**
5. 等 1–2 分钟，刷新站点就能看到

改已有文章也是同样的流程：打开那个 `.md` 文件 → 右上角铅笔图标 → 改 → 提交。

### frontmatter 字段速查

| 字段 | 说明 |
| --- | --- |
| `title` | 标题（必填） |
| `published` | 发布日期，格式 `2026-11-07`（必填） |
| `description` | 摘要，列表页会显示 |
| `tags` | 标签数组，如 `[随笔, MyGO]` |
| `category` | 分类，只能填一个，如 `随笔` |
| `pinned` | `true` 会置顶到首页 |
| `image` | 封面图路径，可留空 |
| `slug` | 网址别名，留空就用文件名 |
| `draft` | `true` 表示草稿，不发布 |

---

## 二、加 / 改项目

项目页：<https://altria358.github.io/Tomori/projects/>

1. 打开 <https://github.com/Altria358/Tomori/new/main/src/content/projects>
2. 文件名填 `my-project.md`
3. 模板：

```markdown
---
title: 项目名
published: 2026-11-07
description: 一句话说明这个项目是做什么的
tags: [Astro, 工具]
link:
  - label: 源码
    icon: mdi:github
    value: https://github.com/Altria358/xxx
  - label: 在线预览
    icon: material-symbols:link
    value: https://example.com
status: published
---

详细说明写在这里（Markdown）。
```

`status` 可选：`planning`（计划中）、`developing`（开发中）、`published`（已发布）、`archived`（已归档）。

---

## 三、改站点信息（标题、标语、导航、头像、壁纸）

全都在 `src/config/` 里，每个文件是一个功能模块，都能在 GitHub 网页上直接编辑：

| 想改什么 | 文件 |
| --- | --- |
| 站点标题、副标题、主题色、关键词 | `src/config/siteConfig.ts` |
| 首页大图文字、按钮、背景图 | `src/config/backgroundWallpaper.ts` |
| 头像、昵称、简介、社交链接 | `src/config/profileConfig.ts` |
| 导航栏菜单 | `src/config/navBarConfig.ts` |
| 侧边栏显示哪些卡片 | `src/config/sidebarConfig.ts` |
| 页脚版权 | `src/config/FooterConfig.html` |
| 字体 | `src/config/fontConfig.ts` |
| 特效（水波纹、樱花等） | `src/config/effectsConfig.ts` |

「关于我」页面：`src/content/spec/about.md`

---

## 四、换图片

图片放在 `src/assets/images/`：

- 电脑端壁纸：`src/assets/images/DesktopWallpaper/`
- 手机端壁纸：`src/assets/images/MobileWallpaper/`
- 头像：`src/assets/images/avatar-tomori.png`
- Logo：`src/assets/images/logo/`

上传方法：进对应目录 → **Add file → Upload files** → 拖进去 → 提交，然后在配置文件里把路径改成新文件名。

> `src/assets/` 里的图片会被 Astro 压缩处理，`public/` 里的则原样输出（适合 favicon 这类）。

---

## 五、在本地跑（可选）

需要 Node ≥ 22、pnpm ≥ 11。

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # 生成静态站点到 dist/
```

---

## 六、部署

`.github/workflows/deploy.yml`：推送到 `main` 或手动 Run workflow → 自动构建 → 发布到 GitHub Pages。

需要在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**（只需设置一次）。

---

## 目录结构

```
src/
  config/       站点配置（标题、导航、壁纸、头像…）
  content/
    posts/      文章（Markdown）
    projects/   项目（Markdown）
    spec/       关于、友链、留言板等页面内容
  assets/       图片、字体
  pages/        路由页面
  components/   组件
  layouts/      布局
  styles/       样式（主题色、自定义样式 tomori-theme.css）
public/         favicon、静态资源
```
