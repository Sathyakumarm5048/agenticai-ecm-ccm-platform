import { ReactNode } from 'react'
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import LayersIcon from '@mui/icons-material/Layers'
import HistoryIcon from '@mui/icons-material/History'
import SettingsIcon from '@mui/icons-material/Settings'

export interface LayoutNavItem {
  label: string
  href: string
  icon?: ReactNode
}

interface LayoutProps {
  children: ReactNode
  title?: string
  navItems?: LayoutNavItem[]
  onNavigate?: (href: string) => void
}

const defaultNavItems: LayoutNavItem[] = [
  { label: 'Workflows', href: '/', icon: <AccountTreeIcon /> },
  { label: 'Templates', href: '/templates', icon: <LayersIcon /> },
  { label: 'History', href: '/versions', icon: <HistoryIcon /> },
  { label: 'Configuration', href: '/admin', icon: <SettingsIcon /> },
]

const drawerWidth = 260

export default function Layout({ children, title = 'AgenticAI Design Studio', navItems = defaultNavItems, onNavigate }: LayoutProps): JSX.Element {
  const theme = useTheme()
  const activePath = typeof window !== 'undefined' ? window.location.pathname : '/'

  const handleNavigation = (href: string) => {
    if (onNavigate) {
      onNavigate(href)
    } else {
      window.location.href = href
    }
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div">
            {title}
          </Typography>
          <Typography variant="body2" color="inherit">
            Workflow authoring and orchestration platform
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <Box sx={{ px: 3, py: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Navigation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the menu to browse workflows, templates, and execution history.
            </Typography>
          </Box>
          <Divider />
          <List>
            {navItems.map((item) => (
              <ListItemButton
                key={item.href}
                selected={activePath.startsWith(item.href)}
                onClick={() => handleNavigation(item.href)}
              >
                {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
