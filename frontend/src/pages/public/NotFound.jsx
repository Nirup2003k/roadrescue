import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon } from 'lucide-react';
import Button from '../../components/ui/Button';
export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4">
      <AlertOctagon className="h-12 w-12 text-beacon-500" />
      <h1 className="font-display font-extrabold text-3xl text-ink mt-4">Page not found</h1>
      <p className="text-slate-500 mt-2 max-w-sm">The page you're looking for took a wrong turn.</p>
      <Link to="/" className="mt-6"><Button>Back to home</Button></Link>
    </div>
  );
}
