import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'admin' | 'vendedor' | 'caixa' | 'estoque';
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'vendedor' | 'caixa' | 'estoque';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'admin' | 'vendedor' | 'caixa' | 'estoque';
  }
}