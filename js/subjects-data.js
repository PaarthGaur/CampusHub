/**
 * subjects-data.js — DEPRECATED
 *
 * This file previously contained a hardcoded static object with mock subject
 * data (CS501, AI502, CS503, etc.) used as placeholder content.
 *
 * All subjects are now fetched exclusively from the MongoDB database via the
 * Express REST API endpoint:
 *
 *   GET /api/v1/subjects
 *   GET /api/v1/subjects/:identifier
 *
 * Use CampusAPI.getSubjects() or CampusAPI.getSubject(id) in the frontend.
 * Do NOT add hardcoded subject arrays to this file.
 *
 * This file is intentionally empty and not loaded by any HTML page.
 */
