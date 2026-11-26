import DashboardIcon from "@mui/icons-material/Dashboard";
import AssessmentIcon from "@mui/icons-material/Assessment";
import EngineeringIcon from "@mui/icons-material/Engineering";
import PolicyIcon from "@mui/icons-material/Policy";
import CategoryIcon from "@mui/icons-material/Category";
import ApartmentIcon from "@mui/icons-material/Apartment";
import InfoIcon from "@mui/icons-material/Info";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { Loading } from "./common";
import theme from "../theme";

const NAVIGATION = [
  { kind: "header", title: "Overview" },
  { segment: "", title: "Dashboard", icon: <DashboardIcon /> },
  { kind: "header", title: "Manage" },
  { segment: "organization", title: "Organizations", icon: <ApartmentIcon /> },
  { segment: "products", title: "Products", icon: <CategoryIcon />, pattern: "products{/:id}*" },
  { segment: "rules-and-policies", title: "Rules & Policies", icon: <PolicyIcon /> },
  { kind: "header", title: "Compliance" },
  { segment: "compliance-engine", title: "Compliance Engine", icon: <EngineeringIcon /> },
  { segment: "reports", title: "Reports", icon: <AssessmentIcon />, pattern: "reports{/:id}*" },
  { kind: "divider" },
  { segment: "about", title: "About", icon: <InfoIcon /> },
];

/** Wraps every route: theme, router integration, notifications, session. */
export function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const session = useMemo(
    () => (user ? { user: { id: user.id, name: user.userName, email: user.email } } : null),
    [user],
  );
  const authentication = useMemo(
    () => ({
      signIn: () => navigate("/signin"),
      signOut: async () => {
        await signOut();
        navigate("/signin");
      },
    }),
    [navigate, signOut],
  );

  return (
    <ReactRouterAppProvider
      navigation={NAVIGATION}
      theme={theme}
      session={session}
      authentication={authentication}
      branding={{ title: "Compliance Analysis", logo: <VerifiedUserIcon color="primary" sx={{ mt: 0.5 }} /> }}
    >
      <Outlet />
    </ReactRouterAppProvider>
  );
}

/** The signed-in area: sidebar layout, redirects to sign-in when needed. */
export default function Layout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Checking your session…" />;
  if (!user) {
    const next = location.pathname + location.search;
    return <Navigate to={`/signin${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} replace />;
  }
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
