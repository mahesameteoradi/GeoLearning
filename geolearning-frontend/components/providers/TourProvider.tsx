'use client'

import React, { createContext, useContext, useState } from 'react'

interface TourContextType {
  activeTour: string | null
  startTour: (tourKey: string) => void
  stopTour: () => void
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [activeTour, setActiveTour] = useState<string | null>(null)

  const startTour = (tourKey: string) => {
    setActiveTour(tourKey)
  }

  const stopTour = () => {
    setActiveTour(null)
  }

  return (
    <TourContext.Provider value={{ activeTour, startTour, stopTour }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}
