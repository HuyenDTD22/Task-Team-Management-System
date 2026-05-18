import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { NotFoundPage } from '@/router/NotFoundPage'
import { AppLayout } from '@/layouts/AppLayout'
import { LandingPage } from '@/features/landing/pages/LandingPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { EditProfilePage } from '@/features/profile/pages/EditProfilePage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { WorkspacesPage } from '@/features/workspace/pages/WorkspacesPage'
import { WorkspaceDetailPage } from '@/features/workspace/pages/WorkspaceDetailPage'
import { ProjectDetailPage } from '@/features/project/pages/ProjectDetailPage'
import { MyTasksPage } from '@/features/task/pages/MyTasksPage'
import { NotificationsPage } from '@/features/notification/pages/NotificationsPage'

export const router = createBrowserRouter([
  { path: '/',          element: <LandingPage /> },
  { path: '/login',     element: <LoginPage /> },
  { path: '/register',  element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: 'dashboard',      element: <DashboardPage /> },
          { path: 'workspaces',     element: <WorkspacesPage /> },
          { path: 'workspaces/:id', element: <WorkspaceDetailPage /> },
          { path: 'projects/:id',   element: <ProjectDetailPage /> },
          { path: 'tasks',          element: <MyTasksPage /> },
          { path: 'notifications',  element: <NotificationsPage /> },
          { path: 'profile',        element: <ProfilePage /> },
          { path: 'profile/edit',   element: <EditProfilePage /> },
          { path: 'settings',       element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
