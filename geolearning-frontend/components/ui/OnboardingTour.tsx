'use client'

import React, { useEffect, useState } from 'react'
import { Joyride, Step, EventData } from 'react-joyride'
import { useTour } from '@/components/providers/TourProvider'
import { CustomTooltip } from './CustomTooltip'

interface OnboardingTourProps {
  tourKey: string
  steps: Step[]
}

export function OnboardingTour({ tourKey, steps }: OnboardingTourProps) {
  const { activeTour, stopTour } = useTour()
  const [run, setRun] = useState(false)

  // Start the tour automatically if it's the first time
  useEffect(() => {
    const hasSeen = localStorage.getItem(`tour_${tourKey}`)
    if (!hasSeen && activeTour === null) {
      // Small delay to ensure elements are mounted
      const timer = setTimeout(() => {
        setRun(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [tourKey, activeTour])

  // Start the tour if it's manually triggered
  useEffect(() => {
    if (activeTour === tourKey) {
      setRun(true)
    } else if (activeTour !== null && activeTour !== tourKey) {
      setRun(false)
    }
  }, [activeTour, tourKey])

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data
    if (status === 'finished' || status === 'skipped') {
      setRun(false)
      stopTour()
      localStorage.setItem(`tour_${tourKey}`, 'true')
    }
  }

  return (
    <Joyride
      onEvent={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      steps={steps}
      tooltipComponent={CustomTooltip}
      options={{
        zIndex: 10000,
        primaryColor: '#2563EB',
        textColor: '#334155',
        backgroundColor: '#ffffff',
        arrowColor: '#ffffff',
        showProgress: true,
        buttons: ['back', 'primary', 'skip'],
      }}
    />
  )
}
