import { z } from "zod/mini"

import { ChatItemDto, SendMessageRequest } from "@/lib/data/staff/schemas"
import { ok, readBody, staffRoute } from "@/server/http/handler"
import { getMessages, sendMessage } from "@/server/staff/messages"

export const GET = staffRoute(async ({ staffId }) =>
  ok(z.array(ChatItemDto), await getMessages(staffId, new Date())),
)

export const POST = staffRoute(async ({ req, staffId }) => {
  const { text } = await readBody(req, SendMessageRequest)
  return ok(ChatItemDto, await sendMessage(staffId, text.trim()), 201)
})
