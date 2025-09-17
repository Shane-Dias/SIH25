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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Footer from "../components/Footer";
import { useNavigate, Link } from "react-router-dom";

const SignUp = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    aadharNumber: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.firstName) tempErrors.firstName = "First Name is required";
    if (!formData.lastName) tempErrors.lastName = "Last Name is required";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      tempErrors.email = "Valid Email is required";
    if (!formData.phoneNumber || !/^\d{10}$/.test(formData.phoneNumber))
      tempErrors.phoneNumber = "Valid 10-digit Phone Number is required";
    if (!formData.aadharNumber || !/^\d{12}$/.test(formData.aadharNumber))
      tempErrors.aadharNumber = "Valid 12-digit Aadhar Number is required";
    if (!formData.password || formData.password.length < 6)
      tempErrors.password = "Password must be at least 6 characters long";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setMessage("");
    setError("");

    try {
      const response = await axios.post(
        `${API_URL}/api/signup/`,
        formData
      );
      if (response.status === 201) {
        setMessage("Account created successfully!");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          address: "",
          aadharNumber: "",
          password: "",
        });
        navigate("/login");
      }
    } catch (err) {
      if (err.response) {
        setError(
          err.response.data.detail || "Error occurred while signing up."
        );
      } else {
        setError("An unexpected error occurred.");
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
            width: isMobile ? "90%" : "700px",
            mx: "auto",
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
            CivicConnect
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: "#bbb", 
              mb: 3,
              fontSize: isMobile ? "0.9rem" : "1rem"
            }}
          >
            Join our community issue reporting platform
          </Typography>
          
          <Divider sx={{ mb: 4, borderColor: "#555", width: isMobile ? "80%" : "50%", mx: "auto" }} />
          
          {message && (
            <Typography
              sx={{ color: "#4cd964", mb: 2, fontWeight: "medium" }}
              variant="body1"
            >
              {message}
            </Typography>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={isMobile ? 2 : 3}>
              {[
                { label: "First Name", name: "firstName" },
                { label: "Last Name", name: "lastName" },
                { label: "Email", name: "email", type: "email" },
                { label: "Phone Number", name: "phoneNumber", type: "tel" },
                {
                  label: "Address",
                  name: "address",
                  multiline: true,
                  rows: 2,
                },
                { label: "Aadhar Number", name: "aadharNumber" },
                {
                  label: "Create Password",
                  name: "password",
                  type: "password",
                },
              ].map((field, index) => (
                <Grid
                  item
                  xs={12}
                  sm={field.name.includes("Name") ? 6 : 12}
                  key={index}
                >
                  <TextField
                    {...field}
                    variant="outlined"
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    value={formData[field.name]}
                    onChange={handleChange}
                    error={!!errors[field.name]}
                    helperText={errors[field.name]}
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
                      textarea: {
                        color: "#fff",
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
              ))}
              
              <Grid item xs={12}>
                <Button
                  type="submit"
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
                >
                  Create Account
                </Button>
                
                {error && (
                  <Typography
                    sx={{ mt: 2, fontSize: "0.9rem", color: "#ff6b6b" }}
                  >
                    {error}
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
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    style={{
                      color: "#3498db",
                      fontWeight: "bold",
                      textDecoration: "none",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#5dade2")}
                    onMouseLeave={(e) => (e.target.style.color = "#3498db")}
                  >
                    Sign in
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
          </form>
        </Box>
      </Container>
      <Footer />
    </>
  );
};
export default SignUp;