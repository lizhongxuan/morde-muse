# T09 — 离岗开发模板：输出契约与合门

> 状态：T09 完成。场景包 `examples/scene-packs/dev-away-from-desk.md` release 1.1.0。
> 角色、routine 结构与 T06 保持不变；deploy-watch routine 仍为暂停态
> （`enabledAfterInstall: false`）。

## 模板改了什么

相对 T06 的 1.0.0（只有“写卡片”的要求），1.1.0 补齐了强制的输出契约
与合门：

1. **输出契约**（写进 `incident-triage` 与 `pr-triage` 两份 playbook 的
   frontmatter 与正文）：每次分流输出必须包含 (a) 一份可应用的 diff
   （`.patch` 文件，`git apply --check` 能过）；(b) 一份测试证据（跑过的
   测试命令、退出码、关键输出原文）。没有这两样，分流卡无效，审查员必须
   打回。
2. **合门规则**（写进 Mission、`pr-triage` 与 Outcomes）：没有审批记录
   （approver + 决定 + 时间）的文件一律不合并；未审批的 diff 无论多小
   都不进主分支。
3. **新技能 `diff-evidence`**（`skills.entries`，格式照抄已有的
   `incident-evidence`，triage 角色引用）：如何产 diff、跑测试、引用证据
   原文。只加了技能与引用，未改 T06 的角色与 routine 结构。
4. **校验**：升级后的文件通过 `scripts/morde-verify-scene-pack.ts`，
   上游解析器输出 agents `triage`/`reviewer`、rooms `incidents`、
   playbooks `incident-triage`/`pr-triage`、routines `deploy-watch`、
   skills `incident-evidence`/`diff-evidence`。未加 package 格式之外的
   自定义字段（见 `docs/morde-scene-pack-mapping.md` §4）。

## 分流输出校验脚本

`scripts/morde-verify-triage-output.ts`，用法：

```sh
node --experimental-strip-types scripts/morde-verify-triage-output.ts <输出目录> [--repo <目标仓库>]
```

输入一个分流输出目录，检查：(a) 目录里有 `.patch` 且对 `--repo`
（默认当前目录）`git apply --check` 通过；(b) 有 `test-evidence.md`，
含测试命令（`$ ` 开头的行）、退出码 0、引用的输出原文（有内容的代码块）；
(c) 有 `approval.md`（含 `approver` / `decision` / `time` 三项，
`decision: approve`）则标“可合并”，没有或决定不是 approve 则标
“未审批，不可合并”。

退出码：0 可合并；1 是 patch 或证据无效；2 是输出有效但未审批（合门拦截）。
四个分支都已实测（见下）。

## 这次验收跑的真实故障

仓库：morde-muse 本仓，HEAD `30830b29a`（T04）。故障是真实复现的，不是
编造的：

**`scripts/morde-verify-scene-pack.ts` 在输入文件不可读时直接抛未捕获
异常**：`readFileSync(path, "utf8")` 在 try/catch 之外（try 只包住了
`parsePackageDocument`），传一个不存在的文件就打出原始 Node 堆栈而不是
脚本自己的报错。复现命令与原文见分流卡。

修复（只在 /tmp 工作区，不在 main 里）：把读文件包进 try/catch，不可读时
打印 `cannot read file: <path> (<原因>)`，退出 1。

## diff 与证据放在哪里

分流工作区：`/tmp/morde-triage-run`（`git worktree`，detached HEAD
`30830b29a`；没用新 clone——/tmp 是 512 MB tmpfs，完整 clone 塞不下）。

- 分流卡：`/tmp/morde-triage-run/output/triage-card.md`
- diff：`/tmp/morde-triage-run/output/fix.patch`（只改
  `scripts/morde-verify-scene-pack.ts`，+6/−1 行）
- 测试证据：`/tmp/morde-triage-run/output/test-evidence.md`（另有
  `before-fix.log` / `after-fix-*.log` 原始日志）
- patch 校验用的干净目标树：`/tmp/patch-check`（仅含 HEAD 原版的
  `scripts/morde-verify-scene-pack.ts` 一个文件）

测试证据（全部真实跑出来的输出，见 `test-evidence.md` 原文）：

- 修前，不存在的文件：退出 1，原始堆栈（`Error: ENOENT ...`，见分流卡引文）。
- 修后，不存在的文件：`cannot read file: /tmp/does-not-exist.md (ENOENT:
  no such file or directory, open '/tmp/does-not-exist.md')`，退出 1。
- 修后，目录路径：`cannot read file: /tmp (EISDIR: illegal operation on a
  directory, read)`，退出 1。
- 修后，有效场景包：退出 0，JSON 输出与修前一致（回归检查；worktree 是
  T09 之前的状态，所以 release 显示 1.0.0，1.1.0 的校验在主仓单独跑过）。
- 三项断言合在一个命令里：`ALL CHECKS PASSED`，退出码 0。

## 校验脚本对这次分流输出的判定

```sh
$ node --experimental-strip-types scripts/morde-verify-triage-output.ts /tmp/morde-triage-run/output --repo /tmp/patch-check
patch: fix.patch — git apply --check passed against /tmp/patch-check
evidence: test-evidence.md — command found, exit code 0, quoted output present
approval: missing — 未审批，不可合并
```

退出码 2。patch 有效、证据有效，合门正确拦截：没有审批记录，所以不可
合并。脚本其余分支在 `/tmp` 的临时副本上验证过（不影响本次分流输出）：
`approval.md` 写 `decision: approve` 时退出 0（可合并），写 `decision:
block` 时退出 2，损坏的 patch 退出 1。

## 为什么没合并

分流卡上没有审批记录（approver / decision / time 均为空，待用户填）。
按 T09 合门规则，这个 diff 只留在 `/tmp/morde-triage-run/output/fix.patch`
里，没有合进 main，也没有放进本次 T09 提交。用户审批通过后，再由用户
（或用户指定的人）决定是否应用。

## 诚实说明

这次分流是 agent（我）按升级后的 playbook 在 /tmp 工作区里手动执行的，
不是服务器上的 Bot 跑的：服务器上的 MausBot 服务与配对尚未就绪（T05 未
完成），且 T09 的验收只要求“在一个真实仓库上跑一次”，没要求必须由 Bot
跑。模板本身是给 Bot 用的同一套契约与合门，脚本与分流卡格式可直接复用。

另外，跑校验脚本需要 `yaml` / `zod` / `croner` 三个包：本机主仓没有
`node_modules`，验收时把它们装到了 `/tmp/yaml-pkg`，再软链进主仓与
worktree 各自 gitignored 的 `node_modules/` 里——这只是本地跑通校验的
手段，不是仓库改动，不在提交里。
