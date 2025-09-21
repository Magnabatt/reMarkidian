import React from 'react';
import styled from 'styled-components';
import { FiFolderPlus } from 'react-icons/fi';

const VaultsContainer = styled.div`
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

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['4xl']};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const EmptyStateIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto ${({ theme }) => theme.spacing.lg};
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.backgroundTertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};

  svg {
    width: 40px;
    height: 40px;
  }
`;

const EmptyStateTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const EmptyStateText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  margin: 0;
`;

const Vaults = () => {
  return (
    <VaultsContainer>
      <PageHeader>
        <PageTitle>Vaults</PageTitle>
        <PageSubtitle>
          Manage your Obsidian vaults and GitHub repositories.
        </PageSubtitle>
      </PageHeader>

      <EmptyState>
        <EmptyStateIcon>
          <FiFolderPlus />
        </EmptyStateIcon>
        <EmptyStateTitle>No Vaults Yet</EmptyStateTitle>
        <EmptyStateText>
          Create your first vault to start syncing your reMarkable notes to Obsidian and GitHub.
        </EmptyStateText>
      </EmptyState>
    </VaultsContainer>
  );
};

export default Vaults;
