// Route handler plumbing: one place for auth, body validation, response validation and error
// mapping, so route files stay a few lines each (handoff §5.3: thin routes).
import { z } from "zod/mini"

import { verifyToken } from "../auth/token"

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export const badRequest = (message: string, code = "bad_request") =>
  new ApiError(400, code, message)
export const unauthorized = (message = "Sign in to continue.") =>
  new ApiError(401, "unauthorized", message)
export const notFound = (message = "Not found.") => new ApiError(404, "not_found", message)
export const conflict = (code: string, message: string) => new ApiError(409, code, message)

type Params = Record<string, string>
type RouteContext<P extends Params> = { params: Promise<P> }
type Args<P extends Params> = { req: Request; params: P }

function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    )
  }
  console.error("Unhandled API error", error)
  return Response.json(
    { error: { code: "server_error", message: "Something went wrong. Try again." } },
    { status: 500 },
  )
}

/** Public route: errors become `{ error: { code, message } }` with the right status. */
export function route<P extends Params = Params>(handler: (args: Args<P>) => Promise<Response>) {
  return async (req: Request, ctx: RouteContext<P>): Promise<Response> => {
    try {
      return await handler({ req, params: await ctx.params })
    } catch (error) {
      return errorResponse(error)
    }
  }
}

/** Authenticated staff route: the Bearer token must be valid; `staffId` comes only from it. */
export function staffRoute<P extends Params = Params>(
  handler: (args: Args<P> & { staffId: string }) => Promise<Response>,
) {
  return route<P>(async (args) => {
    const header = args.req.headers.get("authorization") ?? ""
    const staffId = header.startsWith("Bearer ") ? verifyToken(header.slice(7)) : null
    if (!staffId) throw unauthorized()
    return handler({ ...args, staffId })
  })
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** A path id must be a UUID; anything else is simply not found (never a database cast error). */
export function readId(value: string | undefined): string {
  if (!value || !UUID.test(value)) throw notFound()
  return value
}

/** Parses and validates a JSON body; a missing or malformed body is a 400, never a crash. */
export async function readBody<S extends z.ZodMiniType>(
  req: Request,
  schema: S,
): Promise<z.output<S>> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    throw badRequest("Send a JSON body.")
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".") || "body").join(", ")
    throw badRequest(`Invalid request: ${fields}.`, "invalid_request")
  }
  return parsed.data
}

/** Reads one query parameter through a schema (for example `?tab=past`). */
export function readQuery<S extends z.ZodMiniType>(
  req: Request,
  name: string,
  schema: S,
): z.output<S> {
  const parsed = schema.safeParse(new URL(req.url).searchParams.get(name) ?? undefined)
  if (!parsed.success) throw badRequest(`Invalid query parameter: ${name}.`, "invalid_request")
  return parsed.data
}

/** JSON response checked against the shared DTO schema, so wire drift fails loudly on the server. */
export function ok<S extends z.ZodMiniType>(schema: S, value: z.input<S>, status = 200): Response {
  return Response.json(schema.parse(value), { status })
}
