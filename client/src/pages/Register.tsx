import { AuthService } from '@/api/generated'
import { zRegisterRequest } from '@/api/generated/zod.gen'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/overrides/button'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

const zRegisterFormSchema = zRegisterRequest
    .extend({
        confirmPassword: zRegisterRequest.shape.password,
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

type RegisterForm = z.infer<typeof zRegisterFormSchema>

export function Register() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const tokenSet = searchParams.has('token')
    const token = searchParams.get('token') ?? ''

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<RegisterForm>({
        resolver: zodResolver(zRegisterFormSchema),
        mode: 'onSubmit',
        reValidateMode: 'onChange',
        defaultValues: {
            token: token,
        },
    })

    const onSubmit = async (form: RegisterForm) => {
        const { error } = await AuthService.register({
            body: form,
        })
        if (error) {
            await handleApiError(error, {
                httpErrorHandlers: {
                    invalid_token: (err) => {
                        notify.error(err.detail)
                        notify.info('If token is expired, request access again')
                        reset({ token: '', confirmPassword: '' })
                        setSearchParams({})
                    },
                    username_taken: (err) => {
                        notify.error(err.detail)
                        reset({ username: '', confirmPassword: '' })
                    },
                },
                fallbackMessage: 'Failed to register',
            })
            return
        }
        notify.success('Registered successfully. You can now log in')
        void navigate('/login', { replace: true })
    }

    return (
        <div className="flex h-dvh items-center justify-center bg-muted px-4">
            <Card className="w-full max-w-sm shadow-md">
                <CardHeader className="-mb-4">
                    <CardTitle className="p-0 text-center text-2xl">
                        Register
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        id="register-form"
                        className="space-y-4"
                        onSubmit={(e) => {
                            void handleSubmit(onSubmit)(e)
                        }}
                    >
                        <div className="space-y-1">
                            <Label htmlFor="token">Token</Label>
                            <Input
                                id="token"
                                disabled={tokenSet}
                                aria-invalid={!!errors.token}
                                className={
                                    errors.token ? 'border-destructive' : ''
                                }
                                {...register('token')}
                            />
                            {errors.token && (
                                <p className="text-sm text-destructive">
                                    {errors.token.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                autoComplete="username"
                                aria-invalid={!!errors.username}
                                className={
                                    errors.username ? 'border-destructive' : ''
                                }
                                {...register('username')}
                            />
                            {errors.username && (
                                <p className="text-sm text-destructive">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={!!errors.password}
                                className={
                                    errors.password ? 'border-destructive' : ''
                                }
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="confirmPassword">
                                Confirm Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={!!errors.confirmPassword}
                                className={
                                    errors.confirmPassword
                                        ? 'border-destructive'
                                        : ''
                                }
                                {...register('confirmPassword')}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button
                        form="register-form"
                        className="w-full"
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting ? 'Registering...' : 'Register'}
                    </Button>
                    <div className="flex flex-col items-center gap-1 text-sm">
                        <div className="text-muted-foreground">
                            Don&apos;t have a token?{' '}
                            <Link to="/request-access">
                                <Button
                                    variant="link"
                                    className="h-auto p-0 align-baseline"
                                >
                                    Request Access
                                </Button>
                            </Link>
                        </div>
                        <div className="text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/login">
                                <Button
                                    variant="link"
                                    className="h-auto p-0 align-baseline"
                                >
                                    Log In
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
