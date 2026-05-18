import supabase from "../supabaseClient.js";
import { createNotification } from "./notificationController.js";



/*
  POST /claims/:food_id
  Receiver claims a food 
 */
export const claimFood = async (req, res) => {
  try {
    const { food_id } = req.params;

    // Fetch food and ensure it's available
    const { data: food, error: foodError } = await supabase
      .from("foods")
      .select("*")
      .eq("food_id", food_id)
      .eq("status", "available")
      .gt("expiry_date", new Date().toISOString())
      .single();

    if (foodError || !food) {
      return res.status(404).json({
        message: "Food is not available or has expired",
      });
    }

    // giver cannot claim their own food
    if (food.giver_id === req.user.id) {
      return res.status(400).json({
        message: "You cannot claim your own food",
      });
    }

    // Check if receiver already has a pending/approved claim for this food
    const { data: existingClaim } = await supabase
      .from("claims")
      .select("claim_id")
      .eq("food_id", food_id)
      .eq("receiver_id", req.user.id)
      .in("claim_status", ["pending", "approved"])
      .maybeSingle();

    if (existingClaim) {
      return res.status(400).json({
        message: "You already have an active claim for this food",
      });
    }

    // Create claim
    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .insert({
        food_id,
        receiver_id: req.user.id,
        claim_status: "pending",
      })
      .select()
      .single();

    if (claimError) {
      return res.status(400).json({ message: claimError.message });
    }

    // Mark food as claimed (first-come, first-served)
    await supabase
      .from("foods")
      .update({ status: "claimed" })
      .eq("food_id", food_id);

    // Notify giver
    await createNotification({
      user_id: food.giver_id,
      title: "Your food has been claimed!",
      body: `Someone has claimed "${food.name}". Please confirm the pickup.`,
      type: "claim",
      reference_id: claim.claim_id,
    });

    return res.status(201).json({
      message: "Food claimed successfully",
      claim,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/*
  GET /claims/my
  Receiver views their own claims.
 */
export const getMyClaims = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    let query = supabase
      .from("claims")
      .select(
        `
        *,
        foods (
          food_id,
          name,
          pickup_location,
          expiry_date,
          profiles:giver_id (full_name)
        )
      `,
        { count: "exact" }
      )
      .eq("receiver_id", req.user.id)
      .order("claim_date", { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq("claim_status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({
      claims: data,
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

/*
  GET /claims/food/:food_id
  giver views all claims on their food.
 */
export const getClaimsByFood = async (req, res) => {
  try {
    const { food_id } = req.params;

    // Verify ownership
    const { data: food, error: foodError } = await supabase
      .from("foods")
      .select("giver_id")
      .eq("food_id", food_id)
      .single();

    if (foodError || !food || food.giver_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { data, error } = await supabase
      .from("claims")
      .select(
        `
        *,
        profiles:receiver_id (
          id,
          full_name
        )
      `
      )
      .eq("food_id", food_id)
      .order("claim_date", { ascending: true });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({ claims: data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/*
  PATCH /claims/:claim_id/confirm
  giver confirms the pickup has been completed.
 */
export const confirmPickup = async (req, res) => {
  try {
    const { claim_id } = req.params;

    // Fetch claim + food to verify giver ownership
    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .select(`*, foods(*)`)
      .eq("claim_id", claim_id)
      .single();

    if (claimError || !claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (claim.foods.giver_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (claim.claim_status !== "pending") {
      return res.status(400).json({
        message: "Only pending claims can be confirmed",
      });
    }

    // Update claim to approved
    const { data: updatedClaim, error: updateError } = await supabase
      .from("claims")
      .update({ claim_status: "approved" })
      .eq("claim_id", claim_id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ message: updateError.message });
    }

    // Mark food as completed
    await supabase
      .from("foods")
      .update({ status: "completed" })
      .eq("food_id", claim.food_id);

    // Award points to giver
    const POINTS_PER_DONATION = 10;
    await supabase.from("point_transactions").insert({
      giver_id: claim.foods.giver_id,
      points_earned: POINTS_PER_DONATION,
    });

    // Update giver total_points
    await supabase.rpc("increment_giver_points", {
      giver_uuid: claim.foods.giver_id,
      points: POINTS_PER_DONATION,
    });

    // Notify receiver
    await createNotification({
      user_id: claim.receiver_id,
      title: "Pickup confirmed!",
      body: `Your pickup for "${claim.foods.name}" has been confirmed by the giver.`,
      type: "confirm",
      reference_id: claim_id,
    });

    return res.status(200).json({
      message: "Pickup confirmed successfully",
      claim: updatedClaim,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/*
  PATCH /claims/:claim_id/cancel
  Receiver cancels their own claim.
 */
export const cancelClaim = async (req, res) => {
  try {
    const { claim_id } = req.params;

    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .select(`*, foods(*)`)
      .eq("claim_id", claim_id)
      .eq("receiver_id", req.user.id)
      .single();

    if (claimError || !claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (!["pending", "approved"].includes(claim.claim_status)) {
      return res.status(400).json({
        message: "This claim cannot be cancelled",
      });
    }

    // Cancel the claim
    await supabase
      .from("claims")
      .update({ claim_status: "cancelled" })
      .eq("claim_id", claim_id);

    // Revert food back to available
    await supabase
      .from("foods")
      .update({ status: "available" })
      .eq("food_id", claim.food_id);

    // Notify giver
    await createNotification({
      user_id: claim.foods.giver_id,
      title: "Claim cancelled",
      body: `A receiver cancelled their claim on "${claim.foods.name}". The food is now available again.`,
      type: "cancel",
      reference_id: claim_id,
    });

    return res.status(200).json({ message: "Claim cancelled" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/*
  POST /claims/:claim_id/rate
  Receiver rates the giver after a completed claim.
 */
export const rategiver = async (req, res) => {
  try {
    const { claim_id } = req.params;
    const { rating, comment } = req.body;

    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .select(`*, foods(giver_id, name)`)
      .eq("claim_id", claim_id)
      .eq("receiver_id", req.user.id)
      .single();

    if (claimError || !claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (claim.claim_status !== "approved") {
      return res.status(400).json({
        message: "You can only rate after a confirmed pickup",
      });
    }

    if (claim.rating !== null) {
      return res.status(400).json({ message: "You already rated this claim" });
    }

    // Save rating on the claim row
    const { data, error } = await supabase
      .from("claims")
      .update({ rating, rating_comment: comment ?? null })
      .eq("claim_id", claim_id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({
      message: "Rating submitted",
      claim: data,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};