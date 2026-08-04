---
name: padi-context
description: Loads the overall project context, architecture, coding conventions, and development workflow for the PADI backend before implementing features.
metadata:
  project: PADI
  stack: NestJS, TypeORM, PostgreSQL, Redis, Docker
---

# PADI Context

## Purpose

This skill provides the AI agent with the overall context of the PADI backend project.

Before implementing any feature, understand the project's architecture, coding conventions, and documentation structure.

This skill should be activated whenever working on:

- Feature implementation
- Bug fixing
- Refactoring
- Code review
- Entity generation
- Module generation
- API implementation
- Database design
- Architecture decisions

---

# Project Overview

PADI is a backend service built with:

- NestJS
- TypeORM
- PostgreSQL
- Redis
- Docker
- JWT Authentication
- Swagger/OpenAPI

The project follows a modular architecture.

---

# Source of Truth

Always use the following documents as the project's source of truth.

Read these documents before making implementation decisions.

## Business Requirements

docs/architecture/PRD.md

Contains:

- project objectives
- features
- modules
- user roles
- functional requirements
- non-functional requirements

---

## Backend Conventions

docs/architecture/backend-rules.md

Contains:

- coding conventions
- architecture rules
- naming conventions
- security rules
- response format
- environment variable policy
- implementation constraints

---

## Database Schema

docs/database/schema.sql

Contains:

- tables
- relationships
- enums
- indexes
- constraints

The SQL schema is the authoritative database design.

---

## API Contract

docs/api/

Contains the Postman Collection.

Always ensure generated endpoints follow the existing API contract whenever possible.

---

# General Principles

When implementing features:

- Follow the documented architecture.
- Do not invent business rules.
- Do not rename existing database structures.
- Do not introduce new tables without justification.
- Reuse existing modules whenever possible.
- Keep implementations simple and maintainable.
- Prefer consistency over cleverness.

---

# If Documentation Is Missing

Never guess.

Instead:

- identify the missing information
- explain what is missing
- ask for clarification before implementing

---

# Success Criteria

A task is considered complete only if:

- implementation follows the documentation
- architecture remains consistent
- code compiles
- existing conventions are respected
- unnecessary complexity has not been introduced