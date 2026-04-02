import { handlers } from '@/tests/mocks/handlers'
import { setupServer } from 'msw/node'

export const server = setupServer(...handlers)
