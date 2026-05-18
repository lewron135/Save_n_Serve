import supabase from "../supabaseClient.js";

const authMiddleware = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    const { data, error } =
      await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    req.user = data.user;

    next();
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export default authMiddleware;