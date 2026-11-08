# 钩子示例：供应商发来新报价单

场景：供应商发来新报价单邮件，Bot 先核对，再请采购负责人拍板，决定记进场景记忆。

## 触发器定义（对话里 `trigger` 工具的入参，或 Triggers 页 REST body）

```json
{
  "name": "供应商新报价单",
  "instructions": "收到供应商的新报价单后，先核对，再把结果发给采购负责人拍板。",
  "app": "gmail",
  "event": "GMAIL_NEW_GMAIL_MESSAGE",
  "filter": { "subject": "报价单" },
  "morde": {
    "verify": "核对报价单上的 SKU、单价、数量与上次报价是否一致；单价涨幅超过 5% 的标出来",
    "approver": "采购负责人",
    "decisionLog": "decisions.md"
  }
}
```

四要素：

- **何时触发**：Gmail 收到主题含“报价单”的新邮件（`event` + `filter` + `instructions`）。
- **验证什么**：核对 SKU、单价、数量与上次报价；涨幅超 5% 标出。
- **谁批准**：采购负责人。
- **决定记在哪**：该 Bot 记忆里的 `decisions.md`。

## 触发后

1. 事件到了，run 的 prompt 里多一段：

   ```
   [MORDE HOOK]
   触发：供应商新报价单
   验证：核对报价单上的 SKU、单价、数量与上次报价是否一致；单价涨幅超过 5% 的标出来
   批准人：采购负责人
   决定记在：decisions.md
   先按“验证”核对事件，再行动；需要批准的决定先问批准人，不要自己放行。
   [/MORDE HOOK]
   ```

2. 对话里跳出的 run 卡片带上 `morde` 四要素；没有卡片 UI 的客户端在
   fallback 文本里同样看到“验证 / 批准人 / 决定记在”三行。

3. 采购负责人点批准后，`decisions.md` 里多一行：

   ```
   [2026-11-09] 批准：<当时问的事，如 to use COMPOSIO_…>
   ```

   搁置 / 降级见 `docs/morde-hook-four-elements.md` 的诚实说明：
   上游审批卡只有批准 / 拒绝 / 答复三种行为，搁置与降级目前是人在答复里写明、
   原文记入决定日志，没有独立按钮。
