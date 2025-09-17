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
      const response = await axios.post(`${API_URL}/api/signup/`, formData);
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
            Create Your Account
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "rgb(203 213 225)",
              mb: 3,
              fontSize: isMobile ? "0.9rem" : "1rem",
            }}
          >
            Join and start reporting issues in your community.
          </Typography>

          <Divider
            sx={{
              mb: 4,
              borderColor: "rgba(255,255,255,0.2)",
              width: isMobile ? "80%" : "50%",
              mx: "auto",
            }}
          />

          {message && (
            <Typography
              sx={{ color: "#22c55e", mb: 2, fontWeight: "medium" }}
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
              ))}

              <Grid item xs={12}>
                <Button
                  type="submit"
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
                >
                  Create Account
                </Button>

                {error && (
                  <Typography
                    sx={{ mt: 2, fontSize: "0.9rem", color: "#f87171" }}
                  >
                    {error}
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
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    style={{
                      color: "rgb(56,189,248)",
                      fontWeight: "bold",
                      textDecoration: "none",
                    }}
                  >
                    Sign in
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