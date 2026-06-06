import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm'; // We'll write this or use native states
import { Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-zinc-100 tracking-tight text-center mb-6">Account Log In</h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg pl-10 pr-4 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-brand-500 transition-colors"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg pl-10 pr-4 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-brand-500 transition-colors"
              required
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-500 text-zinc-950 font-bold rounded-lg text-sm transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Logging in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Register Redirect */}
      <div className="mt-6 text-center">
        <p className="text-sm text-zinc-500">
          New to VendorBridge?{' '}
          <Link to="/register" className="text-brand-500 hover:underline font-semibold transition-colors">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
