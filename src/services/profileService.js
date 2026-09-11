import {
  findProfileByUserId,
  updateProfile,
} from "../repositories/profileRepository.js";

export const getUserProfile = async (userId) => {
  const profile = await findProfileByUserId(userId);

  if (!profile) {
    const error = new Error("Profile not found");
    error.statusCode = 404;
    throw error;
  }

  return profile;
};

export const updateUserProfile = async ({
  userId,
  age,
  gender,
  height,
  weight,
  activity,
}) => {
  const profile = await updateProfile({
    userId,
    age,
    gender,
    heightCm: height,
    weightKg: weight,
    activity,
  });

  if (!profile) {
    const error = new Error("Profile not found");
    error.statusCode = 404;
    throw error;
  }

  return profile;
};