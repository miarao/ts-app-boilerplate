import { AppBar, Box, Button, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material'
import React from 'react'
import { Link } from 'react-router-dom'

import owlNoBackground from '../assets/owl-no-bg.png'
import { routes } from '../routes/routes-config'

const NavBar: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <AppBar
      position="sticky"
      component="nav"
      sx={{
        borderRadius: theme.shape.borderRadius,
        mx: 'auto',
        mt: 2,
        width: '90%',
        backgroundImage: 'linear-gradient(70deg, papayawhip, snow, lightblue)',
        transition: 'opacity 0.5s ease-in-out',
        opacity: 0.3, // initial opacity
        '&:hover': {
          opacity: 0.8, // opacity on hover
        },
      }}
      aria-label="Main Navigation"
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            component="img"
            src={owlNoBackground}
            alt="Logo"
            sx={{
              width: 50,
              height: 50,
              mr: theme.spacing(2),
            }}
          />
          {!isMobile && (
            <Typography variant="h6" color="textPrimary">
              Mux - Music Experience
            </Typography>
          )}
        </Box>
        <Box>
          {Object.values(routes)
            // Filter out routes that should be hidden from the nav
            .filter(item => !item.hideFromNav)
            .map(item => (
              <Button
                key={item.label}
                sx={{ color: 'darkblue' }}
                component={Link} // Use Link as the underlying component
                to={item.path} // Set the route path
              >
                {item.label}
              </Button>
            ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default NavBar
