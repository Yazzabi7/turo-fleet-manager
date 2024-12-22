import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Tab,
  Tabs,
  IconButton,
  InputAdornment,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', loginData);
      localStorage.setItem('token', response.data.token);
      navigate('/');
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Une erreur est survenue lors de la connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (registerData.password !== registerData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/auth/register', {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
      });
      setTabValue(0);
      setLoginData({
        username: registerData.username,
        password: registerData.password,
      });
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Une erreur est survenue lors de l\'inscription');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.palette.grey[100],
        py: 4,
      }}
    >
      <Container 
        maxWidth="sm" 
        sx={{
          width: '100%',
          px: { xs: 2, sm: 4 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box
            sx={{
              bgcolor: theme.palette.primary.main,
              borderRadius: '50%',
              p: 2,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CarIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              color: theme.palette.primary.main,
              textAlign: 'center',
            }}
          >
            Gestionnaire de Flotte
          </Typography>
        </Box>

        <Paper
          elevation={4}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'white',
            width: '100%',
            maxWidth: '500px',
            mx: 'auto',
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  py: 2,
                },
              }}
            >
              <Tab
                label="Connexion"
                sx={{ fontWeight: 'medium' }}
              />
              <Tab
                label="Inscription"
                sx={{ fontWeight: 'medium' }}
              />
            </Tabs>
          </Box>

          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ mx: 3, mt: 2 }}
            >
              {error}
            </Alert>
          )}

          <TabPanel value={tabValue} index={0}>
            <form onSubmit={handleLoginSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Nom d'utilisateur"
                name="username"
                autoComplete="username"
                value={loginData.username}
                onChange={(e) =>
                  setLoginData({ ...loginData, username: e.target.value })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                }}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <form onSubmit={handleRegisterSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Nom d'utilisateur"
                name="username"
                autoComplete="username"
                value={registerData.username}
                onChange={(e) =>
                  setRegisterData({ ...registerData, username: e.target.value })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                value={registerData.email}
                onChange={(e) =>
                  setRegisterData({ ...registerData, email: e.target.value })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData({ ...registerData, password: e.target.value })
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirmer le mot de passe"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={registerData.confirmPassword}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    confirmPassword: e.target.value,
                  })
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                }}
              >
                {loading ? 'Inscription...' : 'S\'inscrire'}
              </Button>
            </form>
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
