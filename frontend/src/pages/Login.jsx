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
          padding: isMobile ? "20px 0px" : "44px 0px",
          background: "linear-gradient(135deg, #0c2461 0%, #1e3799 30%, #0c2461 100%)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" width=\"100\" height=\"100\" opacity=\"0.1\"><circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"none\" stroke=\"%23ffffff\" stroke-width=\"2\"/><path d=\"M50,10 A40,40 0 1,1 50,90 A40,40 0 1,1 50,10 Z\" fill=\"none\" stroke=\"%23ffffff\" stroke-width=\"1\"/><line x1=\"50\" y1=\"10\" x2=\"50\" y2=\"50\" stroke=\"%23ffffff\" stroke-width=\"1\"/><line x1=\"50\" y1=\"50\" x2=\"75\" y2=\"65\" stroke=\"%23ffffff\" stroke-width=\"1\"/></svg>')",
            opacity: 0.1,
            zIndex: 0,
          },
        }}
      >
        <Box
          sx={{
            width: isMobile ? "90%" : "500px",
            textAlign: "center",
            padding: isMobile ? 3 : 4,
            borderRadius: 2,
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(25, 25, 35, 0.7)",
            boxShadow: `
              8px 8px 16px rgba(0, 0, 0, 0.5),
              -4px -4px 10px rgba(255, 255, 255, 0.05),
              0 0 20px rgba(56, 103, 214, 0.5)
            `,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Typography
            variant={isMobile ? "h5" : "h4"}
            sx={{
              fontWeight: "bold",
              color: "#fff",
              mb: 2,
              fontFamily: "'Roboto', sans-serif",
              textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
            }}
          >
            Welcome Back
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: "#bbb", 
              mb: 3,
              fontSize: isMobile ? "0.9rem" : "1rem"
            }}
          >
            Sign in to your CivicConnect account
          </Typography>
          
          <Divider sx={{ mb: 4, borderColor: "#555", width: isMobile ? "80%" : "50%", mx: "auto" }} />
          
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
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  borderRadius: 1,
                  input: {
                    color: "#fff",
                    padding: isMobile ? "12px 14px" : "16px 14px",
                    "&::placeholder": {
                      color: "#bbb",
                      opacity: 1,
                    },
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#555",
                    },
                    "&:hover fieldset": {
                      borderColor: "#3498db",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#3498db",
                      boxShadow: "0 0 0 2px rgba(52, 152, 219, 0.2)",
                    },
                  },
                  boxShadow: "inset 3px 3px 5px rgba(0, 0, 0, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.05)",
                }}
                InputLabelProps={{
                  sx: { 
                    color: "#bbb",
                    "&.Mui-focused": {
                      color: "#3498db",
                    }
                  },
                }}
                FormHelperTextProps={{
                  sx: {
                    color: "#ff6b6b",
                    marginLeft: 0,
                    fontSize: "0.75rem",
                  }
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
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  borderRadius: 1,
                  input: {
                    color: "#fff",
                    padding: isMobile ? "12px 14px" : "16px 14px",
                    "&::placeholder": {
                      color: "#bbb",
                      opacity: 1,
                    },
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#555",
                    },
                    "&:hover fieldset": {
                      borderColor: "#3498db",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#3498db",
                      boxShadow: "0 0 0 2px rgba(52, 152, 219, 0.2)",
                    },
                  },
                  boxShadow: "inset 3px 3px 5px rgba(0, 0, 0, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.05)",
                }}
                InputLabelProps={{
                  sx: { 
                    color: "#bbb",
                    "&.Mui-focused": {
                      color: "#3498db",
                    }
                  },
                }}
                FormHelperTextProps={{
                  sx: {
                    color: "#ff6b6b",
                    marginLeft: 0,
                    fontSize: "0.75rem",
                  }
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
                      color: "#3498db",
                      "&.Mui-checked": {
                        color: "#3498db",
                      }
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: "#bbb", fontSize: isMobile ? "0.9rem" : "1rem" }}>
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
                  backgroundColor: "#2980b9",
                  color: "#fff",
                  padding: isMobile ? "10px" : "14px 20px",
                  borderRadius: 1,
                  fontWeight: "bold",
                  textTransform: "none",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  boxShadow: `
                    5px 5px 15px rgba(0, 0, 0, 0.5),
                    -3px -3px 10px rgba(255, 255, 255, 0.05),
                    0 0 10px rgba(41, 128, 185, 0.5)
                  `,
                  "&:hover": {
                    backgroundColor: "#3498db",
                    boxShadow: `
                      0 0 15px rgba(41, 128, 185, 0.8),
                      0 0 25px rgba(41, 128, 185, 0.4)
                    `,
                  },
                  transition: "all 0.2s ease-in-out",
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
                    color: "#ff6b6b",
                    textAlign: "center"
                  }}
                >
                  {errors.general}
                </Typography>
              )}
              <Typography
                variant="body2"
                sx={{
                  mt: 3,
                  color: "#bbb",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  textAlign: "center",
                }}
              >
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  style={{
                    color: "#3498db",
                    fontWeight: "bold",
                    textDecoration: "none",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#5dade2")}
                  onMouseLeave={(e) => (e.target.style.color = "#3498db")}
                >
                  Sign Up
                  <span
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      left: 0,
                      width: "100%",
                      height: "1px",
                      backgroundColor: "#3498db",
                      transform: "scaleX(0)",
                      transition: "transform 0.3s ease-in-out",
                    }}
                  ></span>
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