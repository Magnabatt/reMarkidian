import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { 
  FiHome, 
  FiFolderPlus, 
  FiFileText, 
  FiSettings, 
  FiActivity,
  FiGithub,
  FiBook
} from 'react-icons/fi';

const SidebarContainer = styled.aside`
  width: 280px;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: 240px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    position: fixed;
    left: ${({ isOpen }) => isOpen ? '0' : '-280px'};
    top: 0;
    z-index: ${({ theme }) => theme.zIndex.fixed};
    transition: left ${({ theme }) => theme.transitions.base};
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const Logo = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${({ theme }) => theme.colors.gradientPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;

const LogoText = styled.div`
  display: flex;
  flex-direction: column;
`;

const LogoTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const LogoSubtitle = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.normal};
`;

const Navigation = styled.nav`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md} 0;
`;

const NavSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const NavSectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
  padding: 0 ${({ theme }) => theme.spacing.lg};
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const NavItem = styled.li`
  margin: 0;
`;

const NavLinkStyled = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  transition: ${({ theme }) => theme.transitions.base};
  position: relative;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceHover};
    color: ${({ theme }) => theme.colors.text};
  }

  &.active {
    background-color: ${({ theme }) => theme.colors.primary + '20'};
    color: ${({ theme }) => theme.colors.primary};
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: ${({ theme }) => theme.colors.primary};
    }
  }

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

const Footer = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin-top: auto;
`;

const FooterText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  text-align: center;
`;

const Sidebar = ({ isOpen = true }) => {
  const location = useLocation();

  const navigationItems = [
    {
      section: 'Main',
      items: [
        { path: '/', label: 'Dashboard', icon: FiHome },
        { path: '/vaults', label: 'Vaults', icon: FiFolderPlus },
        { path: '/markdown', label: 'Markdown Viewer', icon: FiBook },
      ]
    },
    {
      section: 'Monitoring',
      items: [
        { path: '/logs', label: 'Logs', icon: FiFileText },
        { path: '/activity', label: 'Activity', icon: FiActivity },
      ]
    },
    {
      section: 'Configuration',
      items: [
        { path: '/settings', label: 'Settings', icon: FiSettings },
      ]
    }
  ];

  return (
    <SidebarContainer isOpen={isOpen}>
      <Logo>
        <LogoIcon>R</LogoIcon>
        <LogoText>
          <LogoTitle>reMarkidian</LogoTitle>
          <LogoSubtitle>v1.0.0</LogoSubtitle>
        </LogoText>
      </Logo>

      <Navigation>
        {navigationItems.map((section, sectionIndex) => (
          <NavSection key={sectionIndex}>
            <NavSectionTitle>{section.section}</NavSectionTitle>
            <NavList>
              {section.items.map((item, itemIndex) => (
                <NavItem key={itemIndex}>
                  <NavLinkStyled
                    to={item.path}
                    className={({ isActive }) => isActive ? 'active' : ''}
                  >
                    <item.icon />
                    {item.label}
                  </NavLinkStyled>
                </NavItem>
              ))}
            </NavList>
          </NavSection>
        ))}
      </Navigation>

      <Footer>
        <FooterText>
          Made with ❤️ for reMarkable users
        </FooterText>
      </Footer>
    </SidebarContainer>
  );
};

export default Sidebar;
