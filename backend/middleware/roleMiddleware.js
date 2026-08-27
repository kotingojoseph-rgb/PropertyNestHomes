const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = String(req.user?.role || "")
      .trim()
      .toLowerCase();

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Your account type is not allowed to perform this action.",
      });
    }

    next();
  };
};

module.exports = requireRoles;
