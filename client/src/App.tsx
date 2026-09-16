import { Route, Switch } from "wouter";
import { Toaster } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { FleetPage } from "@/pages/FleetPage";
import { MissingView } from "@/pages/MissingView";

function App() {
  return (
    <>
      <Toaster position="bottom-right" />
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/" component={LoginPage} />
        <Route path="/fleet" component={() => <Layout><FleetPage /></Layout>} />
        <Route path="/dashboard" component={() => <Layout><DashboardPage /></Layout>} />
        <Route path="/view/:slug">{params => <Layout><MissingView slug={params.slug} /></Layout>}</Route>
        <Route component={LoginPage} />
      </Switch>
    </>
  );
}

export default App;
