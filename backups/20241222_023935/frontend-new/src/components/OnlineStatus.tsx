import React from 'react';
import { Chip } from '@mui/material';
import { Wifi as WifiIcon, WifiOff as WifiOffIcon } from '@mui/icons-material';

interface OnlineStatusProps {
  isOnline: boolean;
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({ isOnline }) => {
  return (
    <Chip
      icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
      label={isOnline ? 'En ligne' : 'Hors ligne'}
      color={isOnline ? 'success' : 'error'}
      variant="outlined"
      size="small"
      sx={{ ml: 2 }}
    />
  );
};

export default OnlineStatus;
