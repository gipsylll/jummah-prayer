import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { PrayerTimesProvider } from './contexts/PrayerTimesContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import { PrayerTrackingProvider } from './contexts/PrayerTrackingContext'
import AppRouter from './components/AppRouter'
import BottomNavigation from './components/BottomNavigation'
import Breadcrumbs from './components/Breadcrumbs'
import QuickActions from './components/QuickActions'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import { useAccessibility } from './hooks/useAccessibility'

function AppContent() {
  useKeyboardNavigation();
  useAccessibility();

  return (
    <div className="app">
      <Breadcrumbs />
      <AppRouter />
      <BottomNavigation />
      <QuickActions />
    </div>
  );
}

function App() {
  // Получаем базовый путь из конфигурации
  const basename = import.meta.env.VITE_BASE_PATH || '';

  return (
    <BrowserRouter basename={basename}>
      <ThemeProvider>
        <AuthProvider>
          <PrayerTimesProvider>
            <PrayerTrackingProvider>
              <NotificationsProvider>
                <AccessibilityProvider>
                  <AppContent />
                </AccessibilityProvider>
              </NotificationsProvider>
            </PrayerTrackingProvider>
          </PrayerTimesProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App


