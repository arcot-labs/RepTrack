import { handlers as authHandlers } from '@/tests/mocks/handlers/auth'
import { handlers as baseHandlers } from '@/tests/mocks/handlers/base'
import { handlers as userHandlers } from '@/tests/mocks/handlers/user'
import { setupServer } from 'msw/node'

export const server = setupServer(
    ...baseHandlers,
    ...authHandlers,
    ...userHandlers
)
