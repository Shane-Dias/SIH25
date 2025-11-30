import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Checkbox,
  FormControlLabel,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Footer from "../components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    setFormData({ ...formData, rememberMe: e.target.checked });
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      tempErrors.email = "Valid Email is required";
    if (!formData.password || formData.password.length < 6)
      tempErrors.password = "Password must be at least 6 characters long";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLogin = async () => {
    if (validate()) {
      try {
        const response = await axios.post(`${API_URL}/api/login/`, {
          email: formData.email,
          password: formData.password,
        });

        const {
          tokens: { access, refresh },
        } = response.data;
        localStorage.setItem("accessToken", access);
        localStorage.setItem("refreshToken", refresh);
        localStorage.setItem("userType", response.data.user_type);
        login();
        navigate(response.data.user_type === "user" ? "/my-reports" : "/admin");
      } catch (error) {
        setErrors({
          ...errors,
          general: error.response?.data?.error || "Something went wrong!",
        });
      }
    }
  };

  return (
    <>
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          minHeight: "85vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "20px" : "40px",
          background: "linear-gradient(to bottom, #0f172a, #1e293b, #0f172a)",
        }}
      >
        <Box
          sx={{
            width: isMobile ? "90%" : "700px",
            mx: "auto",
            textAlign: "center",
            padding: isMobile ? 3 : 5,
            borderRadius: "20px",
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow:
              "0px 10px 30px rgba(0,0,0,0.6), 0px 4px 15px rgba(255,255,255,0.05)",
          }}
        >
          <Typography
            variant={isMobile ? "h5" : "h4"}
            sx={{
              fontWeight: "bold",
              color: "white",
              mb: 2,
              textShadow: "0 0 25px rgba(6,182,212,0.4)",
            }}
          >
            Welcome Back
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "rgb(203 213 225)",
              mb: 3,
              fontSize: isMobile ? "0.9rem" : "1rem",
            }}
          >
            Sign in to your <span style={{ color: "rgb(6,182,212)" , fontWeight: "bold" }}>BharatSecure</span> account.
          </Typography>

          <Divider
            sx={{
              mb: 4,
              borderColor: "rgba(255,255,255,0.2)",
              width: isMobile ? "80%" : "50%",
              mx: "auto",
            }}
          />

          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12}>
              <TextField
                label="Email"
                name="email"
                type="email"
                fullWidth
                size={isMobile ? "small" : "medium"}
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                sx={{
                  "& .MuiInputBase-root": {
                    color: "white",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: "12px",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgb(56,189,248)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgb(56,189,248)",
                    boxShadow: "0 0 6px rgba(56,189,248,0.4)",
                  },
                  "& .MuiFormHelperText-root": {
                    color: "#f87171",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "rgba(255,255,255,0.7)",
                    "&.Mui-focused": {
                      color: "rgb(56,189,248)",
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Password"
                name="password"
                type="password"
                fullWidth
                size={isMobile ? "small" : "medium"}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                sx={{
                  "& .MuiInputBase-root": {
                    color: "white",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: "12px",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgb(56,189,248)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgb(56,189,248)",
                    boxShadow: "0 0 6px rgba(56,189,248,0.4)",
                  },
                  "& .MuiFormHelperText-root": {
                    color: "#f87171",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "rgba(255,255,255,0.7)",
                    "&.Mui-focused": {
                      color: "rgb(56,189,248)",
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.rememberMe}
                    onChange={handleCheckboxChange}
                    sx={{
                      color: "rgb(56,189,248)",
                      "&.Mui-checked": {
                        color: "rgb(56,189,248)",
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: "rgb(203 213 225)" }}>
                    Remember Me
                  </Typography>
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                fullWidth
                size={isMobile ? "medium" : "large"}
                sx={{
                  background:
                    "linear-gradient(90deg, rgb(56,189,248), rgb(14,165,233))",
                  color: "white",
                  padding: isMobile ? "10px" : "14px 20px",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  textTransform: "none",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  boxShadow:
                    "0px 5px 20px rgba(56,189,248,0.4), 0px 5px 30px rgba(14,165,233,0.3)",
                  "&:hover": {
                    background:
                      "linear-gradient(90deg, rgb(14,165,233), rgb(2,132,199))",
                    boxShadow:
                      "0px 8px 25px rgba(14,165,233,0.5), 0px 8px 35px rgba(2,132,199,0.4)",
                  },
                }}
                onClick={handleLogin}
              >
                Log In
              </Button>

              {errors.general && (
                <Typography
                  sx={{
                    mt: 2,
                    fontSize: "0.9rem",
                    color: "#f87171",
                  }}
                >
                  {errors.general}
                </Typography>
              )}

              <Typography
                variant="body2"
                sx={{
                  mt: 3,
                  color: "rgb(203 213 225)",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  textAlign: "center",
                }}
              >
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  style={{
                    color: "rgb(56,189,248)",
                    fontWeight: "bold",
                    textDecoration: "none",
                  }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Container>
      <Footer />
    </>
  );
};

export default Login;
