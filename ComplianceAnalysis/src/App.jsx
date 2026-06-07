import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./Components/Layout";
import Dashboard from "./Pages/Dashboard";
import About from "./Pages/About";
import Oraganizations from "./Pages/Oraganizations";
import Product from "./Pages/Product";
import RuleAndPolicies from "./Pages/RuleAndPolicies";
import ComplianceEngine from "./Pages/ComplianceEngine";
import Reports from "./Pages/Reports";
import Signup from "./Auth/Signup";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          index: true,
          element: <Dashboard />,
        },
        {
          path: "about",
          element: <About />,
        },
        {
          path: "organization",
          element: <Oraganizations />,
        },
        {
          path: "products",
          element: <Product />,
        },
        {
          path: "rules-and-policies",
          element: <RuleAndPolicies />,
        },
        {
          path: "compliance-engine",
          element: <ComplianceEngine />,
        },
        {
          path: "reports",
          element: <Reports />,
        },
        {
          path: "signup",
          element: <Signup />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;