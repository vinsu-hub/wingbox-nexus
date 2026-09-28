import { Route, Switch } from "wouter";
import { Toaster } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { FleetPage } from "@/pages/FleetPage";
import { MissingView } from "@/pages/MissingView";
import { AircraftRecordPage } from "@/pages/AircraftRecord/AircraftRecordPage";
import { InspectionsPage } from "@/pages/Inspections/InspectionsPage";
import { ComplianceView } from "@/pages/Compliance/ComplianceView";
import { LifeTrackingView } from "@/pages/LifeTracking/LifeTrackingView";
import { ReportsPage } from "@/pages/Reports/ReportsPage";
import { PartsRequestsPage } from "@/pages/PartsRequests/PartsRequestsPage";
import { MaintenanceHistoryView } from "@/pages/MaintenanceHistory/MaintenanceHistoryView";
import { DocumentsView } from "@/pages/Documents/DocumentsView";
import { TechnicalLibraryPage } from "@/pages/TechnicalLibrary/TechnicalLibraryPage";
import { KnowledgeBasePage } from "@/pages/KnowledgeBase/KnowledgeBasePage";
import { ClientAccessPage } from "@/pages/ClientAccess/ClientAccessPage";
import { ClientReportsPage } from "@/pages/ClientReports/ClientReportsPage";
import { PresentationsPage } from "@/pages/Presentations/PresentationsPage";
import { AiAssistantPage } from "@/pages/AiAssistant/AiAssistantPage";
import { InspectionPresentationPage } from "@/pages/InspectionPresentation/InspectionPresentationPage";
import { Damage3DPage } from "@/pages/Damage3D/Damage3DPage";
import { QaQcView } from "@/pages/QaQc/QaQcView";
import { DeliveryView } from "@/pages/Delivery/DeliveryView";

import { ComponentsPage } from "@/pages/Components/ComponentsPage";
import { FindingsPage } from "@/pages/Findings/FindingsPage";
import { UsersRolesPage } from "@/pages/Admin/UsersRolesPage";
import { TemplatesPage } from "@/pages/Admin/TemplatesPage";
import { AuditLogPage } from "@/pages/Admin/AuditLogPage";
import { SystemSettingsPage } from "@/pages/Admin/SystemSettingsPage";

function App() {
  return (
    <>
      <Toaster position="bottom-right" />
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/" component={LoginPage} />
        <Route path="/fleet" component={() => <Layout><FleetPage /></Layout>} />
        <Route path="/fleet/:tail" component={() => <Layout><AircraftRecordPage /></Layout>} />
        <Route path="/dashboard" component={() => <Layout><DashboardPage /></Layout>} />
        <Route path="/inspections" component={() => <Layout><InspectionsPage /></Layout>} />
        <Route path="/compliance" component={() => <Layout><ComplianceView /></Layout>} />
        <Route path="/life-tracking" component={() => <Layout><LifeTrackingView /></Layout>} />
        <Route path="/reports" component={() => <Layout><ReportsPage /></Layout>} />
        <Route path="/parts-requests" component={() => <Layout><PartsRequestsPage /></Layout>} />
        <Route path="/maintenance-history" component={() => <Layout><MaintenanceHistoryView /></Layout>} />
        <Route path="/documents" component={() => <Layout><DocumentsView /></Layout>} />
        <Route path="/technical-library" component={() => <Layout><TechnicalLibraryPage /></Layout>} />
        <Route path="/knowledge-base" component={() => <Layout><KnowledgeBasePage /></Layout>} />
        <Route path="/client-access" component={() => <Layout><ClientAccessPage /></Layout>} />
        <Route path="/client-reports" component={() => <Layout><ClientReportsPage /></Layout>} />
        <Route path="/presentations" component={() => <Layout><PresentationsPage /></Layout>} />
        <Route path="/ai-assistant" component={() => <Layout><AiAssistantPage /></Layout>} />
        <Route path="/inspection-presentation/:id?" component={() => <Layout><InspectionPresentationPage /></Layout>} />
        <Route path="/damage-3d" component={() => <Layout><Damage3DPage /></Layout>} />
        <Route path="/qa-qc" component={() => <Layout><QaQcView /></Layout>} />
        <Route path="/delivery" component={() => <Layout><DeliveryView /></Layout>} />
        <Route path="/components" component={() => <Layout><ComponentsPage /></Layout>} />
        <Route path="/findings" component={() => <Layout><FindingsPage /></Layout>} />
        <Route path="/users-roles" component={() => <Layout><UsersRolesPage /></Layout>} />
        <Route path="/templates" component={() => <Layout><TemplatesPage /></Layout>} />
        <Route path="/audit-log" component={() => <Layout><AuditLogPage /></Layout>} />
        <Route path="/system-settings" component={() => <Layout><SystemSettingsPage /></Layout>} />
        <Route path="/view/:slug">{params => <Layout><MissingView slug={params.slug} /></Layout>}</Route>
        <Route component={LoginPage} />
      </Switch>
    </>
  );
}

export default App;
