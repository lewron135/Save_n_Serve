import supabase from "../supabaseClient.js";

export const createNotification = async ({
  user_id,
  title,
  body,
  type,
  reference_id = null,
}) => {
  const { error } = await supabase.from("notifications").insert({
    user_id,
    title,
    body,
    type,
    reference_id,
    is_read: false,
  });

  if (error) {
    console.error("[Notification] Failed to create:", error.message);
  }
};

// ─── Route Handlers ───────────────────────────────────────────────────────────

/*
  GET /notifications
  Get all notifications for the authenticated user.
 */
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data, error, count } = await supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // Count unread
    const unreadCount = data.filter((n) => !n.is_read).length;

    return res.status(200).json({
      notifications: data,
      unread_count: unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        total_pages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
  PATCH /notifications/:notification_id/read
  Mark a single notification as read.
 */
export const markAsRead = async (req, res) => {
  try {
    const { notification_id } = req.params;

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("notification_id", notification_id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Marked as read", notification: data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/*
  PATCH /notifications/read-all
  Mark all notifications as read.
 */
export const markAllAsRead = async (req, res) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", req.user.id)
      .eq("is_read", false);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};