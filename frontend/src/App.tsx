import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import PublicPage from './pages/PublicPage';
import ThankYouPage from './pages/ThankYouPage';
import { useDocumentTitle } from './utils/useDocumentTitle';

// NavLink sets aria-current="page" on the active link; a darker fill plus an underline marks it without lowering contrast.
const navLinkSx = {
  '&[aria-current="page"]': {
    bgcolor: 'rgba(0, 0, 0, 0.2)',
    boxShadow: 'inset 0 -2px 0 #fff',
  },
};

function NotFound() {
  useDocumentTitle('Not found');
  return (
    <Typography variant="h5" component="h1">
      Page not found. <Link to="/">Go home</Link>
    </Typography>
  );
}

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
      <AppBar position="sticky">
        <Toolbar>
          {/* Text wordmark: the app's name, linking home. */}
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              color: 'inherit',
              textDecoration: 'none',
              fontWeight: 700,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Event Registration
          </Typography>
          <Button color="inherit" component={NavLink} to="/" end sx={navLinkSx}>
            Public
          </Button>
          <Button color="inherit" component={NavLink} to="/admin" sx={navLinkSx}>
            Admin
          </Button>
        </Toolbar>
      </AppBar>
      <Container id="main" maxWidth="xl" sx={{ py: 4, scrollMarginTop: { xs: 56, sm: 64 } }}>
        <Routes>
          <Route path="/" element={<PublicPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
    </Box>
  );
}
