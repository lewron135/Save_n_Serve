import supabase from "../supabaseClient.js";

/*
  POST /reports
  User files a report against another user.
 */
export const createReport = async (req, res) => {
  try {
    const { reported_id, reason, description } = req.body;

    if (reported_id === req.user.id) {
      return res.status(400).json({ message: "You cannot report yourself" });
    }

    // Check reported user exists
    const { data: reportedUser, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", reported_id)
      .single();

    if (userError || !reportedUser) {
      return res.status(404).json({ message: "Reported user not found" });
    }

    const { data, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: req.user.id,
        reported_id,
        reason,
        description: description ?? null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(201).json({
      message: "Report submitted successfully",
      report: data,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/*
  GET /reports/my
  Get reports filed by the current user.
 */
export const getMyReports = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select(`
        *,
        reported:reported_id (full_name)
      `)
      .eq("reporter_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({ reports: data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};