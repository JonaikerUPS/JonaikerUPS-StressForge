"use client";

import Link from 'next/link';
import { useLoading } from '@/lib/loading-context';
import { ComponentProps } from 'react';

export const LoadingLink = ({ 
  href, 
  children, 
  onClick,
  ...props 
}: ComponentProps<typeof Link>) => {
  const { startLoading } = useLoading();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    startLoading();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link 
      href={href} 
      onClick={handleClick} 
      {...props}
    >
      {children}
    </Link>
  );
};
