import React from 'react'
import { cn } from '@/lib/utils'

interface CardContainerProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function CardContainer({ 
  title, 
  description, 
  children, 
  className 
}: CardContainerProps) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow", className)}>
      <div className="p-6">
        <div className="flex flex-col space-y-1.5 pb-4">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  )
} 