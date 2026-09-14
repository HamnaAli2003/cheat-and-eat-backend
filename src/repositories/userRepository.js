import prisma from "../config/prisma.js";

export const findUserByEmail = async (email) => {
  return prisma.users.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      password_hash: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const createUser = async ({
  name,
  email,
  passwordHash,
}) => {
  return prisma.users.create({
    data: {
      name,
      email,
      password_hash: passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const findUserById = async (id) => {
  return prisma.users.findUnique({
    where: {
      id: BigInt(id),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });
};