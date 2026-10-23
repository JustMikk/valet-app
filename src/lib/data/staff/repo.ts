// The staff app's data boundary (handoff §6): screens depend on this interface only. The HTTP
// implementation talks to the Next.js demo API; the mock one serves the design's fixtures in the
// static export. Swapping the real backend in later changes neither screens nor DTOs.
import type {
  ChatItem,
  ClaimResult,
  ClockCheck,
  ClockCheckRequest,
  ClockPunch,
  ClockPunchRequest,
  ClockRequestStatus,
  DropRequest,
  DropResult,
  Home,
  Notifications,
  OpenShift,
  ProfilePatch,
  Session,
  ShiftCard,
  ShiftDetail,
  ShiftTab,
  StaffProfile,
} from "./schemas"

export interface StaffRepo {
  requestCode(email: string): Promise<void>
  verifyCode(email: string, code: string): Promise<Session>

  me(): Promise<StaffProfile>
  updateMe(patch: ProfilePatch): Promise<StaffProfile>

  home(): Promise<Home>
  shifts(tab: ShiftTab): Promise<ShiftCard[]>
  /** `id` undefined opens the next upcoming shift. */
  shift(id: string | undefined): Promise<ShiftDetail>
  drop(id: string, input: DropRequest): Promise<DropResult>
  openShifts(): Promise<OpenShift[]>
  claim(id: string): Promise<ClaimResult>

  clockCheck(req: ClockCheckRequest): Promise<ClockCheck>
  clockIn(req: ClockPunchRequest): Promise<ClockPunch>
  clockOut(req: ClockPunchRequest): Promise<ClockPunch>
  clockRequest(punchId: string): Promise<ClockRequestStatus>
  /** Demo only: stands in for dispatch approving a pending request. */
  demoApprove(punchId: string): Promise<void>

  messages(): Promise<ChatItem[]>
  sendMessage(text: string): Promise<ChatItem>
  notifications(): Promise<Notifications>
  markNotificationsRead(): Promise<void>
}
