import type { GetCurrentUserData } from '@/api/generated'
import { client } from '@/api/generated/client.gen'
import { zGetCurrentUserResponse } from '@/api/generated/zod.gen'
import { http, HttpResponse } from 'msw'
import type z from 'zod'

export const testUser: z.infer<typeof zGetCurrentUserResponse> = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    is_admin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
}

export function createUser(
    overrides: Partial<z.infer<typeof zGetCurrentUserResponse>> = {}
) {
    return zGetCurrentUserResponse.parse({
        ...testUser,
        ...overrides,
    })
}

export const getCurrentUserUrl = client.buildUrl<GetCurrentUserData>({
    url: '/api/users/current',
})

export const handlers = [
    http.get(getCurrentUserUrl, () => {
        return HttpResponse.json(createUser())
    }),
]
