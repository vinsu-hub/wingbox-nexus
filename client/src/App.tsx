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
        <Route path="/view/:slug">{params => <Layout><MissingView slug={params.slug} /></Layout>}</Route>
        <Route component={LoginPage} />
      </Switch>
    </>
  );
}

export default App;
