import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiWifi, FiWifiOff, FiCheck, FiX, FiLoader, FiAlertCircle } from 'react-icons/fi';
import api from '../utils/api';

const SettingsSection = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme, status }) => {
    switch (status) {
      case 'connected': return theme.colors.success + '20';
      case 'disconnected': return theme.colors.backgroundTertiary;
      case 'error': return theme.colors.error + '20';
      default: return theme.colors.backgroundTertiary;
    }
  }};
  border: 1px solid ${({ theme, status }) => {
    switch (status) {
      case 'connected': return theme.colors.success + '40';
      case 'disconnected': return theme.colors.border;
      case 'error': return theme.colors.error + '40';
      default: return theme.colors.border;
    }
  }};
`;

const StatusIcon = styled.div`
  color: ${({ theme, status }) => {
    switch (status) {
      case 'connected': return theme.colors.success;
      case 'disconnected': return theme.colors.textMuted;
      case 'error': return theme.colors.error;
      default: return theme.colors.textMuted;
    }
  }};
`;

const StatusText = styled.div`
  flex: 1;
`;

const StatusTitle = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatusSubtitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SetupForm = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.backgroundTertiary};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.base};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const SecondaryButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.backgroundTertiary};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  }
`;

const DangerButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.error};
  color: white;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.error}dd;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const Instructions = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundTertiary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const InstructionsTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const InstructionsList = styled.ol`
  color: ${({ theme }) => theme.colors.textSecondary};
  padding-left: ${({ theme }) => theme.spacing.lg};
  
  li {
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  }
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error}20;
  border: 1px solid ${({ theme }) => theme.colors.error}40;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.error};
  margin-top: ${({ theme }) => theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const RemarkableSettings = () => {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [oneTimeCode, setOneTimeCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  const fetchConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings/remarkable/status');
      setConnectionStatus(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching connection status:', err);
      setError('Failed to fetch connection status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!oneTimeCode.trim()) {
      setError('Please enter a one-time code');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      const response = await api.post('/settings/remarkable/connect', {
        oneTimeCode: oneTimeCode.trim()
      });

      if (response.data.success) {
        setOneTimeCode('');
        await fetchConnectionStatus();
      } else {
        setError(response.data.message || 'Failed to connect');
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.response?.data?.message || 'Failed to connect to reMarkable Cloud');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setError('');

    try {
      const response = await api.post('/settings/remarkable/test');
      
      if (response.data.success) {
        await fetchConnectionStatus();
      } else {
        setError(response.data.message || 'Connection test failed');
      }
    } catch (err) {
      console.error('Test error:', err);
      setError(err.response?.data?.message || 'Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect from reMarkable Cloud? This will remove all stored tokens.')) {
      return;
    }

    setIsDisconnecting(true);
    setError('');

    try {
      const response = await api.delete('/settings/remarkable/disconnect');
      
      if (response.data.success) {
        await fetchConnectionStatus();
      } else {
        setError(response.data.message || 'Failed to disconnect');
      }
    } catch (err) {
      console.error('Disconnect error:', err);
      setError(err.response?.data?.message || 'Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getStatusIcon = () => {
    if (loading) return <FiLoader className="animate-spin" />;
    
    switch (connectionStatus?.connectionStatus) {
      case 'connected': return <FiWifi />;
      case 'error': return <FiAlertCircle />;
      default: return <FiWifiOff />;
    }
  };

  const getStatusTitle = () => {
    if (loading) return 'Checking connection...';
    
    switch (connectionStatus?.connectionStatus) {
      case 'connected': return 'Connected to reMarkable Cloud';
      case 'error': return 'Connection Error';
      default: return 'Not Connected';
    }
  };

  const getStatusSubtitle = () => {
    if (loading) return 'Please wait...';
    
    if (connectionStatus?.connectionStatus === 'connected') {
      const { totalSyncs, successfulSyncs, lastSync } = connectionStatus;
      const lastSyncText = lastSync ? new Date(lastSync).toLocaleString() : 'Never';
      return `${successfulSyncs}/${totalSyncs} successful syncs • Last sync: ${lastSyncText}`;
    }
    
    return connectionStatus?.message || 'Configure your reMarkable Cloud connection';
  };

  return (
    <SettingsSection>
      <SectionTitle>
        <FiWifi />
        reMarkable Integration
      </SectionTitle>

      <ConnectionStatus status={connectionStatus?.connectionStatus}>
        <StatusIcon status={connectionStatus?.connectionStatus}>
          {getStatusIcon()}
        </StatusIcon>
        <StatusText>
          <StatusTitle>{getStatusTitle()}</StatusTitle>
          <StatusSubtitle>{getStatusSubtitle()}</StatusSubtitle>
        </StatusText>
      </ConnectionStatus>

      {connectionStatus?.connectionStatus !== 'connected' && (
        <>
          <Instructions>
            <InstructionsTitle>How to Connect</InstructionsTitle>
            <InstructionsList>
              <li>Open the reMarkable mobile app or go to <strong>my.remarkable.com</strong></li>
              <li>Navigate to <strong>Settings → Connect/Sync</strong></li>
              <li>Select <strong>Connect to third-party app</strong></li>
              <li>Copy the 8-character one-time code</li>
              <li>Paste the code below and click Connect</li>
            </InstructionsList>
          </Instructions>

          <SetupForm>
            <form onSubmit={handleConnect}>
              <FormGroup>
                <Label htmlFor="oneTimeCode">One-Time Code</Label>
                <Input
                  id="oneTimeCode"
                  type="text"
                  value={oneTimeCode}
                  onChange={(e) => setOneTimeCode(e.target.value)}
                  placeholder="Enter 8-character code"
                  maxLength={8}
                  disabled={isConnecting}
                />
              </FormGroup>
              
              <PrimaryButton type="submit" disabled={isConnecting || !oneTimeCode.trim()}>
                {isConnecting ? <FiLoader className="animate-spin" /> : <FiCheck />}
                {isConnecting ? 'Connecting...' : 'Connect'}
              </PrimaryButton>
            </form>
          </SetupForm>
        </>
      )}

      {connectionStatus?.connectionStatus === 'connected' && (
        <ButtonGroup>
          <SecondaryButton onClick={handleTestConnection} disabled={isTesting}>
            {isTesting ? <FiLoader className="animate-spin" /> : <FiCheck />}
            {isTesting ? 'Testing...' : 'Test Connection'}
          </SecondaryButton>
          
          <DangerButton onClick={handleDisconnect} disabled={isDisconnecting}>
            {isDisconnecting ? <FiLoader className="animate-spin" /> : <FiX />}
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </DangerButton>
        </ButtonGroup>
      )}

      {error && (
        <ErrorMessage>
          <FiAlertCircle />
          {error}
        </ErrorMessage>
      )}
    </SettingsSection>
  );
};

export default RemarkableSettings;
