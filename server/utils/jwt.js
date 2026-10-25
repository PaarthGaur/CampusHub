/**
 * JWT Authentication Utilities (Course Topic: 57 - JWT Authentication)
 */
import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/**
 * Generates a signed JSON Web Token
 * @param {string|object} payload - user ID or token claims
 */
export function signToken(id) {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
}

/**
 * Asynchronously verifies a JWT token
 * @param {string} token 
 */
export function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwtSecret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}
