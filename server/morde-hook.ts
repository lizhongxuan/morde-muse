// Morde hook four elements: the text a hook run carries, and the decision line
// written back when the person answers its approval.
import type { MordeHook } from "../shared/app-triggers.ts";
import type { RoutineRunAsk } from "./routine-waits.ts";

/** The four elements as the run's instructions see them, after the event block. */
export function mordeHookBlock(hook: MordeHook, triggerName: string): string {
  const lines = [
    "[MORDE HOOK]",
    `触发：${triggerName}`,
    ...(hook.verify ? [`验证：${hook.verify}`] : []),
    ...(hook.approver ? [`批准人：${hook.approver}`] : []),
    ...(hook.decisionLog ? [`决定记在：${hook.decisionLog}`] : []),
    "先按“验证”核对事件，再行动；需要批准的决定先问批准人，不要自己放行。",
    "[/MORDE HOOK]",
  ];
  return lines.join("\n");
}

const BEHAVIOR_WORD: Record<string, string> = { allow: "批准", deny: "拒绝", answer: "已答复" };

/** One dated line for the hook's decision log: what the person decided, and on what. */
export function mordeDecisionLine(ask: RoutineRunAsk, behavior: string, now: number): string {
  const word = BEHAVIOR_WORD[behavior] ?? behavior;
  const day = new Date(now).toISOString().slice(0, 10);
  return `[${day}] ${word}：${ask.subject}`;
}
