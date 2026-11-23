// SMS for invites and shift changes (ADR-026, docs/specs/sms.md). Services call `textStaff` right
// after the notification it accompanies, or `textInvite` for a phone invite. Every text is logged
// before it is sent; a repeat within 10 minutes is dropped; nothing here ever throws, so a text can
// never fail the action that caused it. Without the Twilio configuration nothing is sent.
import { rows, sql } from "../db/client"
import { smsConfig, type SmsConfig } from "./config"
import { brandOf, smsText, type SmsCopy } from "./copy"
import {
  dedupeKey,
  inviteLink,
  shiftLink,
  smsTarget,
  type SkipReason,
  type SmsKind,
  type SmsTarget,
} from "./policy"
import { sendSms } from "./twilio"

/** A shift text as a service describes it: the brand and the link are added here. */
type WithoutContext<T> = T extends unknown ? Omit<T, "brand" | "link"> : never
export type ShiftCopy = WithoutContext<Exclude<SmsCopy, { kind: "invite" }>>
export type StaffText = {
  staffId: string
  /** Staff-app page the text links to, e.g. "/staff/shifts/detail?id=…". */
  path: string
  copy: ShiftCopy
}

const DEDUPE_WINDOW_MINUTES = 10

type Recipient = { id: string; tenant_id: string; phone: string; tenant: string }

/** Texts each valet their shift change. Valets without a US number are skipped. */
export async function textStaff(texts: StaffText[]): Promise<void> {
  if (texts.length === 0) return
  try {
    const cfg = smsConfig()
    const ids = [...new Set(texts.map((t) => t.staffId))]
    const people = await rows<Recipient>(
      sql()`select s.id, s.tenant_id, s.phone, t.name as tenant
            from staff s join tenants t on t.id = s.tenant_id
            where s.id = any(${ids}::uuid[])`,
    )
    const byId = new Map(people.map((person) => [person.id, person]))
    await Promise.allSettled(
      texts.map(async (text) => {
        const person = byId.get(text.staffId)
        if (!person) return
        const target = smsTarget(cfg !== null, person.phone)
        const body = cfg
          ? smsText({
              ...text.copy,
              brand: brandOf(person.tenant),
              link: shiftLink(cfg.appUrl, text.path),
            } as SmsCopy)
          : ""
        await logAndSend(cfg, target, {
          tenantId: person.tenant_id,
          staffId: person.id,
          kind: text.copy.kind,
          body,
        })
      }),
    )
  } catch (error) {
    console.warn("SMS skipped", error)
  }
}

export type InviteText = {
  tenantId: string
  staffId: string
  adminFirst: string
  tenantName: string
  phone: string
}

export type InviteTextResult = { texted: true } | { texted: false; reason: SkipReason | "failed" }

/** Texts a person invited by phone the link to join. Says whether it went, and if not, why. */
export async function textInvite(invite: InviteText): Promise<InviteTextResult> {
  try {
    const cfg = smsConfig()
    const target = smsTarget(cfg !== null, invite.phone)
    const body =
      cfg && target.ok
        ? smsText({
            kind: "invite",
            adminFirst: invite.adminFirst,
            tenant: invite.tenantName,
            link: inviteLink(cfg.appUrl, target.to),
          })
        : ""
    const sent = await logAndSend(cfg, target, {
      tenantId: invite.tenantId,
      staffId: invite.staffId,
      kind: "invite",
      body,
    })
    if (!target.ok) return { texted: false, reason: target.reason }
    return sent ? { texted: true } : { texted: false, reason: "failed" }
  } catch (error) {
    console.warn("Invite SMS skipped", error)
    return { texted: false, reason: "failed" }
  }
}

type Outgoing = { tenantId: string; staffId: string; kind: SmsKind; body: string }

/**
 * Records the text, then sends it. A skip is logged with its reason (except "no phone", which says
 * nothing useful); a repeat inside the dedupe window inserts nothing and sends nothing.
 * Returns whether Twilio accepted it.
 */
async function logAndSend(
  cfg: SmsConfig | null,
  target: SmsTarget,
  out: Outgoing,
): Promise<boolean> {
  if (!target.ok || !cfg) {
    if (!target.ok && target.reason !== "no_phone") {
      await sql()`insert into sms_messages (tenant_id, staff_id, kind, status, skip_reason)
                  values (${out.tenantId}, ${out.staffId}, ${out.kind}, 'skipped', ${target.reason})`
    }
    return false
  }

  const key = dedupeKey(out.kind, out.staffId, out.body)
  const [logged] = await rows<{ id: string }>(
    sql()`insert into sms_messages (tenant_id, staff_id, kind, dedupe_key, to_last4, status)
          select ${out.tenantId}, ${out.staffId}, ${out.kind}, ${key}, ${target.last4}, 'pending'
          where not exists (
            select 1 from sms_messages
            where dedupe_key = ${key}
              and created_at > now() - (${DEDUPE_WINDOW_MINUTES} * interval '1 minute'))
          returning id`,
  )
  if (!logged) return false

  const result = await sendSms(cfg, target.to, out.body)
  if (result.ok) {
    await sql()`update sms_messages set twilio_sid = ${result.sid}, status = ${result.status},
                  updated_at = now()
                where id = ${logged.id}`
    return true
  }
  await sql()`update sms_messages set status = ${result.optedOut ? "opted_out" : "failed"},
                error_code = ${result.code}, updated_at = now()
              where id = ${logged.id}`
  console.warn(`SMS to …${target.last4} failed: ${result.code ?? "-"} ${result.message}`)
  return false
}
