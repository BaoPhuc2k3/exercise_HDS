import { Box, Button, Container } from "@mui/material";
import { NavLink, Navigate, Route, Routes } from "react-router";
import ProductMasterPage from "./pages/ProducMasterPage";
import SaleOutPage from "./pages/SaleOutPage";

function App() {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#edf3f9" }}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          backgroundColor: "#f7fbff",
          borderBottom: "1px solid #d6e3ef",
          boxShadow: "0 2px 10px rgba(25, 78, 120, 0.08)",
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, lg: 4 } }}>
          <Box
            component="nav"
            aria-label="Điều hướng chính"
            sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, py: 1 }}
          >
            {[
              { to: "/ProductMaster", label: "Master sản phẩm" },
              { to: "/SaleOut", label: "Sale Out" },
            ].map(({ to, label }) => (
              <Button
                key={to}
                component={NavLink}
                to={to}
                sx={{
                  minHeight: 40,
                  px: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#175684",
                  "&.active, &.active:hover": {
                    backgroundColor: "#175684",
                    color: "#fff",
                  },
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
        </Container>
      </Box>
      <Box component="main">
        <Routes>
          <Route path="/" element={<Navigate to="/ProductMaster" replace />} />
          <Route path="/ProductMaster" element={<ProductMasterPage />} />
          <Route path="/SaleOut" element={<SaleOutPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
