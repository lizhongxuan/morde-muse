# morde-muse — fork baseline

> 项目名：morde-muse
> 底座：OpenMausBot（开源版 Muse），Apache License 2.0
> 目标：先让底座在用户自己的服务器上跑通，再在上面加 Morde / Muse 那一层
> （场景包、钩子、云电脑、中文连接器），不重写底座。

## 上游基线（clone 时的快照，2026-11-09）

- 上游仓库：https://github.com/milind-soni/OpenMausBot.git
- 上游 HEAD：`717343f2869d6179e21a301c3b5920953937e231`
  `Merge pull request #4902 from milind-soni/feat/diwali-mascots`
  日期：2026-11-08 21:13:44 +0530
- 上游版本：`package.json` version `0.1.149`（比阿里云服务器上已装的 0.1.148 新一个版本）
- 文件数：7,298 个文件，约 403M
- 语言/运行时：TypeScript，Node >= 24，pnpm 10.33.0，Electron 桌面 + 本地 harness server
- 许可证：主仓库 Apache-2.0；`enterprise/` 目录是另外的 source-available 许可证，**不要碰它**
- 上游 AGENTS.md 要求：声称服务端或对话改动生效前，先读 `docs/verification/README.md`；
  用隔离 fixture 验证，绝不在用户的 live 应用或数据上验证改动。

## 仓库结构（顶层）

| 目录/文件 | 作用 |
|---|---|
| `server/` | harness server：127.0.0.1:8799，拥有全部 agent 进程、事件总线、权限 broker |
| `src/` | 桌面应用前端（React + Tailwind，端口 5199） |
| `electron/` | Electron 壳 |
| `companion/` | 手机伴侣应用（MausBot，iOS / Android，扫码配对回电脑） |
| `shared/` | 前后端共享的 wire types |
| `skills/` | 上游技能（与 Muse 的技能同名不同实现，不要混淆） |
| `docs/` | 上游文档：自托管、部署、触发器、团队分享、审批、MCP 等 |
| `deploy/` | 部署：Caddyfile、docker-compose.yml、fly、local、podman |
| `enterprise/` | source-available，非 Apache，**不碰、不改、不打包** |
| `evals/` | 评估运行器 |
| `apps/` | 附加应用（docs 等） |

## 已知现状（2026-11-08，用户服务器上）

- 阿里云 ECS：4 vCPU / 8 GiB，Ubuntu 26.04，公网 IP 120.25.178.93，root
- 已装：Node v24.22.2、npm 11.19.1、OpenMausBot 0.1.148、agent-browser 0.37.0
- 服务曾以 `openmausbot serve --local --no-open --no-pair` 跑起来过，
  监听 127.0.0.1:8799，webhook 127.0.0.1:8800，0 台已配对设备
- **未完成**：无对外入口（无 tunnel / 域名 / Tailscale）、无 systemd 服务、
  无手机配对
- **阻塞**：OpenAI 从该大陆服务器连不通（`api.openai.com` 超时），
  GPT 密钥已配进 openai 引擎但调不到；DeepSeek / OpenRouter / Anthropic 能通。
  用户待选：DeepSeek 密钥 / 代理 / 换香港-新加坡服务器。

## Fork 规则

1. 只改 Morde 层，不改底座核心文件；上游更新时要能合进来。
2. 不碰 `enterprise/`；不改上游 LICENSE、NOTICE、CLA。
3. 每个小任务一个提交，提交信息写 `Txx: <做了什么>`，每完成一个任务
   就 push 一次（GitHub 连上后）。
4. 改动先在隔离环境验证，不在 live 服务器 / live 数据上验证。
5. 密钥、密码、token 永不进仓库；`.env`、密钥文件永不提交。

## 远程仓库（待用户明天连接 GitHub 后填）

- 目标仓库：`lizhongxuan/morde-muse`（待创建）
- 上游远程：`origin` 目前指向 milind-soni/OpenMausBot，**不要往上游 push**；
  建好目标仓库后，把 origin 改指 `lizhongxuan/morde-muse`，
  上游改名为 `upstream`，以便以后同步。
