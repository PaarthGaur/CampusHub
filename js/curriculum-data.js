/**
 * curriculum-data.js — DEPRECATED
 *
 * This file previously contained a hardcoded curriculum map keyed by department
 * and semester (CSE: { 3: { 5: ["cs501", "ai502", "cs503"] } }) used as
 * placeholder content for selecting subjects by semester.
 *
 * Subjects are now fetched from MongoDB via the REST API with optional
 * semester filtering:
 *
 *   GET /api/v1/subjects?semester=5
 *
 * Use CampusAPI.getSubjects({ semester: n }) in the frontend.
 * Do NOT add hardcoded curriculum arrays to this file.
 *
 * This file is intentionally empty and not loaded by any HTML page.
 */