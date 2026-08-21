'use client';

import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useThemeMode } from '@/theme/ThemeRegistry';
import Link from 'next/link';
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RuleIcon from '@mui/icons-material/Rule';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import WarningIcon from '@mui/icons-material/Warning';
import TaskIcon from '@mui/icons-material/Task';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BugReportIcon from '@mui/icons-material/BugReport';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import InventoryIcon from '@mui/icons-material/Inventory';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { logout } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';
import { tokenService } from '@/services/tokenService';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { useBreadcrumbOverrides } from '@/contexts/BreadcrumbContext';

const drawerWidth = 240;

// Static nav config: label, icon, and route only.
// Role-based visibility is NOT read from this file — it's checked live
// against the permissions slice (see getAllowedRoles below), so that
// admin changes on /admin/permissions take effect immediately without
// any code change here.
const navItems = [
  { label: 'Home', icon: <DashboardIcon />, href: '/' },
  { label: 'Projects', icon: <FolderIcon />, href: '/projects' },
  { label: 'Sites', icon: <LocationOnIcon />, href: '/sites' },
  { label: 'BOQ', icon: <DescriptionIcon />, href: '/boq' },
  { label: 'Daily Progress', icon: <AssignmentIcon />, href: '/daily-progress' },
  { label: 'Complaints', icon: <ReportProblemIcon />, href: '/complaints' },
  { label: 'Deviations', icon: <WarningIcon />, href: '/deviations' },
  
  //{ label: 'Workflows', icon: <RuleIcon />, href: '/workflows' },
  //{ label: 'Tasks', icon: <TaskIcon />, href: '/tasks' },
 
  //{ label: 'Snag List', icon: <BugReportIcon />, href: '/snag-list' },
  //{ label: 'Field Logs', icon: <EventNoteIcon />, href: '/field-logs' },
 // { label: 'Variation Orders', icon: <ChangeCircleIcon />, href: '/variation-orders' },
  { label: 'T&C Tests', icon: <FactCheckIcon />, href: '/acceptance-tests' },
  { label: 'IPC', icon: <ReceiptIcon />, href: '/ipc' },
  { label: 'Inventory', icon: <InventoryIcon />, href: '/inventory' },
  //{ label: 'FAC Readiness', icon: <VerifiedIcon />, href: '/fac-readiness' },
];

function generateBreadcrumbs(pathname: string, dashboardHref: string) {
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((segment, index) => {
    const isBareAdminSegment = segment === 'admin' && index === 0;
    const href = isBareAdminSegment ? dashboardHref : '/' + segments.slice(0, index + 1).join('/');
    const label = segment
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { href, label };
  });
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = React.useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = React.useState([
    { id: 1, message: 'BOQ published for Karachi CCTV Network', read: false, time: '10 min ago' },
    { id: 2, message: 'Deviation dev-1 approved by HOD', read: false, time: '1 hour ago' },
    { id: 3, message: 'IPC ipc-1 ready for Director approval', read: true, time: '3 hours ago' },
  ]);

  const userRole = useSelector((state: RootState) => state.auth.user?.roles?.[0]);
  const dashboardHref = userRole ? `/${userRole.toLowerCase()}` : '/';

  const modulePermissions = useSelector((state: RootState) => state.permissions.modules);

  const getAllowedRoles = (href: string): string[] => {
    const match = modulePermissions.find((m) => m.key === href);
    return match ? match.allowedRoles : [];
  };
  const { hasAnyRole } = usePermission();
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { overrides } = useBreadcrumbOverrides();
  const breadcrumbs = generateBreadcrumbs(pathname, dashboardHref).map((crumb) => ({
    ...crumb,
    label: overrides[crumb.href] ?? crumb.label,
  }));
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const visibleNavItems = navItems
    .map((item) => (item.label === 'Home' ? { ...item, href: dashboardHref } : item))
    .filter((item) => {
      if (item.label === 'Home') return true;
      const allowedRoles = getAllowedRoles(item.href);
      return allowedRoles.length === 0 || hasAnyRole(allowedRoles);
    });

  const { isDark, toggleTheme } = useThemeMode();
  const drawerContent = (
    <Box>
      <Toolbar />
      <List>
        {visibleNavItems.map((item) => (
          <ListItemButton
            key={item.label}
            component={Link}
            href={item.href}
            selected={
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            }
            onClick={() => setMobileOpen(false)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderLeft: '3px solid #fff',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" color="primary" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="open navigation menu"
            onClick={() => setMobileOpen((p) => !p)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            SC-GIMS
          </Typography>
          <IconButton color="inherit" onClick={toggleTheme} aria-label="toggle dark mode">
            {isDark ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          {/* Notification Bell */}
          <IconButton
            color="inherit"
            aria-label="notifications"
            onClick={(e) => setNotifAnchor(e.currentTarget)}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Popover
            open={Boolean(notifAnchor)}
            anchorEl={notifAnchor}
            onClose={() => setNotifAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ width: 320, p: 1 }}>
              <Typography variant="subtitle1" sx={{ p: 1, fontWeight: 600 }}>
                Notifications
              </Typography>
              <Divider />
              <List dense>
                {notifications.map((n) => (
                  <ListItem
                    key={n.id}
                    sx={{
                      bgcolor: n.read ? 'transparent' : 'action.hover',
                      borderRadius: 1,
                      mb: 0.5,
                    }}
                    secondaryAction={
                      !n.read && (
                        <Button size="small" onClick={() => handleMarkRead(n.id)}>
                          Mark read
                        </Button>
                      )
                    }
                  >
                    <ListItemText primary={n.message} secondary={n.time} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Popover>

          {/* User Menu */}
          <IconButton
            color="inherit"
            aria-label="user menu"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <AccountCircleIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem
              onClick={async () => {
                const refresh = tokenService.getRefreshToken();
                await authService.logout(refresh);
                dispatch(logout());
                setAnchorEl(null);
                router.push('/login');
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: isDark ? '#1e1e2e' : '#455A64',
              color: '#ffffff',
            },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: isDark ? '#1e1e2e' : '#455A64',
              color: '#ffffff',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {breadcrumbs.length > 0 && (
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
              <Link href={dashboardHref} style={{ textDecoration: 'none', color: 'inherit' }}>
                Home
              </Link>
              {breadcrumbs.map((crumb, index) =>
                index === breadcrumbs.length - 1 ? (
                  <Typography key={crumb.href} color="text.primary">
                    {crumb.label}
                  </Typography>
                ) : (
                  <Link
                    key={crumb.href}
                    href={crumb.href}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {crumb.label}
                  </Link>
                )
              )}
            </Breadcrumbs>
          )}
          {children}
        </Container>
      </Box>
    </Box>
  );
}
