import React from 'react';
import styled from 'styled-components';
import { FiActivity, FiFolderPlus, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const PageSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const StatCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  transition: ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.glow};
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const StatTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
`;

const StatIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.base};
  background-color: ${({ theme, color }) => theme.colors[color] + '20'};
  color: ${({ theme, color }) => theme.colors[color]};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatDescription = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: between;
`;

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const CardContent = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const EmptyStateIcon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto ${({ theme }) => theme.spacing.md};
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.backgroundTertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};

  svg {
    width: 32px;
    height: 32px;
  }
`;

const EmptyStateText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  margin: 0;
`;

const Dashboard = () => {
  const stats = [
    {
      title: 'Active Vaults',
      value: '0',
      description: 'No vaults configured yet',
      icon: FiFolderPlus,
      color: 'primary'
    },
    {
      title: 'Last Sync',
      value: 'Never',
      description: 'No sync performed yet',
      icon: FiRefreshCw,
      color: 'warning'
    },
    {
      title: 'Notes Synced',
      value: '0',
      description: 'Total notes processed',
      icon: FiActivity,
      color: 'success'
    },
    {
      title: 'Sync Errors',
      value: '0',
      description: 'No errors detected',
      icon: FiAlertCircle,
      color: 'error'
    }
  ];

  return (
    <DashboardContainer>
      <PageHeader>
        <PageTitle>Dashboard</PageTitle>
        <PageSubtitle>
          Welcome to reMarkidian! Monitor your sync status and manage your vaults.
        </PageSubtitle>
      </PageHeader>

      <StatsGrid>
        {stats.map((stat, index) => (
          <StatCard key={index}>
            <StatHeader>
              <StatTitle>{stat.title}</StatTitle>
              <StatIcon color={stat.color}>
                <stat.icon />
              </StatIcon>
            </StatHeader>
            <StatValue>{stat.value}</StatValue>
            <StatDescription>{stat.description}</StatDescription>
          </StatCard>
        ))}
      </StatsGrid>

      <ContentGrid>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState>
              <EmptyStateIcon>
                <FiActivity />
              </EmptyStateIcon>
              <EmptyStateText>
                No recent activity. Start by creating a vault and syncing your notes.
              </EmptyStateText>
            </EmptyState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState>
              <EmptyStateIcon>
                <FiFolderPlus />
              </EmptyStateIcon>
              <EmptyStateText>
                Create your first vault to get started with syncing.
              </EmptyStateText>
            </EmptyState>
          </CardContent>
        </Card>
      </ContentGrid>
    </DashboardContainer>
  );
};

export default Dashboard;
