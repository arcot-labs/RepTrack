import type { UserPublic } from '@/api/generated'
import { SessionContext, useSession } from '@/auth/useSession'
import type { SessionContextType } from '@/models/session'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

const testUser: UserPublic = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    is_admin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
}

describe('useSession', () => {
    it('throws when rendered outside SessionProvider', () => {
        expect(() => renderHook(() => useSession())).toThrow(
            'useSession must be used within SessionProvider'
        )
    })

    it('returns supplied context when wrapped', () => {
        const testContext: SessionContextType = {
            user: testUser,
            isLoading: false,
            isAuthenticated: true,
            refresh: () => Promise.resolve(),
        }

        const wrapper = ({ children }: { children: ReactNode }) => (
            <SessionContext.Provider value={testContext}>
                {children}
            </SessionContext.Provider>
        )
        const { result } = renderHook(() => useSession(), { wrapper })

        expect(result.current).toBe(testContext)
    })
})
