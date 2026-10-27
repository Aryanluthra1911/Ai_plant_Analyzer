import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 14 * 24 * 60 * 60 },
  // Use an app-specific name so stale Auth.js/NextAuth cookies from earlier
  // secrets or projects are ignored instead of repeatedly failing decryption.
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-verdant.session-token' : 'verdant.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: { signIn: '/login' },
  providers: [Credentials({
    name: 'Email and password',
    credentials: {
      email: { label: 'Email address', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : '';
      const password = typeof credentials?.password === 'string' ? credentials.password : '';
      if (!email || !password || password.length > 128) return null;

      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
        return { id: user.id, name: user.name, email: user.email };
      } catch {
        return null;
      }
    },
  })],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
