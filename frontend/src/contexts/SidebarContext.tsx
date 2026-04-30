import { createContext, useContext, useState, type ReactNode } from 'react'

interface SidebarContextType {
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [sidebarWidth, setSidebarWidth] = useState(280)

  return (
    <SidebarContext.Provider value={{ sidebarWidth, setSidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}
