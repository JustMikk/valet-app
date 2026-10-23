import { httpAdminRepo } from "./admin/http-repo"
import { mockAdminRepo } from "./admin/mock-repo"
import type { AdminRepo } from "./admin/repo"
import { httpStaffRepo } from "./staff/http-repo"
import { mockStaffRepo } from "./staff/mock-repo"
import type { StaffRepo } from "./staff/repo"

export { ApiError, clearSession } from "./api-client"
export type { AdminRepo } from "./admin/repo"
export type { StaffRepo } from "./staff/repo"
export * from "./admin/schemas"
export * from "./admin/ops-schemas"
export * from "./staff/schemas"

/**
 * The data source is a build-time choice (next.config.ts): the server build talks to the demo
 * API, the static export serves the in-memory fixtures.
 */
export const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? "api" : "mock"

export const staffRepo: StaffRepo = DATA_SOURCE === "api" ? httpStaffRepo : mockStaffRepo
export const adminRepo: AdminRepo = DATA_SOURCE === "api" ? httpAdminRepo : mockAdminRepo
