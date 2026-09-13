// src/middleware.ts
// Fase 2: el middleware protege /admin/** (excepto /admin/login)
// verificando que exista al menos una cookie de sesión de Supabase.
//
// Si no hay cookie → redirige a /admin/login.
// Si hay cookie → deja pasar; las páginas server-side validan el user
// con `getCurrentUser(cookies)` cuando lo necesiten (ej. para mostrar
// el email del admin).

import { defineMiddleware } from 'astro:middleware';
import { hasSessionCookie } from './lib/admin-auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Solo nos importa el admin. El sitio público pasa sin chequear.
  if (!pathname.startsWith('/admin')) {
    return next();
  }

  // /admin/login es público (si hay sesión, el cliente redirige al panel).
  if (pathname === '/admin/login' || pathname === '/admin/login/') {
    return next();
  }

  // Cualquier otra ruta bajo /admin requiere cookie de sesión.
  if (!hasSessionCookie(context.request)) {
    return context.redirect('/admin/login');
  }

  return next();
});