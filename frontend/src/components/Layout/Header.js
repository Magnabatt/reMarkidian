import React from 'react';
import styled from 'styled-components';
import { FiRefreshCw, FiBell, FiSettings } from 'react-icons/fi';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  min-height: 70px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes.xl};
  }
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: none;
  }
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.base};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: ${({ theme }) => theme.transitions.base};
  position: relative;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceHover};
    color: ${({ theme }) => theme.colors.text};
  }

  &:active {
    background-color: ${({ theme }) => theme.colors.surfaceActive};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const SyncButton = styled(IconButton)`
  background: ${({ theme }) => theme.colors.gradientPrimary};
  color: white;
  
  &:hover {
    background: ${({ theme }) => theme.colors.gradientPrimary};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.glow};
  }

  &.syncing {
    svg {
      animation: spin 1s linear infinite;
    }
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background-color: ${({ theme }) => theme.colors.error};
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.colors.backgroundSecondary};
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ theme, status }) => 
    status === 'online' ? theme.colors.success + '20' :
    status === 'syncing' ? theme.colors.warning + '20' :
    theme.colors.error + '20'
  };
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: none;
  }
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ theme, status }) => 
    status === 'online' ? theme.colors.success :
    status === 'syncing' ? theme.colors.warning :
    theme.colors.error
  };
`;

const StatusText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const Header = () => {
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [status, setStatus] = React.useState('online'); // online, syncing, offline
  const [hasNotifications, setHasNotifications] = React.useState(true);

  const handleSyncClick = () => {
    setIsSyncing(true);
    setStatus('syncing');
    
    // Simulate sync process
    setTimeout(() => {
      setIsSyncing(false);
      setStatus('online');
    }, 3000);
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Connected';
      case 'syncing':
        return 'Syncing...';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return (
    <HeaderContainer>
      <HeaderLeft>
        <div>
          <Title>reMarkidian</Title>
          <Subtitle>Sync your reMarkable notes to Obsidian & GitHub</Subtitle>
        </div>
      </HeaderLeft>
      
      <HeaderRight>
        <StatusIndicator status={status}>
          <StatusDot status={status} />
          <StatusText>{getStatusText()}</StatusText>
        </StatusIndicator>
        
        <SyncButton 
          onClick={handleSyncClick}
          className={isSyncing ? 'syncing' : ''}
          title="Sync Now"
        >
          <FiRefreshCw />
        </SyncButton>
        
        <IconButton title="Notifications">
          <FiBell />
          {hasNotifications && <NotificationBadge />}
        </IconButton>
        
        <IconButton title="Settings">
          <FiSettings />
        </IconButton>
      </HeaderRight>
    </HeaderContainer>
  );
};

export default Header;
