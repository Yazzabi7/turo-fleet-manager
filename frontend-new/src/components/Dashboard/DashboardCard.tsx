import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, subtitle }) => {
  return (
    <Card sx={{ minWidth: 275, height: '100%' }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
        {subtitle && (
          <Typography sx={{ mb: 1.5 }} color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
