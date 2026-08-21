'use client'

import React, { useEffect, useState } from 'react'
import { Joyride, Step, EventData } from 'react-joyride'
import { useTour } from '@/components/providers/TourProvider'
import { CustomTooltip } from './CustomTooltip'
import { createClient } from '@/lib/supabase/client'

interface OnboardingTourProps {
  tourKey: string
  steps: Step[]
}

export function OnboardingTour({ tourKey, steps }: OnboardingTourProps) {
  const { activeTour, stopTour } = useTour()
  const [run, setRun] = useState(false)

  // Start the tour automatically if it's the first time
  useEffect(() => {
    const checkAndStartTour = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const storageKey = `tour_${user.id}_${tourKey}`
      const hasSeen = localStorage.getItem(storageKey)
      
      if (!hasSeen && activeTour === null) {
        // Small delay to ensure elements are mounted
        const timer = setTimeout(() => {
          setRun(true)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
    checkAndStartTour()
  }, [tourKey, activeTour])

  // Start the tour if it's manually triggered
  useEffect(() => {
    let frameId: number;
    if (activeTour === tourKey) {
      frameId = requestAnimationFrame(() => setRun(true))
    } else if (activeTour !== null && activeTour !== tourKey) {
      frameId = requestAnimationFrame(() => setRun(false))
    }
    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [activeTour, tourKey])

  const handleJoyrideCallback = async (data: EventData) => {
    const { status } = data
    if (status === 'finished' || status === 'skipped') {
      setRun(false)
      stopTour()
      
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        localStorage.setItem(`tour_${user.id}_${tourKey}`, 'true')
      }
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
