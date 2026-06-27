// Vitest stub for the `server-only` marker package. Next.js resolves the real
// module during its build; in unit tests we alias it to this no-op so server
// utility modules (lib/ip, lib/rate-limit, lib/request-guard) can be imported.
export {};
