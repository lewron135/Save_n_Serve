import supabase from "../supabaseClient.js";



/*
  Calculate distance in km between two lat/lng coordinates (Haversine formula).
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}



/*
  POST /foods
  giver posts a new food donation.
 */
export const createFood = async (req, res) => {
  try {
    const {
      name,
      description,
      quantity,
      portion_unit,
      pickup_location,
      pickup_lat,
      pickup_lng,
      expiry_date,
    } = req.body;

    const { data, error } = await supabase
      .from("foods")
      .insert({
        giver_id: req.user.id,
        name,
        description,
        quantity,
        portion_unit,
        pickup_location,
        pickup_lat: pickup_lat ?? null,
        pickup_lng: pickup_lng ?? null,
        expiry_date,
        status: "available",
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(201).json({
      message: "Food posted successfully",
      food: data,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/*
  GET /foods/feed
  Public feed of available food, optionally sorted by distance.
 */
export const getFoodFeed = async (req, res) => {
  try {
    const { lat, lng, page = 1, limit = 10 } = req.query;

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data: foods, error, count } = await supabase
      .from("foods")
      .select(
        `
        *,
        profiles:giver_id (
          id,
          full_name
        )
      `,
        { count: "exact" }
      )
      .eq("status", "available")
      .gt("expiry_date", new Date().toISOString())
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    let result = foods;

    // Sort by distance if coordinates are provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      result = foods
        .map((food) => ({
          ...food,
          distance_km:
            food.pickup_lat && food.pickup_lng
              ? parseFloat(
                  haversineDistance(
                    userLat,
                    userLng,
                    food.pickup_lat,
                    food.pickup_lng
                  ).toFixed(2)
                )
              : null,
        }))
        .sort((a, b) => {
          if (a.distance_km === null) return 1;
          if (b.distance_km === null) return -1;
          return a.distance_km - b.distance_km;
        });
    }

    return res.status(200).json({
      foods: result,
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
  GET /foods/:food_id
  Get food detail by ID.
 */
export const getFoodById = async (req, res) => {
  try {
    const { food_id } = req.params;

    const { data, error } = await supabase
      .from("foods")
      .select(
        `
        *,
        profiles:giver_id (
          id,
          full_name,
          giver_level
        )
      `
      )
      .eq("food_id", food_id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Food not found" });
    }

    return res.status(200).json({ food: data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/*
  GET /foods/my
  giver views their own food listings.
 */
export const getMyFoods = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    let query = supabase
      .from("foods")
      .select("*", { count: "exact" })
      .eq("giver_id", req.user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({
      foods: data,
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
  PUT /foods/:food_id
  giver updates their food listing (only if still available).
 */
export const updateFood = async (req, res) => {
  try {
    const { food_id } = req.params;

    // Verify ownership and status
    const { data: existing, error: findError } = await supabase
      .from("foods")
      .select("*")
      .eq("food_id", food_id)
      .eq("giver_id", req.user.id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ message: "Food not found or not yours" });
    }

    if (existing.status !== "available") {
      return res.status(400).json({
        message: "Cannot update food that is already claimed or completed",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "quantity",
      "portion_unit",
      "pickup_location",
      "pickup_lat",
      "pickup_lng",
      "expiry_date",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const { data, error } = await supabase
      .from("foods")
      .update(updates)
      .eq("food_id", food_id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({
      message: "Food updated successfully",
      food: data,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/*
  DELETE /foods/:food_id
  giver cancels (soft-deletes) their food listing.
 */
export const cancelFood = async (req, res) => {
  try {
    const { food_id } = req.params;

    const { data: existing, error: findError } = await supabase
      .from("foods")
      .select("*")
      .eq("food_id", food_id)
      .eq("giver_id", req.user.id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ message: "Food not found or not yours" });
    }

    if (["completed", "expired"].includes(existing.status)) {
      return res.status(400).json({
        message: "Cannot cancel food that is already completed or expired",
      });
    }

    const { data, error } = await supabase
      .from("foods")
      .update({ status: "cancelled" })
      .eq("food_id", food_id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({
      message: "Food listing cancelled",
      food: data,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};