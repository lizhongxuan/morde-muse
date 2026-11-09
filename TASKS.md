# morde-muse — 小任务清单

> 规则：每个任务一个提交，提交信息 `Txx: <做了什么>`；
> 每完成一个任务就 git push 一次；验收标准写在每个任务下面，
> 没通过验收不 push。
> GitHub 由用户明天连接后创建 `lizhongxuan/morde-muse`，
> 在此之前只做本地提交，不 push。

## M0 — 跑通（先让底座能用）

- [x] **T01 — Fork 基线**：clone 上游，记录 HEAD / 版本 / 结构，写 `MORDE-MUSE.md` 与本清单。
  验收：`git log -1` 为 717343f；`package.json` version 为 0.1.149；两个文件在仓库里。
- [x] **T02 — 模型通路**：用户选了 DeepSeek 密钥（2026-11-09）。服务器上装了 dsh 0.2.2-rc.1，key 进 config.json（deepseek.key）与 ~/.dsh/.env；主力模型 deepseek-v4-flash（dsh 默认），复杂任务用 deepseek-v4-pro；测试 Bot「DeepSeek测试」已用真实模型回话。
  验收：服务器上一个 Bot 用真实模型回了一句非模板的话；`openmausbot engine list` 显示该引擎 available。
- [x] **T03 — 对外入口**：用户先选 Tailscale（2026-11-09），后改口要直接 IP（同日 14:26）。Tailscale 路已打通并验证过：服务器入 tailnet（100.97.162.110，MagicDNS izwz92wfo1uo0qwrn04v45z.tail4f0878.ts.net），`serve --tailscale`（443）被服务器上 Morde cloudhost 的 Caddy（cloudhost-caddy-1，host 网络占 443）挡住，改走手动 `tailscale serve --bg --https=8443 → 127.0.0.1:8799`，tailnet 内返回 200；证书曾因阿里内网 DNS 解析不了 Let's Encrypt 失败，补了 AliDNS（223.5.5.5/223.6.6.6）到 systemd-resolved 才拿到证。后按用户要求改走直接 IP：撤掉 8443 转发，serve 改 `--lan`（8799 绑 0.0.0.0，8800 仍只绑 127.0.0.1）。**待用户在阿里云控制台安全组放行 TCP 8799**——外网 curl 公网 IP 8799 仍超时，说明安全组未放行。注意：放行后 8799 对全网开放，任何人扫到 IP 都能连上 MausBot 服务。
  验收：手机浏览器能打开配对页；`curl` 外网扫 8799/8800 不通（直连 IP 方案下改为 8799 能通、8800 不通）。手机端打开配对页待 T05 验证。
- [x] **T04 — systemd 常驻**：写 systemd unit，重启后服务自动起来，数据目录 `~/.openmausbot` 单独备份。
  完成 2026-11-09：用上游 `openmausbot service install --lan --port 8799` 生成 unit（`Restart=always`，开机自启，root 运行，数据目录不变）；旧 nohup 进程已停，改由 systemd 接管；备份脚本 `/root/omb-backup.sh` 每天 03:00 跑，留最近 7 份。详见 `docs/morde-t04-systemd.md`。
  验收：`systemctl restart` 后服务恢复；重启后 Bot 与历史仍在。
- [ ] **T05 — 手机配对**：用户在 iOS 上装 MausBot，扫码配对，手机上能发消息、看进度、点审批。
  验收：手机发一句话，Bot 回了；手机上点一次审批，服务端状态变了。
  —— M0 完成标准：手机关电脑后任务仍在服务器上跑（T02–T05 全过）。

## M1 — 场景包（1–2 周）

- [x] **T06 — 场景包格式**：把 Morde 的 `scene.yaml + playbook.md + rules.md + memory/ + hooks/`
  映射到 OpenMausBot 的 team file（一份 Markdown + YAML frontmatter），写映射文档。
  验收：一个场景包能导入，Bot、频道、playbook、连接清单都建出来了。
- [x] **T07 — 导入默认全关**：导入时连接默认关、routine 暂停、技能关、密钥与电脑选择不携带，
  导入前有复核屏，显示文件里有什么。
  验收：导入一个含密钥字样的 team file，密钥没被带进来；复核屏列出的内容与文件一致。
- [x] **T08 — 钩子四要素**：钩子加上“何时触发 / 验证什么 / 谁批准 / 决定记在哪”，
  触发后在对话里跳出 agent 卡，可批准、可搁置、可降级。
  验收：写一个“供应商发来新报价单”钩子，触发后卡片出现，点批准后决定写回场景记忆。

## 工程基建

- [x] **T13 — Git 钩子**：commit-msg 校验 `Txx: ` 格式（放行 Merge/Revert）；pre-commit 扫描暂存区密钥并对暂存 JS/TS 跑 oxlint（无依赖时警告放行）；pre-push 拦住往上游 milind-soni/OpenMausBot 的 push。
  验收：三道钩子都在 `scripts/git-hooks/`、可执行、临时仓库验证通过、往上游的 push 被拦住。

## M2 — 两个模板（2–4 周）

- [ ] **T09 — 离岗开发模板**：故障 + PR 分流 agent，输出永远是可验证的 diff + 测试证据，
  审批通过前不合并。
  验收：在一个真实仓库上跑一次，输出 diff 与测试证据，审批后才合并。
- [ ] **T10 — 带货模板**：一档直播一个文件（商品卡、分镜脚本、合规 flag、每 SKU 复盘自动附上）。
  验收：给一个商品，产出一份完整直播文件，合规 flag 能标出绝对化用语。

## M3 — 中文连接器（每个约 1 周，只做有官方 API 的）

- [ ] **T11 — 钉钉 / 飞书（二选一，先做一个）**：官方 API 接入，Bot 能收发、能建任务。
  验收：用官方 API 发一条真实消息并收到回执；个人微信、抖音卖家后台无官方 API，不做。
- [ ] **T12 — 微信公众号（官方账号）**：官方 API 接入，只读/只发已授权的内容。
  验收：同 T11；个人微信不做。

## 不做清单

- 不重写聊天 UI、agent 运行时、审批卡、触发器、iOS 应用（用上游的）。
- 不做多用户、计费、云手机。
- 不碰 `enterprise/`。
- 不把模拟数据说成真实结果；不上报“已完成”直到用户手机上真的看到了。
