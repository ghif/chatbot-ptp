import { NextRequest, NextResponse } from "next/server";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

import * as ChatbotPeraturan from "@/lib/chatbot-peraturan";
import * as ChatbotPengetahuan from "@/lib/chatbot-pengetahuan";

export async function POST(request) {
  try {
    const data = await request.json();
    const prompt = data?.prompt;
    const modelType = data?.modelType;

    if (!prompt || !modelType) {
      return NextResponse.json(
        {
          code: StatusCodes.BAD_REQUEST,
          status: ReasonPhrases.BAD_REQUEST,
          errors: {
            message: "Prompt or modelType cannot be empty!",
          },
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    (async () => {
      try {
        let result;
        if (modelType === "peraturan") {
          result = await ChatbotPeraturan.ask(prompt, {
            onStream: async (chunk) => {
              await writer.write(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
              );
            },
          });
        } else if (modelType === "pengetahuan") {
          result = await ChatbotPengetahuan.ask(prompt, {
            onStream: async (chunk) => {
              await writer.write(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
              );
            },
          });
        }

        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              sourceDocuments: result.sourceDocuments,
            })}\n\n`
          )
        );
      } catch (error) {
        console.error("Streaming error:", error);
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              error: true,
              message: error.message,
            })}\n\n`
          )
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        code: StatusCodes.BAD_REQUEST,
        status: ReasonPhrases.BAD_REQUEST,
        errors: {
          message: "Bad request!",
          reason: error.message,
        },
      },
      { status: StatusCodes.BAD_REQUEST }
    );
  }
}
