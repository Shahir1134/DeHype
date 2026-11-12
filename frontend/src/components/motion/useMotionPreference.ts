import { useAppStore } from '../../store/useAppStore'
import { isLowEndDevice } from '../../motion'

export const useMotionPreference = () => {
  const reduceMotion = useAppStore(state => state.reduceMotion)
  const isLowEnd = typeof window !== 'undefined' ? isLowEndDevice() : false
  return {
    isReduced: reduceMotion || isLowEnd,
  }
}
