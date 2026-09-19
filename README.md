# 求职buddy

一个本地优先的 Chrome 求职与面试工作台。它把岗位管理、JD 与简历 OCR、面试知识库、STAR 计时练习和逐题复盘放在同一个侧边栏扩展中。

## 功能

- 岗位漏斗、状态更新时间与准备状态
- JD 截图 OCR、职责与要求整理、匹配证据和风险记录
- 简历事实档案与需要本人确认的 Agent 记忆
- 可编辑、可添加标签并可筛选的项目库、问题库和故事库
- 30 秒 / 1 分钟中英文自我介绍模板
- 一句话、45 秒、90 秒、3 分钟 STAR 计时器
- 以面试为维度的分层复盘、Markdown 导入与 JSON 备份
- 面试模式与常驻 Chrome 侧边栏
- 雾蓝浅色与蓝黑深色主题

## 安装

1. 下载并解压本仓库。
2. 在 Chrome 地址栏打开 `chrome://extensions/`。
3. 打开“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择本项目文件夹。
6. 点击工具栏中的求职buddy图标打开侧边栏。

快捷键：macOS 使用 `Command + Shift + I`，Windows / Linux 使用 `Ctrl + Shift + I`。

## 免安装预览

macOS 可双击 `START_PREVIEW.command`。也可以直接运行：

```bash
python3 preview_server.py
```

然后根据终端提示打开本地地址。预览数据与 Chrome 扩展数据互不影响。

## 隐私

- 数据默认保存在 `chrome.storage.local`，不上传到远程服务器。
- OCR 使用随项目提供的 Tesseract.js 与中文模型在本机处理。
- 扩展仅在用户点击“读取当前招聘页”后，借助 `activeTab` 临时读取当前页面的职位信息。
- 示例知识库已匿名化，不包含作者简历、联系方式或前公司内部材料。
- 在线 AI 接口尚未启用；请勿把 API 密钥直接写入扩展源码。

更完整的说明见 [PRIVACY.md](PRIVACY.md)。

## 自定义知识库

`knowledge/interview-stories.md` 提供四个匿名示例。你可以按现有 Markdown 结构替换为自己的故事。建议每个故事包含：

- 一句话结论
- 60 秒标准回答
- 深挖抓手
- 数据边界

个人数据不应提交到公开仓库。推荐在自己的私有分支中维护，或者在安装后通过界面和 JSON 备份管理。

## 权限

- `storage`：在本机保存工作台数据。
- `sidePanel`：显示 Chrome 侧边栏。
- `activeTab` 与 `scripting`：用户主动点击时读取当前招聘页。

## 开发与验证

项目不依赖构建工具。修改文件后在 `chrome://extensions/` 点击“重新加载”。提交前建议运行：

```bash
node --check dashboard.js
node --check sidepanel.js
node --check intelligence.js
node --check service-worker.js
python3 -m py_compile preview_server.py
```

## 第三方组件

- Tesseract.js 与中文训练数据
- QRCode.js

许可与来源见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。功能思路参考了公开项目 [autumn-job-assistant-tracker](https://github.com/ljkss/autumn-job-assistant-tracker)，本项目为独立实现。

## 开源协议

项目代码使用 [MIT License](LICENSE)。第三方组件继续遵循各自许可证。
