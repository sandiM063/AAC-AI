import { parseBoardFromPrompt, shouldCreateBoard } from "@/lib/ai/create-board-from-prompt";
import { generateAssistantReply } from "@/lib/ai/assistant-replies";
import {
  getConversationContext,
  rememberAssistantExchange,
} from "@/lib/ai/assistant-memory/storage";
import { processAssistantMessage } from "@/lib/ai/gemini/assistant";
import { isGeminiConfigured } from "@/lib/ai/gemini/config";
import { createTaskId } from "@/lib/boards/types";
import { isStepGenerationError } from "@/lib/ai/step-generation-error";
import {
  buildTaskStepsFromTitles,
  getDetailLevel,
  summarizeTaskSteps,
  validateStepTitlesForCount,
} from "@/lib/ai/summarize-task-steps";
import type { StoredProfessionId } from "@/lib/professions";
import { getCurrentUser } from "@/lib/user-session";
import { assistantChatSchema } from "@/lib/validations/assistant";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = assistantChatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const { message, profession } = parsed.data;
    const professionValue = (profession ?? user.profession) as StoredProfessionId | null;

    const { history, ragContext } = await getConversationContext(user.id, message);
    const usedGemini = isGeminiConfigured();

    if (usedGemini) {
      const geminiResult = await processAssistantMessage(message, professionValue, {
        history,
        ragContext,
      });

      if (geminiResult?.kind === "board") {
        const { board } = geminiResult;
        let validatedTitles: string[];
        try {
          validatedTitles = validateStepTitlesForCount(board.stepTitles, board.stepCount);
        } catch (error) {
          if (isStepGenerationError(error)) {
            const reply =
              error.code === "insufficient_detail"
                ? "Sorry — I need more detail about that routine before I can build a board. Describe each step on its own line, or ask for fewer steps."
                : `Sorry — that task doesn't break down cleanly into ${error.requestedStepCount} steps. It naturally has about ${error.naturalStepCount}. Try fewer steps or add more detail.`;

            await rememberAssistantExchange({
              userId: user.id,
              userMessage: message,
              assistantMessage: reply,
              source: "gemini",
            });

            return NextResponse.json({ reply, source: "gemini" });
          }
          throw error;
        }

        const detailLevel = getDetailLevel(validatedTitles.length);
        const steps = await buildTaskStepsFromTitles(validatedTitles, detailLevel);
        const taskId = createTaskId();
        const assistantContent = `Created "${board.taskTitle}" with ${steps.length} symbol steps.`;

        await rememberAssistantExchange({
          userId: user.id,
          userMessage: message,
          assistantMessage: assistantContent,
          source: "gemini",
          createdTask: { id: taskId, title: board.taskTitle, stepCount: steps.length },
        });

        return NextResponse.json({
          reply: null,
          source: "gemini",
          createdTask: {
            id: taskId,
            title: board.taskTitle,
            description: board.taskDescription,
            steps,
            stepCount: steps.length,
            detailLevel,
            completedStepIds: [] as string[],
          },
        });
      }

      if (geminiResult?.kind === "chat") {
        await rememberAssistantExchange({
          userId: user.id,
          userMessage: message,
          assistantMessage: geminiResult.reply,
          source: "gemini",
        });

        return NextResponse.json({ reply: geminiResult.reply, source: "gemini" });
      }
    }

    if (shouldCreateBoard(message)) {
      const { taskTitle, taskDescription, stepCount } = parseBoardFromPrompt(message);

      let steps;
      try {
        steps = await summarizeTaskSteps({ taskTitle, taskDescription, stepCount });
      } catch (error) {
        if (isStepGenerationError(error)) {
          const reply =
            error.code === "insufficient_detail"
              ? "Sorry — I need more detail about that routine before I can build a board. Describe each step on its own line, or ask for fewer steps."
              : `Sorry — that task doesn't break down cleanly into ${error.requestedStepCount} steps. It naturally has about ${error.naturalStepCount}. Try fewer steps or add more detail.`;

          await rememberAssistantExchange({
            userId: user.id,
            userMessage: message,
            assistantMessage: reply,
            source: "rules",
          });

          return NextResponse.json({ reply, source: "rules", geminiConfigured: usedGemini });
        }
        throw error;
      }

      const detailLevel = getDetailLevel(steps.length);
      const taskId = createTaskId();
      const assistantContent = `Created "${taskTitle}" with ${steps.length} symbol steps.`;

      await rememberAssistantExchange({
        userId: user.id,
        userMessage: message,
        assistantMessage: assistantContent,
        source: "rules",
        createdTask: { id: taskId, title: taskTitle, stepCount: steps.length },
      });

      return NextResponse.json({
        reply: null,
        source: "rules",
        geminiConfigured: usedGemini,
        createdTask: {
          id: taskId,
          title: taskTitle,
          description: taskDescription,
          steps,
          stepCount: steps.length,
          detailLevel,
          completedStepIds: [] as string[],
        },
      });
    }

    const reply = generateAssistantReply(message, professionValue);

    await rememberAssistantExchange({
      userId: user.id,
      userMessage: message,
      assistantMessage: reply,
      source: "rules",
    });

    return NextResponse.json({
      reply,
      source: "rules",
      geminiConfigured: usedGemini,
    });
  } catch {
    return NextResponse.json({ error: "Unable to process message" }, { status: 500 });
  }
}
