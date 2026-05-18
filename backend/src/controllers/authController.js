import supabase from "../supabaseClient.js";

export const signUp = async (
  req,
  res
) => {
  try {
    const {
      full_name,
      email,
      password,
      role,
    } = req.body;

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    const user = data.user;

    const { error: profileError } =
      await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name,
          role,
        });

    if (profileError) {
      return res.status(400).json({
        message: profileError.message,
      });
    }

    return res.status(201).json({
      message:
        "User registered successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const signIn = async (
  req,
  res
) => {
  try {
    const { email, password } = req.body;

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    const { data: profile } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

    return res.status(200).json({
      message: "Login successful",

      access_token:
        data.session.access_token,

      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile.role,
        full_name: profile.full_name,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const logout = async (
  req,
  res
) => {
  try {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getProfile = async (
  req,
  res
) => {
  try {
    const { data, error } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", req.user.id)
        .single();

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(200).json({
      profile: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};