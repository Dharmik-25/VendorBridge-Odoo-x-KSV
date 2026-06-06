import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Settings, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('vendor');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password, role);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-zinc-100 tracking-tight text-center mb-6">Create Account</h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Company / Full Name</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe or Acme Inc."
              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg pl-10 pr-4 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-brand-500 transition-colors"
              required
            />
          </div>
        </div>

        {/* Email Address */}
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

        {/* Password */}
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

        {/* System Role Selection */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">System Role</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
              <Settings className="w-4 h-4" />
            </span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg pl-10 pr-4 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-brand-500 transition-colors appearance-none cursor-pointer"
              required
            >
              <option value="vendor">Vendor (Self-Registration)</option>
              <option value="procurement_officer">Procurement Officer</option>
              <option value="manager">Manager / Approver</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-500 text-zinc-950 font-bold rounded-lg text-sm transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Registering...
            </>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      {/* Redirect to login */}
      <div className="mt-6 text-center">
        <p className="text-sm text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 hover:underline font-semibold transition-colors">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
