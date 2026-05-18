import supabase from "../supabaseClient.js";


const roleMiddleware = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // req.user is set by authMiddleware before this runs
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", req.user.id)
        .single();

      if (error || !profile) {
        return res.status(403).json({ message: "Profile not found" });
      }

      if (!allowedRoles.includes(profile.role)) {
        return res.status(403).json({
          message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
        });
      }

      // Attach role to req for downstream use
      req.userRole = profile.role;
      next();
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
};

export default roleMiddleware;