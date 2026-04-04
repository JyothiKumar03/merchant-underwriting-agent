# CLAUDE.md

## Purpose

This repository contains a full-stack TypeScript application with:

- Frontend: Next.js, Tailwind CSS, shadcn/ui, TanStack Query
- Backend: Bun, Express, TypeScript, Neon PostgreSQL, Vercel AI SDK

The codebase must remain consistent, maintainable, typed, and easy to refactor.

---

## General Principles

- Prefer clarity over cleverness.
- Keep functions small and focused.
- Keep components and modules single-purpose.
- Avoid duplicated logic.
- Avoid unnecessary abstraction.
- Never introduce code that is harder to read than the problem it solves.
- Do not add unused code, dead code, commented-out code, or temporary hacks.
- Prefer explicit types and explicit control flow.
- Use named exports unless there is a strong reason not to.
- Maintain strict separation between presentation, business logic, and data access.

---

## Repository Standards

- Use TypeScript everywhere.
- Avoid `any` unless there is no practical alternative.
- Use `strict` TypeScript settings.
- Keep folder structure predictable.
- File names must follow the conventions defined below.
- Keep imports organized and minimal.
- Keep modules small enough to understand in one pass.
- All new code must be production-oriented, not demo-oriented.

---

# Frontend Rules

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Bun as package manager/runtime

## File Naming

- Component files: `kebab-case.tsx`
- Hook files: `use-kebab-case.ts`
- Utility files: `kebab-case.ts`
- Page files follow Next.js conventions
- Avoid generic file names such as `utils.ts`, `helpers.ts`, or `data.ts` unless the file is truly general and small

## Component Naming

- React component names must be `PascalCase`
- One primary component per file
- Export components as named exports

Example:

```tsx
export function UserCard() {
  return <div />;
}