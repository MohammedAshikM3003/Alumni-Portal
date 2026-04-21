export const findCoordinatorForUser = async (user) => {
  if (!user?._id) {
    return null;
  }

  const { default: Coordinator } = await import('../models/coordinator.js');

  const coordinators = await Coordinator.find({
    isActive: true,
    $or: [
      { userId: user._id },
      ...(user.email ? [{ email: user.email.toLowerCase() }] : []),
    ],
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .select('department designation staffId email userId updatedAt createdAt');

  if (coordinators.length > 1) {
    console.warn(
      `Multiple active coordinator records found for user ${user.userId || user.email || user._id}. Using the most recent one.`
    );
  }

  return coordinators[0] || null;
};
