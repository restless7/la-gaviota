import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50/30 px-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-slate-800 font-serif mb-2">La Gaviota</h1>
          <p className="text-gray-500 font-medium">Inicia sesión para acceder a tu portal</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-2xl border-0 rounded-2xl',
            }
          }}
        />
      </div>
    </div>
  );
}
