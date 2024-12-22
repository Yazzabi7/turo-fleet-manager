import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  Box,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import HistoryIcon from '@mui/icons-material/History';
import { Link as RouterLink } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const drawerWidth = 240;

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const theme = useTheme();

  const menuItems = [
    { text: 'Tableau de Bord', icon: <DashboardIcon />, path: '/' },
    { text: 'Véhicules', icon: <DirectionsCarIcon />, path: '/vehicles' },
    { text: 'Parking', icon: <LocalParkingIcon />, path: '/parking' },
    { text: 'Historique', icon: <HistoryIcon />, path: '/history' },
  ];

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        <Box sx={{ mt: { xs: 7, sm: 8 } }}>
          <List>
            {menuItems.map((item) => (
              <ListItemButton
                key={item.text}
                component={RouterLink}
                to={item.path}
                onClick={onClose}
                sx={{
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            mt: { sm: 8 },
            height: { sm: 'calc(100% - 64px)' },
          },
        }}
        open
      >
        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.text}
              component={RouterLink}
              to={item.path}
              sx={{
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </>
  );
};

export default Sidebar;
