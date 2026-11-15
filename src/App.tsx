import React, { useEffect, useState } from 'react';
import { CMMSProvider, useCMMS } from './context/CMMSContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { canAccessBackup, getEffectiveAllowedViews, isAdminLevel } from './utils/cmmsLogic';

// Tabs
import { DashboardTab } from './components/tabs/DashboardTab';
import { AdminDashboardTab } from './components/tabs/AdminDashboardTab';
import { MyTasksTab } from './components/tabs/MyTasksTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { EquipmentTab } from './components/tabs/EquipmentTab';
import { MaintenanceTab } from './components/tabs/MaintenanceTab';
import { SafetyInspectionTab } from './components/tabs/SafetyInspectionTab';
import { ToolsManagementTab } from './components/tabs/ToolsManagementTab';
import { TicketsTab } from './components/tabs/TicketsTab';
import { ProjectsTab } from './components/tabs/ProjectsTab';
import { SparePartsTab } from './components/tabs/SparePartsTab';
import { DocumentsTab } from './components/tabs/DocumentsTab';
import { EnergyTab } from './components/tabs/EnergyTab';
import { CostTab } from './components/tabs/CostTab';
import { EmployeesTab } from './components/tabs/EmployeesTab';
import { EmployeePerformanceTab } from './components/tabs/EmployeePerformanceTab';
import { AuditLogTab } from './components/tabs/AuditLogTab';
import { EmailAlertsTab } from './components/tabs/EmailAlertsTab';

// Modals
import { QRModal } from './components/QRModal';
import { QRScannerModal } from './components/QRScannerModal';
import { MaintenanceExecutionModal } from './components/MaintenanceExecutionModal';
import { TicketModal } from './components/TicketModal';
import { StockTransactionModal } from './components/StockTransactionModal';
import { MeterReadingModal } from './components/MeterReadingModal';
import { EquipmentModal } from './components/EquipmentModal';
import { SparePartModal } from './components/SparePartModal';
import { CostModal } from './components/CostModal';
import { LoginPage } from './components/LoginPage';
import { BackupDataModal } from './components/BackupDataModal';
import { EmailDispatchModal } from './components/common/EmailDispatchModal';

import { Equipment, MaintenanceWorkType, Ticket, SparePart, CostRecord } from './types/cmms';

function CMMSApp() {
  const { theme, isAuthenticated, currentUser } = useCMMS();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Modal states
  const [selectedQRForEquipment, setSelectedQRForEquipment] = useState<Equipment | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [equipmentForMaintenance, setEquipmentForMaintenance] = useState<Equipment | null>(null);
  const [maintenanceDefaultWorkType, setMaintenanceDefaultWorkType] =
    useState<MaintenanceWorkType>('Bảo trì theo kế hoạch');

  // Equipment create/edit modal
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);

  // Ticket create/edit modal
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
  const [defaultEquipmentForTicket, setDefaultEquipmentForTicket] = useState<string>('');

  // Stock Transaction modal
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [defaultPartCodeForStock, setDefaultPartCodeForStock] = useState<string | undefined>(undefined);

  // Spare Part create/edit modal
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [partToEdit, setPartToEdit] = useState<SparePart | null>(null);

  // Meter Reading modal
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);

  // Cost create/edit modal
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [costToEdit, setCostToEdit] = useState<CostRecord | null>(null);

  // Deep-linked document ID from QR / share URL (?doc=DOC-001)
  const [initialDocId, setInitialDocId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('doc');
    } catch {
      return null;
    }
  });

  const allowedViews = getEffectiveAllowedViews(currentUser);
  const hasBackupAccess = canAccessBackup(currentUser);

  useEffect(() => {
    if (initialDocId && isAuthenticated && allowedViews.includes('documents')) {
      setActiveTab('documents');
    }
  }, [initialDocId, isAuthenticated, allowedViews]);

  useEffect(() => {
    if (!allowedViews.includes(activeTab)) {
      setActiveTab(allowedViews[0] || 'dashboard');
    }
  }, [activeTab, allowedViews]);

  useEffect(() => {
    if (!hasBackupAccess && isBackupModalOpen) {
      setIsBackupModalOpen(false);
    }
  }, [hasBackupAccess, isBackupModalOpen]);

  // If not authenticated, require username and password login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigateTab = (tab: string) => {
    if (allowedViews.includes(tab)) {
      setActiveTab(tab);
    } else if (allowedViews.length > 0) {
      setActiveTab(allowedViews[0]);
    }
  };

  useEffect(() => {
    const handleCustomNavigate = (event: Event) => {
      const targetTab = (event as CustomEvent<string>).detail;
      if (typeof targetTab === 'string') {
        handleNavigateTab(targetTab);
      }
    };
    window.addEventListener('fsm:navigate-tab', handleCustomNavigate);
    return () => window.removeEventListener('fsm:navigate-tab', handleCustomNavigate);
  }, [allowedViews]);

  // Handlers
  const handleOpenQR = (eq: Equipment) => {
    setSelectedQRForEquipment(eq);
  };

  const handleOpenMaintenance = (
    eq: Equipment,
    workType: MaintenanceWorkType = 'Bảo trì theo kế hoạch'
  ) => {
    setMaintenanceDefaultWorkType(workType);
    setEquipmentForMaintenance(eq);
  };

  const handleOpenTicketFromEquipment = (eq: Equipment) => {
    setDefaultEquipmentForTicket(eq.maThietBi);
    setTicketToEdit(null);
    setIsTicketModalOpen(true);
  };

  const handleScannerSelect = (scannedEq: Equipment) => {
    setSelectedQRForEquipment(scannedEq);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'light' ? 'bg-[#eef2f6] text-slate-900' : 'bg-[#060a14] text-slate-100'
    }`}>
      {/* Top Header */}
      <Header
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenBackup={() => {
          if (hasBackupAccess) {
            setIsBackupModalOpen(true);
          }
        }}
        onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        isMobileNavOpen={isMobileNavOpen}
        onNavigateTab={handleNavigateTab}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={handleNavigateTab}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardTab
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenQR={handleOpenQR}
              onOpenMaintenanceModal={handleOpenMaintenance}
              onOpenTicketModal={() => {
                setTicketToEdit(null);
                setDefaultEquipmentForTicket('');
                setIsTicketModalOpen(true);
              }}
              onOpenStockModal={() => {
                setDefaultPartCodeForStock(undefined);
                setIsStockModalOpen(true);
              }}
              onOpenMeterModal={() => setIsMeterModalOpen(true)}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'admin_dashboard' && isAdminLevel(currentUser) && (
            <AdminDashboardTab
              onOpenMaintenanceModal={handleOpenMaintenance}
              onOpenQR={handleOpenQR}
            />
          )}

          {activeTab === 'my_tasks' && (
            <MyTasksTab
              onOpenMaintenanceModal={handleOpenMaintenance}
              onOpenQR={handleOpenQR}
              onOpenEditTicket={(t) => {
                setTicketToEdit(t);
                setIsTicketModalOpen(true);
              }}
              onOpenTicketFromEquipment={handleOpenTicketFromEquipment}
            />
          )}

          {activeTab === 'profile' && <ProfileTab />}

          {activeTab === 'equipment' && (
            <EquipmentTab
              onOpenQR={handleOpenQR}
              onOpenMaintenance={handleOpenMaintenance}
              onOpenTicket={handleOpenTicketFromEquipment}
              onOpenAddEquipment={() => {
                setEquipmentToEdit(null);
                setIsEquipmentModalOpen(true);
              }}
              onOpenEditEquipment={(eq) => {
                setEquipmentToEdit(eq);
                setIsEquipmentModalOpen(true);
              }}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceTab
              onOpenMaintenanceModal={handleOpenMaintenance}
              onOpenQR={handleOpenQR}
            />
          )}

          {activeTab === 'inspection_calibration' && <SafetyInspectionTab />}

          {activeTab === 'tools' && <ToolsManagementTab />}

          {activeTab === 'tickets' && (
            <TicketsTab
              onOpenCreateTicket={() => {
                setTicketToEdit(null);
                setDefaultEquipmentForTicket('');
                setIsTicketModalOpen(true);
              }}
              onOpenEditTicket={(t) => {
                setTicketToEdit(t);
                setIsTicketModalOpen(true);
              }}
            />
          )}

          {activeTab === 'projects' && <ProjectsTab />}

          {activeTab === 'spare_parts' && (
            <SparePartsTab
              onOpenStockModal={(partCode) => {
                setDefaultPartCodeForStock(partCode);
                setIsStockModalOpen(true);
              }}
              onOpenAddPart={() => {
                setPartToEdit(null);
                setIsPartModalOpen(true);
              }}
              onOpenEditPart={(part) => {
                setPartToEdit(part);
                setIsPartModalOpen(true);
              }}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsTab
              initialDocId={initialDocId}
              onClearInitialDoc={() => setInitialDocId(null)}
            />
          )}

          {activeTab === 'energy' && (
            <EnergyTab onOpenMeterModal={() => setIsMeterModalOpen(true)} />
          )}

          {activeTab === 'costs' && (
            <CostTab
              onOpenAddCost={() => {
                setCostToEdit(null);
                setIsCostModalOpen(true);
              }}
              onOpenEditCost={(cost) => {
                setCostToEdit(cost);
                setIsCostModalOpen(true);
              }}
            />
          )}

          {activeTab === 'employees' && <EmployeesTab />}

          {activeTab === 'employee_performance' && isAdminLevel(currentUser) && (
            <EmployeePerformanceTab />
          )}

          {activeTab === 'logs' && <AuditLogTab />}

          {activeTab === 'email_alerts' && <EmailAlertsTab />}
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Equipment QR Code card & Print */}
      <QRModal
        equipment={selectedQRForEquipment}
        onClose={() => setSelectedQRForEquipment(null)}
        onOpenMaintenance={(eq) => setEquipmentForMaintenance(eq)}
        onOpenTicket={(eq) => handleOpenTicketFromEquipment(eq)}
      />

      {/* 2. QR Scanner simulation & direct lookup */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectEquipment={handleScannerSelect}
      />

      {/* 3. Maintenance / Repair Execution & Auto Next Date Calculation */}
      <MaintenanceExecutionModal
        isOpen={Boolean(equipmentForMaintenance)}
        equipment={equipmentForMaintenance}
        defaultWorkType={maintenanceDefaultWorkType}
        onClose={() => setEquipmentForMaintenance(null)}
      />

      {/* 4. Equipment Add / Edit Modal */}
      <EquipmentModal
        isOpen={isEquipmentModalOpen}
        onClose={() => setIsEquipmentModalOpen(false)}
        equipmentToEdit={equipmentToEdit}
      />

      {/* 5. Ticket Add / Edit Modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        ticketToEdit={ticketToEdit}
        defaultEquipmentCode={defaultEquipmentForTicket}
      />

      {/* 6. Stock Transaction Modal */}
      <StockTransactionModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        defaultPartCode={defaultPartCodeForStock}
      />

      {/* 7. Spare Part Add / Edit Modal */}
      <SparePartModal
        isOpen={isPartModalOpen}
        onClose={() => setIsPartModalOpen(false)}
        partToEdit={partToEdit}
      />

      {/* 8. Meter Reading Modal */}
      <MeterReadingModal
        isOpen={isMeterModalOpen}
        onClose={() => setIsMeterModalOpen(false)}
      />

      {/* 9. Cost Add / Edit Modal */}
      <CostModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        costToEdit={costToEdit}
      />

      {/* 10. Backup & Restore Modal - Restricted to ID1460 or Owner */}
      {hasBackupAccess && (
        <BackupDataModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
        />
      )}

      {/* 11. Global Interactive Email Dispatch Modal (Gmail Web / Mailto / Copy) */}
      <EmailDispatchModal />
    </div>
  );
}

export default function App() {
  return (
    <CMMSProvider>
      <CMMSApp />
    </CMMSProvider>
  );
}
