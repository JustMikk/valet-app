import { z } from "zod/mini"

import { api, setSession } from "../api-client"
import type { StaffRepo } from "./repo"
import {
  ChatItemDto,
  ClaimResultDto,
  ClockCheckDto,
  ClockPunchDto,
  ClockRequestDto,
  DropResultDto,
  HomeDto,
  NotificationsDto,
  OpenShiftDto,
  SessionDto,
  ShiftCardDto,
  ShiftDetailDto,
  StaffProfileDto,
} from "./schemas"

const Ack = z.object({})

export const httpStaffRepo: StaffRepo = {
  async requestCode(email) {
    await api("auth/request-code", Ack, { method: "POST", body: { email }, auth: false })
  },
  async verifyCode(email, code) {
    const session = await api("auth/verify", SessionDto, {
      method: "POST",
      body: { email, code },
      auth: false,
    })
    setSession(session)
    return session
  },

  me: () => api("staff/me", StaffProfileDto),
  updateMe: (patch) => api("staff/me", StaffProfileDto, { method: "PATCH", body: patch }),

  home: () => api("staff/home", HomeDto),
  shifts: (tab) => api(`staff/shifts?tab=${tab}`, z.array(ShiftCardDto)),
  shift: (id) => api(`staff/shifts/${id ?? "next"}`, ShiftDetailDto),
  drop: (id, input) =>
    api(`staff/shifts/${id}/drop`, DropResultDto, { method: "POST", body: input }),
  openShifts: () => api("staff/open-shifts", z.array(OpenShiftDto)),
  claim: (id) => api(`staff/open-shifts/${id}/claim`, ClaimResultDto, { method: "POST" }),

  clockCheck: (req) => api("staff/clock/check", ClockCheckDto, { method: "POST", body: req }),
  clockIn: (req) => api("staff/clock/in", ClockPunchDto, { method: "POST", body: req }),
  clockOut: (req) => api("staff/clock/out", ClockPunchDto, { method: "POST", body: req }),
  clockRequest: (punchId) => api(`staff/clock/requests/${punchId}`, ClockRequestDto),
  async demoApprove(punchId) {
    await api("demo/approve", z.object({ approved: z.boolean() }), {
      method: "POST",
      body: { punchId },
    })
  },

  messages: () => api("staff/messages", z.array(ChatItemDto)),
  sendMessage: (text) => api("staff/messages", ChatItemDto, { method: "POST", body: { text } }),
  notifications: () => api("staff/notifications", NotificationsDto),
  async markNotificationsRead() {
    await api("staff/notifications/read", Ack, { method: "POST" })
  },
}
