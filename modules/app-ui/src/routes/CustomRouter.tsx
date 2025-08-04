// CustomRouter.tsx
import React, { lazy, Suspense, useMemo } from 'react'
import { Route, Routes } from 'react-router-dom'

import LayoutSelector from '../pages/layouts/LayoutSelector'
import { routes } from './routes-config'

const CustomRouter: React.FC = () => {
  // Create lazy components once.
  const routeComponents = useMemo(
    () =>
      Object.values(routes).map(({ path, component }) => ({
        path,
        LazyComponent: lazy(component),
      })),
    [],
  )

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {routeComponents.map(({ path, LazyComponent }) => (
          <Route key={path} path={path} element={<LayoutSelector Component={LazyComponent} />} />
        ))}
      </Routes>
    </Suspense>
  )
}

export default CustomRouter
