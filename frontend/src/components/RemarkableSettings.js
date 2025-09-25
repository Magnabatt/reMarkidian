import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiWifi, FiWifiOff, FiCheck, FiX, FiLoader, FiAlertCircle } from 'react-icons/fi';
import api, { settingsAPI } from '../utils/api';

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
      case 'registered': return theme.colors.success + '20';
      case 'disconnected': return theme.colors.backgroundTertiary;
      case 'error': return theme.colors.error + '20';
      default: return theme.colors.backgroundTertiary;
    }
  }};
  border: 1px solid ${({ theme, status }) => {
    switch (status) {
      case 'registered': return theme.colors.success + '40';
      case 'disconnected': return theme.colors.border;
      case 'error': return theme.colors.error + '40';
      default: return theme.colors.border;
    }
  }};
`;

const StatusIcon = styled.div`
  color: ${({ theme, status }) => {
    switch (status) {
      case 'registered': return theme.colors.success;
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

const SuccessMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.success}20;
  border: 1px solid ${({ theme }) => theme.colors.success}40;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.success};
  margin-top: ${({ theme }) => theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const TokenDisplay = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundTertiary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  word-break: break-all;
`;

const TokenLabel = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-family: inherit;
`;

const RemarkableSettings = () => {
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [oneTimeCode, setOneTimeCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshResult, setRefreshResult] = useState(null);

  useEffect(() => {
    fetchRegistrationStatus();
  }, []);

  const fetchRegistrationStatus = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.remarkable.getStatus();
      setRegistrationStatus(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching registration status:', err);
      setError('Failed to fetch registration status');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!oneTimeCode.trim()) {
      setError('Please enter a one-time code');
      return;
    }

    setIsRegistering(true);
    setError('');

    try {
      const response = await settingsAPI.remarkable.connect(oneTimeCode.trim());

      if (response.data.success) {
        setOneTimeCode('');
        await fetchRegistrationStatus();
      } else {
        setError(response.data.message || 'Failed to register device');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Failed to register device with reMarkable Cloud');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError('');
    setRefreshResult(null);

    try {
      const response = await settingsAPI.remarkable.refresh();
      
      if (response.data.success) {
        setRefreshResult(response.data);
        await fetchRegistrationStatus();
      } else {
        setError(response.data.message || 'Failed to refresh token');
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError(err.response?.data?.message || 'Failed to refresh token');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to clear the device registration? This will only remove the local token. To fully remove the device from your reMarkable account, you must visit the reMarkable Device Management Portal.')) {
      return;
    }

    setIsDisconnecting(true);
    setError('');

    try {
      const response = await settingsAPI.remarkable.disconnect();
      
      if (response.data.success) {
        setRefreshResult(null);
        await fetchRegistrationStatus();
      } else {
        setError(response.data.message || 'Failed to clear registration');
      }
    } catch (err) {
      console.error('Disconnect error:', err);
      setError(err.response?.data?.message || 'Failed to clear registration');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getStatusIcon = () => {
    if (loading) return <FiLoader className="animate-spin" />;
    
    switch (registrationStatus?.connectionStatus) {
      case 'registered': return <FiWifi />;
      case 'error': return <FiAlertCircle />;
      default: return <FiWifiOff />;
    }
  };

  const getStatusTitle = () => {
    if (loading) return 'Checking registration...';
    
    switch (registrationStatus?.connectionStatus) {
      case 'registered': return 'Device Registered';
      case 'error': return 'Registration Error';
      default: return 'Device Not Registered';
    }
  };

  const getStatusSubtitle = () => {
    if (loading) return 'Please wait...';
    
    if (registrationStatus?.connectionStatus === 'registered') {
      const deviceId = registrationStatus.deviceId;
      return deviceId ? `Device ID: ${deviceId}` : 'Device registered with reMarkable Cloud';
    }
    
    return registrationStatus?.message || 'Register your device to connect with reMarkable Cloud';
  };

  return (
    <SettingsSection>
      <SectionTitle>
        <FiWifi />
        reMarkable Integration
      </SectionTitle>

      <ConnectionStatus status={registrationStatus?.connectionStatus}>
        <StatusIcon status={registrationStatus?.connectionStatus}>
          {getStatusIcon()}
        </StatusIcon>
        <StatusText>
          <StatusTitle>{getStatusTitle()}</StatusTitle>
          <StatusSubtitle>{getStatusSubtitle()}</StatusSubtitle>
        </StatusText>
      </ConnectionStatus>

      {registrationStatus?.connectionStatus !== 'registered' && (
        <>
          <Instructions>
            <InstructionsTitle>How to Register Device</InstructionsTitle>
            <InstructionsList>
              <li>Open the reMarkable mobile app or go to <strong><a href="https://my.remarkable.com/#desktop" target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'underline'}}>my.remarkable.com/#desktop</a></strong></li>
              <li>Navigate to <strong>Settings → Connect/Sync</strong></li>
              <li>Select <strong>Connect to third-party app</strong></li>
              <li>Copy the 8-character one-time code</li>
              <li>Paste the code below and click Register</li>
            </InstructionsList>
          </Instructions>

          <SetupForm>
            <form onSubmit={handleRegister}>
              <FormGroup>
                <Label htmlFor="oneTimeCode">One-Time Code</Label>
                <Input
                  id="oneTimeCode"
                  type="text"
                  value={oneTimeCode}
                  onChange={(e) => setOneTimeCode(e.target.value)}
                  placeholder="Enter 8-character code"
                  maxLength={8}
                  disabled={isRegistering}
                />
              </FormGroup>
              
              <PrimaryButton type="submit" disabled={isRegistering || !oneTimeCode.trim()}>
                {isRegistering ? <FiLoader className="animate-spin" /> : <FiCheck />}
                {isRegistering ? 'Registering...' : 'Register Device'}
              </PrimaryButton>
            </form>
          </SetupForm>
        </>
      )}

      {registrationStatus?.connectionStatus === 'registered' && (
        <>
          {registrationStatus.deviceToken && (
            <TokenDisplay>
              <TokenLabel>Device Token (for testing):</TokenLabel>
              {registrationStatus.deviceToken}
            </TokenDisplay>
          )}

          <Instructions>
            <InstructionsTitle>Device Management</InstructionsTitle>
            <InstructionsList>
              <li>Your device is registered with reMarkable Cloud</li>
              <li>To remove this device from your reMarkable account, visit the <strong><a href="https://my.remarkable.com/device/" target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'underline'}}>reMarkable Device Management Portal</a></strong></li>
              <li>The "Clear Registration" button below only removes the local token from reMarkidian</li>
            </InstructionsList>
          </Instructions>

          <ButtonGroup>
            <SecondaryButton onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <FiLoader className="animate-spin" /> : <FiCheck />}
              {isRefreshing ? 'Refreshing...' : 'Refresh Token'}
            </SecondaryButton>
            
            <DangerButton onClick={handleDisconnect} disabled={isDisconnecting}>
              {isDisconnecting ? <FiLoader className="animate-spin" /> : <FiX />}
              {isDisconnecting ? 'Clearing...' : 'Clear Registration'}
            </DangerButton>
          </ButtonGroup>

          {refreshResult && (
            <SuccessMessage>
              <FiCheck />
              Token refreshed successfully! Old: {refreshResult.oldToken} → New: {refreshResult.newToken}
            </SuccessMessage>
          )}
        </>
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
