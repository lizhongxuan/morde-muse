# Morde 钩子四要素

上游 OpenMausBot 的触发器（App Trigger）只有一句话指令（`prompt`）：事件到了，
按指令跑一次。本文件给触发器加一个可选的 Morde 扩展 `morde`，补齐钩子缺的三要素。
“何时触发”本身就是触发器（`prompt` + 事件 + `runOn`），不用另加字段。

## 四要素与字段对应

| Morde 四要素 | 字段 | 说明 |
|---|---|---|
| 何时触发 | `prompt` + `event` + `runOn` | 上游已有，不改 |
| 验证什么 | `morde.verify` | 事件到了先核对什么，再行动 |
| 谁批准 | `morde.approver` | 需要拍板的决定问谁（一个人，不是 Bot） |
| 决定记在哪 | `morde.decisionLog` | Bot 记忆主题名，如 `decisions.md` |

`morde` 全部可选；不带它的触发器就是普通上游触发器，行为一点不变。

## 链路

1. **创建/修改**：对话里的 `trigger` 工具（`AppTriggerDefinition.morde`）、
   Triggers 页 REST（`POST /api/app-triggers`、`PATCH /api/app-triggers/:id`）
   都直通 `AppTriggerManager.create/update`，存进 `app-triggers.json`。
   空字段会被去掉；`PATCH` 传 `morde: null` 清掉钩子。
2. **触发**：事件到了，`AppTriggerManager` 把四要素拼进 run 的 prompt
   （`server/morde-hook.ts` 的 `mordeHookBlock`），run 本身也带上 `morde`。
3. **卡片**：run 卡片（`RoutineRunCardData.morde`）带上四要素；没有卡片 UI 的
   客户端读 fallback 文本，里面同样列出验证、批准人、决定记录位置。
4. **决定写回**：run 等人拍板时（`request.opened`），人一点批准，`request.resolved`
   到达后 `RoutineManager` 调 `recordDecision`，把一行决定写进该 Bot 记忆里
   `decisionLog` 指定的主题（`server/index.ts` 接线）。
   决定行格式：`[2026-11-09] 批准：<当时问的事>`。

## 批准 / 搁置 / 降级——诚实说明

上游审批卡只有三种行为：`allow`（批准）、`deny`（拒绝）、`answer`（答复）。
本次没有新增“搁置 / 降级”按钮：

- **批准** = 点 `allow`，决定行写“批准”。
- **搁置** = 人不回答（run 继续等，超时按上游规则处理）或取消 run；
  也可以在答复里写“先搁置”，这句话会作为答复内容记进决定日志。
- **降级** = 人在答复里写明降级处理（如“只比价，不下单”），
  决定日志记的是这次答复本身，不是单独的降级按钮。

要把搁置 / 降级做成卡片上的独立按钮，是下一步的工作，不在本任务里。

## 已知局限

- 卡片 fallback 文本里的“验证 / 批准人 / 决定记在”三个标签目前是中文写死的，
  没走上游 `serverLine` 国际化；钩子内容本身是用户写的中文，不受影响。
- 决定只在“人回答了 run 的提问”时写回；超时无人回答不写（没有决定可记）。
- `decisionLog` 必须是合法的记忆主题名，否则跳过写回，不让 run 出错。

## 示例

`examples/scene-packs/supplier-quote-hook.md`：供应商发来新报价单。
