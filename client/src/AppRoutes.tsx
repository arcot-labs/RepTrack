import { RequireAuth } from '@/auth/RequireAuth'
import { RequireGuest } from '@/auth/RequireGuest'
import { Doc } from '@/components/docs/Doc'
import { DocsIndex } from '@/components/docs/DocsIndex'
import { AppLayout } from '@/layout/AppLayout'
import { Admin } from '@/pages/Admin'
import { Dashboard } from '@/pages/Dashboard'
import { Docs } from '@/pages/Docs'
import { Exercises } from '@/pages/Exercises'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { RequestAccess } from '@/pages/RequestAccess'
import { ResetPassword } from '@/pages/ResetPassword'
import { Workouts } from '@/pages/Workouts'
import { Navigate, Route, Routes } from 'react-router-dom'

export function AppRoutes() {
    return (
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
    )
}
