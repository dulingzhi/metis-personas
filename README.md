# Metis 人设库

[Metis](https://github.com/dulingzhi/metis) 的官方人设源。

## 用法

```sh
# 导入全部
metis import dulingzhi/metis-personas

# 只预览
metis import dulingzhi/metis-personas --dry-run

# 覆盖同名
metis import dulingzhi/metis-personas --overwrite
```

导入后会出现在 `metis ls` 里，用 `metis use <id>` 启用。

## 人设是什么

一份人设就是一段**写进宿主系统提示词**的文本。它不是提示词模板，也不是对话记录 ——
它改变的是 agent 的**身份与工作方式**。

比如「严格模式」让 agent 只做被要求的事，「排障模式」要求它先复现再修。
这些约束对**跨会话**有效，因为它落在宿主的系统层，而不是某一轮对话里。

配套的 `harness` / `model` 字段声明这份人设适配哪些执行器与模型；
`["*"]` 表示不限。

## 收录标准

- **可观测的行为改变**：每条约束都应该是能被检验的行为，不是口号
- **不写具体工具**：说「先读现有实现」，而不是「用 rg 搜索」
- **短**：人设越长，越容易和宿主自己的提示词打架
- **说清边界**：不确定时该怎么做，要写明

## 贡献

欢迎 PR。新增一份人设要做三件事：

1. 在 `personas/` 下加一个 `<id>.md`（`id` 只能用小写字母、数字、`-`）
2. front-matter 至少包含 `id` / `name` / `description`
3. 在下面的清单里加一行

## 清单

| id | 名称 | 一句话 |
|---|---|---|
| `concise` | 简洁协作 | 中文、先结论、改代码前先读现有实现 |
| `strict` | 严格模式 | 只做被要求的事，不主动扩展范围 |
| `reviewer` | 代码审查 | 只指出问题，不改代码 |
| `explainer` | 讲解模式 | 先给心智模型再给细节 |
| `debugger` | 排障模式 | 先复现再修，不做无根据的猜测 |

## 仓库结构

```
personas/            人设正文（一份一个 .md）
personas.json        **索引文件**，由 scripts/build-index.mjs 自动生成
scripts/build-index.mjs
.github/workflows/index.yml
```

## 为什么有 `personas.json`

Metis 导入时要先知道"仓库里有哪些人设"。用 GitHub 的 contents API 查一次会消耗
一次限流额度（未认证只有 **60 次/小时**），多人共用同一出口 IP 时很容易撞上。

所以把索引**预先生成**成一个静态文件，客户端只需：

1. 下载 `personas.json`（`raw.githubusercontent.com`，CDN，无 API 限流）
2. 按里面的 `file` 路径逐份下载正文（同样是 raw CDN）

**全程不调用 `api.github.com`。**

实际实现走的是 **`codeload.github.com` 的 tarball**（一次请求拿整个仓库）：
`raw.githubusercontent.com` 在部分网络环境下不可达，而 tarball 只需 **1 个请求**，
与仓库有多少份人设无关，也不会触碰 API 限流。

索引由 workflow 在每次 push 到 `personas/` 时自动重建并提交 ——
**不要手改 `personas.json`**，它会被下一次自动提交覆盖。

## 许可

CC0-1.0（公有领域）。人设文本是实用性的工作约定，不该有版权负担。