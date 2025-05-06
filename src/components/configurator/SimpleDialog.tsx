'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DialogContextType {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  toggleDialog: () => void;
}

const DialogContext = createContext<DialogContextType>({
  isOpen: false,
  openDialog: () => {},
  closeDialog: () => {},
  toggleDialog: () => {},
});

export function Dialog({ 
  open, 
  onOpenChange, 
  children 
}: { 
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : isOpenInternal;
  
  const openDialog = useCallback(() => {
    if (!isControlled) {
      setIsOpenInternal(true);
    }
    onOpenChange?.(true);
  }, [isControlled, onOpenChange]);
  
  const closeDialog = useCallback(() => {
    if (!isControlled) {
      setIsOpenInternal(false);
    }
    onOpenChange?.(false);
  }, [isControlled, onOpenChange]);
  
  const toggleDialog = useCallback(() => {
    if (!isControlled) {
      setIsOpenInternal(prev => !prev);
    }
    onOpenChange?.(!isOpen);
  }, [isControlled, isOpen, onOpenChange]);
  
  const value = {
    isOpen,
    openDialog,
    closeDialog,
    toggleDialog,
  };
  
  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  );
}

interface ButtonLikeElement {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export function DialogTrigger({ 
  asChild, 
  children 
}: { 
  asChild?: boolean;
  children: React.ReactElement;
}) {
  const { openDialog } = useContext(DialogContext);
  
  if (asChild && React.isValidElement<ButtonLikeElement>(children)) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        children.props.onClick?.(e);
        openDialog();
      }
    } as React.HTMLAttributes<HTMLElement>);
  } 
  
  return (
    <button type="button" onClick={openDialog}>
      {children}
    </button>
  );
}

export function DialogContent({ 
  className = '', 
  children 
}: { 
  className?: string;
  children: ReactNode;
}) {
  const { isOpen, closeDialog } = useContext(DialogContext);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={closeDialog}
      />
      <div 
        className={`relative bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-md w-full mx-auto ${className}`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ 
  className = '', 
  children 
}: { 
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function DialogTitle({ 
  className = '', 
  children 
}: { 
  className?: string;
  children: ReactNode;
}) {
  return (
    <h2 className={`text-lg font-semibold ${className}`}>
      {children}
    </h2>
  );
}

export function DialogDescription({ 
  className = '', 
  children 
}: { 
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      {children}
    </p>
  );
} 