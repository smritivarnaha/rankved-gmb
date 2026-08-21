import prisma from "@/lib/prisma";

export const DAILY_PROFILE_REPLY_LIMIT = 3;
export const DEFAULT_POSTING_SLOT_HOURS = [10, 14, 18]; // 10:00 AM, 2:00 PM, 6:00 PM

/**
 * Calculates the next available date and time slot for a review reply
 * ensuring no more than 3 replies are scheduled per profile per day.
 */
export async function getNextAvailableReplySlot(locationId: string, baseDate = new Date()): Promise<Date> {
  let candidateDate = new Date(baseDate);
  // Normalize candidate to start of day
  candidateDate.setHours(0, 0, 0, 0);

  const now = new Date();
  if (candidateDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    candidateDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // Look ahead up to 60 days
  for (let d = 0; d < 60; d++) {
    const dayStart = new Date(candidateDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(candidateDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Fetch existing scheduled replies on this day for this profile
    const scheduledOnDay = await prisma.scheduledReviewReply.findMany({
      where: {
        locationId,
        status: "SCHEDULED",
        scheduledFor: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: { scheduledFor: true },
    });

    const isToday = candidateDate.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const bookedHours = new Set(scheduledOnDay.map(s => new Date(s.scheduledFor).getHours()));

    // Find the first slot hour not yet booked (and strictly in future if today)
    const availableHour = DEFAULT_POSTING_SLOT_HOURS.find(hour => {
      if (bookedHours.has(hour)) return false;
      if (isToday && hour <= currentHour) return false;
      return true;
    });

    if (availableHour !== undefined && bookedHours.size < DAILY_PROFILE_REPLY_LIMIT) {
      const slotTime = new Date(candidateDate);
      slotTime.setHours(availableHour, 0, 0, 0);
      return slotTime;
    }

    // Day is full or no future slots available today, advance candidateDate to next day
    candidateDate.setDate(candidateDate.getDate() + 1);
  }

  // Fallback: 7 days from now
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 7);
  fallback.setHours(10, 0, 0, 0);
  return fallback;
}

/**
 * Gets count of replies already published or scheduled today for this profile
 */
export async function getTodayReplyCountForProfile(locationId: string): Promise<{ publishedToday: number; scheduledToday: number; totalToday: number }> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [publishedToday, scheduledToday] = await Promise.all([
    prisma.scheduledReviewReply.count({
      where: {
        locationId,
        status: "PUBLISHED",
        publishedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    }),
    prisma.scheduledReviewReply.count({
      where: {
        locationId,
        status: "SCHEDULED",
        scheduledFor: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    }),
  ]);

  return {
    publishedToday,
    scheduledToday,
    totalToday: publishedToday + scheduledToday,
  };
}
