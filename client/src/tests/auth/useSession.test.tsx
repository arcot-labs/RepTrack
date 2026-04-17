import { SessionContext, useSession } from '@/auth/useSession'
import type { SessionContextType } from '@/models/session'
import { createUser } from '@/tests/mocks/handlers/user'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

describe('useSession', () => {
    it('throws when rendered outside SessionProvider', () => {
        expect(() => renderHook(() => useSession())).toThrow(
            'useSession must be used within SessionProvider'
        )
    })

    it('returns supplied context when wrapped', () => {
        const testContext: SessionContextType = {
            user: createUser(),
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
