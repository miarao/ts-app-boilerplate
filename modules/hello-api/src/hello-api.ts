import { z } from 'zod'

export const Member = z.object({ name: z.string(), email: z.string().email() })
export type Member = z.infer<typeof Member>

// — Request & response for helloMember —
export const HelloMemberRequest = z.object({
  name: z.string().min(1),
})
export type HelloMemberRequest = z.infer<typeof HelloMemberRequest>

export const HelloMemberResponse = Member
export type HelloMemberResponse = z.infer<typeof HelloMemberResponse>

// — Request & response for getMembers —
export const GetMembersRequest = z.object({})
export type GetMembersRequest = z.infer<typeof GetMembersRequest>

export const GetMembersResponse = z.array(Member)
export type GetMembersResponse = z.infer<typeof GetMembersResponse>
