import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from '../pages/MainPage';
import SettingsPage from '../pages/SettingsPage';
import ProfilePage from '../pages/ProfilePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DhikrPage from '../pages/DhikrPage';
import EventsPage from '../pages/EventsPage';
import ArticlesPage from '../pages/ArticlesPage';
import PrayerCalendarPage from '../pages/PrayerCalendarPage';
import StatsPage from '../pages/StatsPage';

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dhikr" element={<DhikrPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/calendar" element={<PrayerCalendarPage />} />
            <Route path="/stats" element={<StatsPage />} />
        </Routes>
    );
};

export default AppRouter;


