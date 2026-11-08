# Morde 场景包 → OpenMausBot team file 映射

> 状态：T06。基线：上游 HEAD 717343f，`openmaus.package` v2。
> 重要纠正：上游当前 team file 的**主格式是 JSON**（`openmaus.package` v2，
> 定义在 `shared/package-format.ts`），不是 Markdown。
> v1 BotMRR Markdown（frontmatter `botmrr: 1`）仍可读，解析时自动升级为 v2
> （`parsePackageDocument` → `upgradeV1`，见 `shared/package-format.ts:756`）。
> 因此 Morde 场景包以 v1 Markdown 形式编写、交换（人可读、可直接交给
> Chief of Staff），以 v2 JSON 形式落盘、导入。两者语义一一对应，见下表。

## 1. 两边的格式

| 一边 | 格式 | 入口 |
|---|---|---|
| Morde 场景包（源） | 一个目录：`scene.yaml` + `playbook.md` + `rules.md` + `memory/` + `hooks/` | 本文件 §2 |
| OpenMausBot team file（目标） | 一份文件：v2 JSON（`openmaus.package` v2，≤ 4 MB）或 v1 BotMRR Markdown（≤ 1 MB） | `shared/package-format.ts`（唯一校验关口），导入见 `server/package-import.ts`，预览见 `src/lib/team-import.ts` |

## 2. 字段映射表

### 2.1 包头

| Morde `scene.yaml` | OpenMausBot v2 JSON | OpenMausBot v1 Markdown | 备注 |
|---|---|---|---|
| `id`（小写 slug） | `package.id` | frontmatter `id` | 必须匹配 `^[a-z0-9][a-z0-9-]*$`，≤ 80 字符 |
| `version`（如 `1.0.0`） | `package.release` | frontmatter `release` | 语义化版本；v1 升级时归一化（`01.2.03` → `1.2.3`） |
| `name` | `package.name`（≤ 100） | frontmatter `name` | 导入后成为新部门名（重名时自动编号，永不合并进已有部门） |
| `tagline` | `package.tagline`（≤ 160） | frontmatter `tagline` | 一句话 |
| `description` | `package.summary`（≤ 2,000） | frontmatter `summary` + `## Mission` | — |
| `category` | `package.category` | frontmatter `category` | 如 `Development` |
| `author.name` | `package.author.name` | frontmatter `author.name` | — |
| `license` | `package.license` | frontmatter `license` | 场景包自己的许可证 |
| `outcomes[]`（1–12 条，每条 ≤ 240 字） | `package.outcomes[]` | frontmatter `outcomes` + `## Outcomes` | 可验收的结果，不是功能列表 |
| `setupMinutes`（1–240） | `package.setupMinutes` | frontmatter `setupMinutes` | 预计上手分钟数 |
| `requirements.apps[]`（slug/label/reason/optional） | `package.requirements.apps[]`（≤ 30） | frontmatter `requirements.apps` + `## Connections` | **只传标签**：需要哪些已连接应用，不传登录状态 |
| `requirements.capabilities[]` | `package.requirements.capabilities[]`（≤ 20） | frontmatter `requirements.capabilities` | 如 `computer` |
| — | `package.team`（v2 专有） | （无；升级时由 `chiefOfStaff` 生成） | `team.name`（≤ 60）、`team.brief`（共享说明，≤ 24,000 字节）、`team.leader`（Chief key） |

### 2.2 角色 → Bots

| Morde | OpenMausBot | 备注 |
|---|---|---|
| `scene.yaml` 里的每个角色（key/name/title/职责） | `package.agents[]`（1–200 个） | `key` 只含小写字母、数字、`-`、`_` |
| 角色的长期指令 | `agent.soul`（standing instructions，≤ 24,000 字节） | 从 `rules.md` 里按角色拆出来；不拆的放 `team.brief` |
| 角色颜色/形象 | `agent.appearance.color`（上游枚举色名）+ 可选 mascot | 图片 ≤ 256×256、≤ 64 KB |
| 角色用的 playbook | `agent.playbooks[]`（key 列表，≤ 40） | 必须在 `package.playbooks[]` 里有定义 |
| 角色用的技能 | `agent.skills[]`（技能名，≤ 30/人，≤ 60/队） | 只传 `SKILL.md` 文本，不传脚本；导入后**默认关闭**（见 T07） |
| — | `package.chiefOfStaff`（v1）/ `package.team.leader`（v2） | 首席：拥有分派、汇总、冲突裁决、最终答案；导入后成为新部门的 Chief |

### 2.3 playbook.md → Playbooks

| Morde `playbook.md` | OpenMausBot | 备注 |
|---|---|---|
| 每份 playbook（触发条件 + 步骤） | `package.playbooks[]`（≤ 80） | `key` / `name`（≤ 100）/ `summary`（≤ 300）/ `triggers[]`（1–30 个，每条 ≤ 100 字）/ `instructions`（≤ 24,000 字节） |
| playbook 的“何时用” | `playbook.triggers[]` | 纯文本触发词；不是定时器，也不是 app 事件（那是 hooks，见 §2.5） |

### 2.4 rules.md + memory/ → 共享说明与种子记忆

| Morde | OpenMausBot | 备注 |
|---|---|---|
| `rules.md`（全场景通用规则） | `package.team.brief`（≤ 24,000 字节）+ 各 `agent.soul` | 通用规则进 brief，角色专属规则进对应 soul；不要两处重复写同一条 |
| `memory/MEMORY.md` + `memory/*.md`（主题笔记） | `agent.seed.memory`（`{"MEMORY.md": "...", "memory/<主题>.md": "..."}`） | 只传种子笔记；**每日日志永不进文件**（`docs/team-sharing.md`）；单个文件 ≤ 256 KB，种子文件 ≤ 100 个，总计 ≤ 1 MB |
| 场景记忆的长期积累（失败库、决策库） | 同上：写进对应 bot 的 `seed.memory` 主题文件 | 导入时经正常 memory writer 一次性写入；之后由 bot 自己维护，不再随包走 |

### 2.5 hooks/ → Routines + App 触发器

| Morde `hooks/` | OpenMausBot | 备注 |
|---|---|---|
| 定时钩子（cron / 每天 / 每 N 分钟） | `package.routines[]`（≤ 50） | `key` / `name` / `agent` / `prompt`（≤ 20,000）/ `schedule`（cron / once / daily / interval，interval 每 5–1,440 分钟）/ `durationMinutes`（5–240）/ `timeoutMinutes`（5–240，可选）/ `overlap`（skip/queue）/ `enabledAfterInstall: false`。**导入后永远暂停**，用户必须手动启用 |
| 事件钩子（app 事件，如“收到邮件/新报价单”） | 上游 App Trigger（`shared/app-triggers.ts`，`server/app-triggers.ts`） | **不在 team file 里**：app 触发器是运行时的自动化（存在 `app-triggers.json`），由 bot 在对话里用 `trigger` 工具创建；场景包只能在 playbook 里写“建议创建以下触发器”，不能直接带一个已绑定的触发器进来 |
| 钩子四要素（何时触发 / 验证什么 / 谁批准 / 决定记在哪） | **上游 schema 目前没有对应字段** | 见 T08：以可选 `morde` 扩展字段加在 App Trigger 上（`verify` / `approver` / `decisionLog`），v1/v2 package 格式本身不改；未知字段会被校验层剥离，所以四要素**不能**塞进 package 文件里蒙混过关 |

### 2.6 明确没有对应字段的东西（设计使然，永不携带）

| Morde 里可能想带的东西 | 上游行为 | 原因 |
|---|---|---|
| 聊天记录 | 无字段；导入时不读 | 历史属于原用户 |
| 密钥、密码、token | 无字段；导出时 `redactPackageSecrets` 脱敏，Admin 上传复核再拒一次 | 见 T07 |
| 模型选择（用哪个模型） | 无字段；导入后用安装默认模型 | 模型是安装时决定，不是包里决定 |
| 电脑选择（本地/云/哪台） | 无字段 | 同上 |
| 审批级别 | 只有 `agent.approval` 建议值，导入时**只记录、不应用**；新 bot 从默认审批级别开始 | 导入方说了算，不是由文件说了算 |
| 谁能看到每个 bot（visibility） | 无字段；由导入方在导入时选 | 同上 |
| 本地 MCP 服务器（跑命令的那种） | 不带 | 会在导入方电脑上跑命令，不安全 |
| routine 附件 | 不带 | 同上 |

## 3. 导入时的默认状态（上游已实现，T07 只补缺口）

- Bots：默认审批级别、**无已连接应用访问**、安装默认模型。
- Skills：**默认关闭**（`server/skills.ts` 的包内安装路径 `enabled: false`；只有 Admin 渠道 `installOrgSkill` 才默认开）。
- Routines：**永远暂停**（`server/package-import.ts` 里 `enabled: false`；v1 `enabledAfterInstall` 只能是 `false`）。
- Connections（远程 MCP）：新建一个**关闭**的 MCP server，值为空，名字按 connection key 取（重名加 `-2`，永不复用已有凭据）。
- 失败回滚：任何一步失败，导入创建的全部东西都删掉（`server/package-import.ts` 的 catch 分支）。

## 4. 限制（写包时必须遵守，否则解析拒绝）

- 整个文件 ≤ 4 MB（v2 JSON）/ ≤ 1 MB（v1 Markdown）。
- Skills：每队 ≤ 60 个，每人 ≤ 30 个，同名只留一个；v1 每队 ≤ 20 个。
- Bots ≤ 200 个，rooms ≤ 30 个，routines ≤ 50 个，playbooks ≤ 80 个，connections ≤ 20 个，presets ≤ 20 个。
- 未知字段会被校验层剥离——不要指望塞自定义字段能带过去；要加字段先改 schema（见 T08 的做法）。

## 5. 示例

`examples/scene-packs/dev-away-from-desk.md`（离岗开发场景，v1 BotMRR Markdown）：
故障分流 + PR 分流，两个 bot（分流员 + 审查员），一个共享房间，
一个每日部署巡视 routine（暂停态），两份 playbook。
验证方法（隔离验证，不碰 live 数据）：
`node --experimental-strip-types scripts/morde-verify-scene-pack.ts examples/scene-packs/dev-away-from-desk.md`
应输出 agents / rooms / playbooks / routines 的数量与 key；解析失败时
直接报上游解析器的原错误，不改写。

## 来源

- `shared/package-format.ts`（唯一校验关口：v1/v2 schema、限制、升级/降级）
- `server/package-import.ts`（导入：默认全关、回滚、连接处理）
- `server/package-export.ts`（导出：脱敏、计数）
- `server/bot-package.ts`（v1 Markdown 渲染：`renderBotPackageMarkdown`）
- `src/lib/team-import.ts`（客户端预览：`teamImportPreview`）
- `docs/team-sharing.md`（什么进文件、什么永不进文件、导入规则）
- `shared/package-fixtures/legacy-botmrr.v1.md`（v1 Markdown 格式范例）
