import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export function hashPassword(motDePasse: string) {
  return bcrypt.hash(motDePasse, SALT_ROUNDS);
}

export function verifyPassword(motDePasse: string, hash: string) {
  return bcrypt.compare(motDePasse, hash);
}
