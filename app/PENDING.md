# Pending Follow-Ups

## High Priority
- Port community comment module (legacy `blog-comments.js`) with auth-required posting, nested replies, collapsible threads, and moderation tools.

## Medium Priority
- Align remaining forms (Login, Contacto, Checkout) with the new real-time validation UX (`inputWrapper`, `feedbackSlot`, success/error borders).
- Review Auth persistence to confirm any new registration fields (e.g., terms acceptance) are stored or auditable if required.
- Visual regression pass on Perfil, Checkout, Contacto to ensure parity with legacy layout/toasts.
- Randomize Home recommendation grid similarly to legacy `home-recommendations.js` (personalized/rotating selection).

## QA / Manual Tests
- Registration, login, checkout (tarjeta & transferencia), contacto, perfil updates, address CRUD.

## Completed
- Added "Olvidaste tu contraseña" flow and post-registro login notices to mirror legacy `olvidaste.js` and `login.js` behaviors.
