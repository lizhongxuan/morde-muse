# T04 — systemd 常驻 + 备份

> 2026-11-09 完成并验收通过。服务器：阿里云 ECS（root）。

## 服务

用上游自带命令生成 unit，不手写：

```bash
openmausbot service install --lan --port 8799 --no-open --no-pair
install -m 644 /root/.openmausbot/openmausbot.service /etc/systemd/system/openmausbot.service
systemctl daemon-reload
systemctl enable --now openmausbot
```

- unit：`/etc/systemd/system/openmausbot.service`（生成稿在 `/root/.openmausbot/openmausbot.service`）
- 以 root 运行，数据目录不变：`/root/.openmausbot`（`OMB_DATA_DIR`）
- `Restart=always`，`RestartSec=3`；开机自启
- 启动命令：`node /usr/bin/openmausbot serve --port 8799 --data-dir /root/.openmausbot --lan`

## 常用命令

```bash
systemctl status openmausbot        # 状态
systemctl restart openmausbot       # 重启
journalctl -u openmausbot -f        # 看日志
openmausbot status                  # 服务是否在跑、在哪个地址
openmausbot doctor                  # 服务 + 引擎是否就绪
```

改参数：重新跑 `openmausbot service install …`，再
`systemctl daemon-reload && systemctl restart openmausbot`。

注意：不要再用 `nohup openmausbot serve` 手动起服务，会抢 8799 端口。
旧的 nohup 进程已停掉，全部改由 systemd 接管。

## 备份

- 脚本：`/root/omb-backup.sh`；备份目录：`/root/backups/`（tar.gz，约 6MB）
- 定时：每天 03:00（root 的 crontab），只留最近 7 份
- 恢复：

```bash
systemctl stop openmausbot
tar xzf /root/backups/openmausbot-<日期>-<时间>.tgz -C /root/.openmausbot
systemctl start openmausbot
```

说明：备份时服务在跑，拷贝的是 live 数据；sqlite 打开时会重放 WAL，
恢复后以 `openmausbot bots` 和 `openmausbot doctor` 为准。

## 验收（2026-11-09）

- `systemctl restart openmausbot` 后服务恢复：`is-active` = active，
  本地 8799 返回 HTTP 200
- 重启前后 Bot 一致：DeepSeek测试（ea9def42…）、MausBot（8412c2cf…），
  `messages.db` 未动
- `openmausbot doctor`：ready，引擎 deepseek、openai 可用，浏览器 0.37.0
