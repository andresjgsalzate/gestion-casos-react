import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Work as CaseIcon,
  Assignment as TodoIcon,
  Assessment as ReportIcon,
  Settings as AdminIcon,
  AccountCircle,
  Logout,
  Category as ClassificationIcon,
  Archive as ArchiveIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  ChevronLeft as ChevronLeftIcon,
  BusinessCenter as BusinessCenterIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSessionManager } from '../../hooks/useSessionManager';
import { useTimerManager } from '../../hooks/useTimerManager';
import { useThemeContext } from '../../contexts/ThemeContext';
import ActiveTimerIndicator from '../Common/ActiveTimerIndicator';
import VersionDisplay from '../Common/VersionDisplay';

const drawerWidth = 280; // Aumentado para mostrar el título completo
const drawerWidthCollapsed = 64;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { logoutWithTimerSave } = useSessionManager();
  const { timer, activeTimers, stopTimer } = useTimerManager();
  const { isDarkMode, toggleTheme } = useThemeContext();

  const currentDrawerWidth = isCollapsed ? drawerWidthCollapsed : drawerWidth;

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleProfileMenuClose();
  };

  const handleLogout = async () => {
    await logoutWithTimerSave();
    localStorage.removeItem('currentUser');
    navigate('/login');
    handleProfileMenuClose();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Clasificación de Casos', icon: <ClassificationIcon />, path: '/classification' },
    { text: 'Control de Casos', icon: <CaseIcon />, path: '/cases' },
    { text: 'TODOs', icon: <TodoIcon />, path: '/todos' },
    { text: 'Archivo', icon: <ArchiveIcon />, path: '/archive' },
    { text: 'Reportes', icon: <ReportIcon />, path: '/reports' },
    { text: 'Administración', icon: <AdminIcon />, path: '/admin' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          px: 1,
          minHeight: '48px !important',
        }}
      >
        {!isCollapsed && (
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Gestión de Casos
          </Typography>
        )}
        {isCollapsed && (
          <Tooltip title="Expandir menú - Gestión de Casos" placement="right">
            <IconButton
              onClick={handleCollapseToggle}
              sx={{
                minWidth: 48,
                minHeight: 48,
                padding: 1,
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <BusinessCenterIcon />
            </IconButton>
          </Tooltip>
        )}
        {!isCollapsed && (
          <IconButton
            onClick={handleCollapseToggle}
            size="small"
            sx={{
              padding: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, overflow: 'visible' }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Tooltip
              title={isCollapsed ? item.text : ''}
              placement="right"
              disableHoverListener={!isCollapsed}
            >
              <ListItemButton
                selected={location.pathname.startsWith(item.path)}
                onClick={() => navigate(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: isCollapsed ? 'center' : 'initial',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isCollapsed ? 0 : 3,
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!isCollapsed && <ListItemText primary={item.text} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        {!isCollapsed && <VersionDisplay showAsChip={true} />}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
          transition: 'width 0.3s ease, margin-left 0.3s ease',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => location.pathname.startsWith(item.path))?.text || 'Dashboard'}
          </Typography>
          
          <ActiveTimerIndicator
            timerRunning={timer.running}
            timerSeconds={timer.seconds}
            activeTimersCount={activeTimers.length}
            onStopTimer={stopTimer}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Botón de toggle del tema */}
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              aria-label="toggle theme"
              sx={{ mr: 1 }}
            >
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user?.name || 'Usuario'}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="profile-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.name?.charAt(0) || <AccountCircle />}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Perfil
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Cerrar Sesión
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth, // En móvil siempre expandido
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: currentDrawerWidth,
              transition: 'width 0.3s ease',
              overflow: 'visible',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          transition: 'width 0.3s ease',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
