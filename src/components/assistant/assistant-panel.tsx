"use client";

import "./assistant-panel.css";
import { useTranslation } from "@/components/i18n/language-provider";
import { getQuickPromptKeys } from "@/lib/ai/assistant-replies";
import type { AssistantMessage } from "@/lib/ai/assistant-replies";
import { loadBoardTasks, saveBoardTasks } from "@/lib/boards/storage";
import type { BoardTask } from "@/lib/boards/types";
import { createTaskId } from "@/lib/boards/types";
import { recordActivitySession } from "@/lib/communication/storage";
import type { StoredProfessionId } from "@/lib/professions";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AssistantPanelProps = {
  userId: string;
  profession: StoredProfessionId | null;
};

type AssistantResponse = {
  reply?: string | null;
  error?: string;
  source?: "gemini" | "rules";
  geminiConfigured?: boolean;
  createdTask?: Omit<BoardTask, "updatedAt"> & { id?: string };
};

type HistoryMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdTask?: { id: string; title: string; stepCount?: number };
};

function formatHistoryMessage(
  message: HistoryMessage,
  t: (key: string, params?: Record<string, string>) => string,
): string {
  if (message.role === "assistant" && message.createdTask) {
    return t("assistant.boardCreated", {
      title: message.createdTask.title,
      count: String(message.createdTask.stepCount ?? ""),
    });
  }
  return message.content;
}

function AssistantSparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l1.2 4.2L17.5 8.5 13.2 9.7 12 14l-1.2-4.3L6.5 8.5l4.3-1.3L12 3Z"
        fill="currentColor"
      />
      <path
        d="M18 14l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}

export function AssistantPanel({ userId, profession }: AssistantPanelProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);
  const [lastSource, setLastSource] = useState<"gemini" | "rules" | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);

  const welcomeMessage = useCallback(
    (): AssistantMessage => ({
      role: "assistant",
      content: t("assistant.welcome"),
    }),
    [t],
  );

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);

    try {
      const [historyResponse, statusResponse] = await Promise.all([
        fetch("/api/ai/assistant/history"),
        fetch("/api/ai/assistant/status"),
      ]);

      if (statusResponse.ok) {
        const status = (await statusResponse.json()) as { geminiConfigured?: boolean };
        setGeminiConfigured(status.geminiConfigured ?? false);
      } else {
        setGeminiConfigured(false);
      }

      if (!historyResponse.ok) {
        setMessages([welcomeMessage()]);
        return;
      }

      const data = (await historyResponse.json()) as { messages?: HistoryMessage[] };
      const history = data.messages ?? [];

      if (history.length === 0) {
        setMessages([welcomeMessage()]);
        return;
      }

      setMessages(
        history.map((message) => ({
          role: message.role,
          content: formatHistoryMessage(message, t),
          createdTask: message.createdTask,
        })),
      );
    } catch {
      setMessages([welcomeMessage()]);
      setGeminiConfigured(false);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [welcomeMessage]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  async function clearHistory() {
    if (isSending) return;

    try {
      const response = await fetch("/api/ai/assistant/history", { method: "DELETE" });
      if (!response.ok) return;
      setMessages([welcomeMessage()]);
      setLastSource(null);
    } catch {
      // ignore
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending || isLoadingHistory) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setIsSending(true);
    recordActivitySession(userId);

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, profession }),
      });
      const data = (await response.json()) as AssistantResponse;

      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error ?? t("assistant.error") },
        ]);
        return;
      }

      if (typeof data.geminiConfigured === "boolean") {
        setGeminiConfigured(data.geminiConfigured);
      }
      if (data.source) {
        setLastSource(data.source);
      }

      if (data.createdTask) {
        const { id: createdTaskId, ...createdTaskFields } = data.createdTask;
        const task: BoardTask = {
          ...createdTaskFields,
          id: createdTaskId ?? createTaskId(),
          updatedAt: new Date().toISOString(),
        };
        const existing = loadBoardTasks(userId);
        saveBoardTasks(userId, [...existing, task]);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t("assistant.boardCreated", {
              title: task.title,
              count: String(task.steps.length),
            }),
            createdTask: { id: task.id, title: task.title },
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply ?? t("assistant.error"),
        },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t("assistant.error") }]);
    } finally {
      setIsSending(false);
    }
  }

  const statusLabel =
    geminiConfigured === null
      ? t("assistant.statusChecking")
      : geminiConfigured
        ? t("assistant.statusGemini")
        : t("assistant.statusFallback");

  return (
    <div className="assistant-panel">
      <section className="assistant-chat-card">
        <header className="assistant-chat-header">
          <div className="assistant-chat-header-icon">
            <AssistantSparkleIcon />
          </div>
          <div>
            <h2 className="assistant-chat-header-title">{t("nav.assistant")}</h2>
            <p className="assistant-chat-header-desc">{statusLabel}</p>
            {lastSource === "rules" && geminiConfigured === false && (
              <p className="assistant-chat-header-warning">{t("assistant.geminiMissing")}</p>
            )}
          </div>
        </header>

        <div className="assistant-messages" role="log" aria-live="polite">
          {isLoadingHistory ? (
            <p className="assistant-loading-history">{t("assistant.loadingHistory")}</p>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`assistant-message-row assistant-message-row-${message.role}`}
              >
                <span
                  className={`assistant-message-avatar assistant-message-avatar-${message.role}`}
                  aria-hidden
                >
                  {message.role === "assistant" ? "AI" : "You"}
                </span>
                <div className={`assistant-message assistant-message-${message.role}`}>
                  <p className="assistant-message-text">{message.content}</p>
                  {message.createdTask && (
                    <Link
                      href={`/dashboard/boards?task=${message.createdTask.id}`}
                      className="assistant-open-board-link"
                    >
                      {t("assistant.openBoard", { title: message.createdTask.title })}
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {isSending && (
          <div className="assistant-typing" aria-label={t("assistant.sending")}>
            <span className="assistant-message-avatar assistant-message-avatar-assistant" aria-hidden>
              AI
            </span>
            <div className="assistant-typing-dots" aria-hidden>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <p className="assistant-privacy-note">{t("assistant.privacyNote")}</p>

        <form
          className="assistant-compose"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
        >
          <input
            type="text"
            className="assistant-input"
            value={input}
            placeholder={t("assistant.inputPlaceholder")}
            disabled={isSending || isLoadingHistory}
            onChange={(event) => setInput(event.target.value)}
          />
          <button
            type="submit"
            className="dashboard-btn dashboard-btn-primary assistant-send-btn"
            disabled={isSending || isLoadingHistory}
          >
            {isSending ? t("assistant.sending") : t("assistant.send")}
          </button>
        </form>
      </section>

      <aside className="assistant-sidebar">
        <section className="dashboard-card assistant-sidebar-card">
          <h2 className="assistant-prompts-title">{t("assistant.quickPromptsTitle")}</h2>
          <div className="assistant-prompts">
            {getQuickPromptKeys().map((key) => (
              <button
                key={key}
                type="button"
                className="assistant-prompt-btn"
                disabled={isSending || isLoadingHistory}
                onClick={() => void sendMessage(t(key))}
              >
                {t(key)}
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-card assistant-sidebar-card">
          <p className="assistant-links-title">{t("assistant.memoryTitle")}</p>
          <p className="assistant-memory-desc">{t("assistant.memoryDesc")}</p>
          <button
            type="button"
            className="assistant-clear-history-btn"
            disabled={isSending || isLoadingHistory || messages.length <= 1}
            onClick={() => void clearHistory()}
          >
            {t("assistant.clearHistory")}
          </button>
        </section>

        <section className="dashboard-card assistant-sidebar-card">
          <p className="assistant-links-title">{t("assistant.relatedLinks")}</p>
          <ul className="assistant-links-list">
            <li>
              <Link href="/dashboard/communication">{t("nav.communication")}</Link>
            </li>
            <li>
              <Link href="/dashboard/boards">{t("nav.boards")}</Link>
            </li>
            <li>
              <Link href="/dashboard/help">{t("nav.help")}</Link>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
