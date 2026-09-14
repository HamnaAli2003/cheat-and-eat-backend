import prisma from "../config/prisma.js";

export const findProfileByUserId = async (userId) => {
  return prisma.profiles.findUnique({
    where: {
      user_id: BigInt(userId),
    },
    select: {
      id: true,
      user_id: true,
      age: true,
      gender: true,
      height_cm: true,
      weight_kg: true,
      activity: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const createProfile = async ({
  userId,
  age,
  gender,
  heightCm,
  weightKg,
  activity,
}) => {
  return prisma.profiles.create({
    data: {
      user_id: BigInt(userId),
      age,
      gender,
      height_cm: heightCm,
      weight_kg: weightKg,
      activity,
    },
    select: {
      id: true,
      user_id: true,
      age: true,
      gender: true,
      height_cm: true,
      weight_kg: true,
      activity: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const updateProfile = async ({
  userId,
  age,
  gender,
  heightCm,
  weightKg,
  activity,
}) => {
  return prisma.profiles.update({
    where: {
      user_id: BigInt(userId),
    },
    data: {
      age,
      gender,
      height_cm: heightCm,
      weight_kg: weightKg,
      activity,
    },
    select: {
      id: true,
      user_id: true,
      age: true,
      gender: true,
      height_cm: true,
      weight_kg: true,
      activity: true,
      created_at: true,
      updated_at: true,
    },
  });
};