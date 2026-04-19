import { AuthService } from '@/api/generated'
import { zLoginRequest } from '@/api/generated/zod.gen'
import { useSession } from '@/auth/useSession'
import { FormField } from '@/components/FormField'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/overrides/button'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/overrides/card'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { isEmailValue, preprocessTrimAndLower } from '@/lib/validation'
import type { LocationState } from '@/models/location'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

const loginFormSchema = z.object({
    identifier: preprocessTrimAndLower(
        z.string().refine((value) => {
            const isEmailValid =
                zLoginRequest.shape.email.safeParse(value).success
            const isUsernameValid =
                zLoginRequest.shape.username.safeParse(value).success
            return isEmailValid || isUsernameValid
        }, 'Enter a valid username or email')
    ),
    password: zLoginRequest.shape.password,
})

type LoginForm = z.infer<typeof loginFormSchema>
type LoginRequestBody = z.infer<typeof zLoginRequest>

export function Login() {
    const { refresh } = useSession()
    const navigate = useNavigate()

    const location = useLocation()
    const state = location.state as LocationState | null
    const from = state?.from?.pathname ?? '/login'

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm({
        resolver: zodResolver(loginFormSchema),
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    })

    const onSubmit = async (form: LoginForm) => {
        const isEmail = isEmailValue(form.identifier)
        const body: LoginRequestBody = zLoginRequest.parse(
            isEmail
                ? { email: form.identifier, password: form.password }
                : { username: form.identifier, password: form.password }
        )
        const { error } = await AuthService.login({ body })
        if (error) {
            await handleApiError(error, {
                fallbackMessage: 'Failed to log in',
            })
            reset({ password: '' })
            return
        }
        notify.success('Logged in')
        await refresh()
        void navigate(from, { replace: true })
    }

    return (
        <div className="flex h-dvh items-center justify-center bg-muted px-4">
            <Card className="w-full max-w-sm rounded-lg! p-2 shadow-md">
                <CardHeader className="mb-1">
                    <CardTitle className="text-2xl">Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        id="login-form"
                        className="space-y-4"
                        onSubmit={(e) => {
                            void handleSubmit(onSubmit)(e)
                        }}
                    >
                        <FormField
                            label="Username or Email"
                            htmlFor="identifier"
                            error={errors.identifier?.message}
                        >
                            <Input
                                id="identifier"
                                autoComplete="username"
                                aria-invalid={!!errors.identifier}
                                className={
                                    errors.identifier
                                        ? 'border-destructive'
                                        : ''
                                }
                                {...register('identifier')}
                            />
                        </FormField>
                        <FormField
                            label="Password"
                            htmlFor="password"
                            error={errors.password?.message}
                        >
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                aria-invalid={!!errors.password}
                                className={
                                    errors.password ? 'border-destructive' : ''
                                }
                                {...register('password')}
                            />
                        </FormField>
                    </form>
                </CardContent>
                <CardFooter className="mt-2 mb-1 flex flex-col gap-3">
                    <Button
                        form="login-form"
                        className="w-full"
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </Button>
                    <div className="text-sm">
                        <Link to="/forgot-password">
                            <Button
                                variant="link"
                                className="h-auto p-0 align-baseline"
                            >
                                Forgot password?
                            </Button>
                        </Link>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-sm">
                        <div className="text-muted-foreground">
                            Don&apos;t have an account?{' '}
                        </div>
                        <div>
                            <Link to="/request-access">
                                <Button
                                    variant="link"
                                    className="h-auto p-0 align-baseline"
                                >
                                    Request Access
                                </Button>
                            </Link>
                            <span className="text-muted-foreground"> or </span>
                            <Link to="/register">
                                <Button
                                    variant="link"
                                    className="h-auto p-0 align-baseline"
                                >
                                    Register
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
