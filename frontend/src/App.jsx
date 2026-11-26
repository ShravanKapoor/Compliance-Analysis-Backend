import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout, { AppShell } from "./Components/Layout";
import Dashboard from "./Pages/Dashboard";
import About from "./Pages/About";
import Organizations from "./Pages/Organizations";
import Products from "./Pages/Products";
import ProductDetail from "./Pages/ProductDetail";
import RuleAndPolicies from "./Pages/RuleAndPolicies";
import ComplianceEngine from "./Pages/ComplianceEngine";
import Reports from "./Pages/Reports";
import ReportDetail from "./Pages/ReportDetail";
import NotFound from "./Pages/NotFound";
import Signin from "./Auth/Signin";
import Signup from "./Auth/Signup";
import { AuthProvider } from "./context/AuthContext";

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "signin", element: <Signin /> },
      { path: "signup", element: <Signup /> },
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "organization", element: <Organizations /> },
          { path: "products", element: <Products /> },
          { path: "products/:id", element: <ProductDetail /> },
          { path: "rules-and-policies", element: <RuleAndPolicies /> },
          { path: "compliance-engine", element: <ComplianceEngine /> },
          { path: "reports", element: <Reports /> },
          { path: "reports/:id", element: <ReportDetail /> },
          { path: "about", element: <About /> },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
