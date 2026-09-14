import prisma from "../config/prisma.js";

export const findActiveTips = async (client) => {
  return prisma.daily_tips.findMany({
    where: {
      is_active: true,
    },
    select: {
      id: true,
      text: true,
      icon: true,
      sort_order: true,
    },
    orderBy: [
      {
        sort_order: "asc",
      },
      {
        id: "asc",
      },
    ],
  });
};

