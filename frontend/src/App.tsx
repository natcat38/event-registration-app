import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { Link, Route, Routes } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import PublicPage from './pages/PublicPage';
import ThankYouPage from './pages/ThankYouPage';

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Box
        component="a"
        href="#main"
        sx={{
          position: 'absolute',
          left: -9999,
          top: 'auto',
          '&:focus-visible': {
            position: 'static',
            left: 'auto',
            p: 1,
            bgcolor: 'background.paper',
          },
        }}
      >
        Skip to content
      </Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Event Registration
          </Typography>
          <Button color="inherit" component={Link} to="/">
            Public
          </Button>
          <Button color="inherit" component={Link} to="/admin">
            Admin
          </Button>
        </Toolbar>
      </AppBar>
      <Container id="main" maxWidth="lg" sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<PublicPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route
            path="*"
            element={
              <Typography>
                Page not found. <Link to="/">Go home</Link>
              </Typography>
            }
          />
        </Routes>
      </Container>
    </Box>
  );
}
