import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'XOPS Panel',
  description: 'XOPS Admin Panel',
};

export default function PanelPage() {
  redirect('/panel/dashboard');
}
