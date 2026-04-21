import { RequireAuth } from '@/auth/RequireAuth'
import { RequireGuest } from '@/auth/RequireGuest'
import { Loading } from '@/components/Loading'
import { AppLayout } from '@/layout/AppLayout'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

const Dashboard = lazy(() =>
    import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard }))
)
const Exercises = lazy(() =>
    import('@/pages/Exercises').then((m) => ({ default: m.Exercises }))
)
const Workouts = lazy(() =>
    import('@/pages/Workouts').then((m) => ({ default: m.Workouts }))
)
const Docs = lazy(() =>
    import('@/pages/Docs').then((m) => ({ default: m.Docs }))
)
const DocsIndex = lazy(() =>
    import('@/components/docs/DocsIndex').then((m) => ({
        default: m.DocsIndex,
    }))
)
const Doc = lazy(() =>
    import('@/components/docs/Doc').then((m) => ({ default: m.Doc }))
)
const Admin = lazy(() =>
    import('@/pages/Admin').then((m) => ({ default: m.Admin }))
)
const RequestAccess = lazy(() =>
    import('@/pages/RequestAccess').then((m) => ({ default: m.RequestAccess }))
)
const Register = lazy(() =>
    import('@/pages/Register').then((m) => ({ default: m.Register }))
)
const ForgotPassword = lazy(() =>
    import('@/pages/ForgotPassword').then((m) => ({
        default: m.ForgotPassword,
    }))
)
const ResetPassword = lazy(() =>
    import('@/pages/ResetPassword').then((m) => ({ default: m.ResetPassword }))
)
const Login = lazy(() =>
    import('@/pages/Login').then((m) => ({ default: m.Login }))
)

export function AppRoutes() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route
                    path="/"
                    element={
                        <RequireAuth requireAdmin={false}>
                            <AppLayout />
                        </RequireAuth>
                    }
                >
                    <Route index element={<Dashboard />} />
                    <Route path="exercises" element={<Exercises />} />
                    <Route path="workouts" element={<Workouts />} />
                    <Route path="docs" element={<Docs />}>
                        <Route index element={<DocsIndex />} />
                        <Route path=":slug" element={<Doc />} />
                    </Route>
                    <Route
                        path="admin"
                        element={
                            <RequireAuth requireAdmin={true}>
                                <Admin />
                            </RequireAuth>
                        }
                    />
                </Route>
                <Route
                    path="/request-access"
                    element={
                        <RequireGuest>
                            <RequestAccess />
                        </RequireGuest>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <RequireGuest>
                            <Register />
                        </RequireGuest>
                    }
                />
                <Route
                    path="/forgot-password"
                    element={
                        <RequireGuest>
                            <ForgotPassword />
                        </RequireGuest>
                    }
                />
                <Route
                    path="/reset-password"
                    element={
                        <RequireGuest>
                            <ResetPassword />
                        </RequireGuest>
                    }
                />
                <Route
                    path="/login"
                    element={
                        <RequireGuest>
                            <Login />
                        </RequireGuest>
                    }
                />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Suspense>
    )
}
