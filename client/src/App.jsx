import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import MedicinesPage from './pages/MedicinesPage';
import RemindersPage from './pages/RemindersPage';
import InventoryPage from './pages/InventoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import VoiceAssistantPage from './pages/VoiceAssistantPage';
import CaregiverDashboard from './pages/CaregiverDashboard';
import CaregiverSettingsPage from './pages/CaregiverSettingsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import AddMedicineModal from './components/AddMedicineModal';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import PrescriptionScanModal from './components/PrescriptionScanModal';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showPrescriptionScan, setShowPrescriptionScan] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // If caregiver is inspecting a specific patient
  const [inspectPatientId, setInspectPatientId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Starting MediSync...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    // If caregiver and on default dashboard, render CaregiverDashboard
    if (user.role === 'CAREGIVER' && currentTab === 'dashboard') {
      return (
        <CaregiverDashboard
          onSelectPatient={(pId) => {
            setInspectPatientId(pId);
            setCurrentTab('analytics');
          }}
        />
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard
            key={refreshKey}
            onOpenVoice={() => setShowVoiceModal(true)}
            onOpenAddMed={() => setShowAddMedicine(true)}
            onOpenScanRx={() => setShowPrescriptionScan(true)}
            setCurrentTab={setCurrentTab}
          />
        );
      case 'medicines':
        return (
          <MedicinesPage
            key={refreshKey}
            onOpenAddMed={() => setShowAddMedicine(true)}
            onOpenScanRx={() => setShowPrescriptionScan(true)}
          />
        );
      case 'reminders':
        return <RemindersPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'voice':
        return <VoiceAssistantPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'caregiver-dashboard':
        return (
          <CaregiverDashboard
            onSelectPatient={(pId) => {
              setInspectPatientId(pId);
              setCurrentTab('analytics');
            }}
          />
        );
      case 'caregiver-settings':
        return <CaregiverSettingsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <Dashboard
            onOpenVoice={() => setShowVoiceModal(true)}
            onOpenAddMed={() => setShowAddMedicine(true)}
            setCurrentTab={setCurrentTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenScanRx={() => setShowPrescriptionScan(true)}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          setMobileOpen={setMobileOpen}
          onOpenVoice={() => setShowVoiceModal(true)}
          onOpenScanRx={() => setShowPrescriptionScan(true)}
        />

        <main className="flex-1 pb-16">
          {renderContent()}
        </main>
      </div>

      {/* Global Modals */}
      <AddMedicineModal
        isOpen={showAddMedicine}
        onClose={() => setShowAddMedicine(false)}
        onMedicineAdded={() => {
          setRefreshKey(prev => prev + 1);
        }}
        onOpenScan={() => setShowPrescriptionScan(true)}
      />

      <PrescriptionScanModal
        isOpen={showPrescriptionScan}
        onClose={() => setShowPrescriptionScan(false)}
        onMedicinesAdded={() => {
          setRefreshKey(prev => prev + 1);
          setCurrentTab('medicines');
        }}
      />

      <VoiceAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onDoseUpdated={() => {
          setRefreshKey(prev => prev + 1);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

