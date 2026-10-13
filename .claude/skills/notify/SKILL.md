---
name: notify
description: Build/extend notifications (SMS + Email + push) behind a provider-agnostic interface — templates, triggers, Unicode, delivery tracking, opt-out, no PII leaks. Use for "SMS", "send email", "notify users", "alert", "notification".
---

# /notify — Notifications (provider-agnostic)

**Build behind a `notify` unit** (STACK.md §4/§8) — every trigger calls `sendSms()` / `sendEmail()` / `sendPush()`, never a provider SDK directly, so the provider is swappable.

## Rules
1. **Interface first:** the notify unit exposes a stable interface + a pluggable adapter (chosen provider via config). A dev/sandbox adapter logs instead of sending.
2. **Templates, not string-building at call sites:** named templates with typed params, stored so copy can change without code. **Unicode / non-Latin scripts** must round-trip correctly. Keep copy in a translatable layer.
3. **Triggers are explicit + configurable:** fire from domain events (record created, threshold crossed, item published). Trigger policy (thresholds, batching) is config, with the chosen default documented.
4. **Delivery tracking:** persist each send (recipient, template, status, provider message id, timestamps); ingest provider delivery reports where available. Surface failures; never silently drop.
5. **Privacy & consent:** message payloads carry the minimum PII; a message to one recipient never exposes another's data; honor opt-out. Anything with PII routes through `/security-review`.
6. **Cost/volume awareness:** batch sends; rate-limit; estimate volume. OTP sends (if phone auth) share this layer.

Output: interface/adapter touched, templates added, trigger wiring, delivery-tracking changes, how you tested (sandbox adapter). Next: `/qa` (sandbox send + failure path) → `/security-review` (PII) → review → `/ship`.
