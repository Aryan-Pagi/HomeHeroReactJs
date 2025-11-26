// Input validation and sanitization utilities

// Sanitize string input to prevent XSS
export const sanitizeString = (input) => {
  if (typeof input !== "string") return "";

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers like onclick=
    .substring(0, 1000); // Limit length
};

// Sanitize email
export const sanitizeEmail = (email) => {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase().substring(0, 254); // RFC 5321
};

// Sanitize phone number
export const sanitizePhone = (phone) => {
  if (typeof phone !== "string") return "";
  // Keep only digits, +, -, (, ), and spaces
  return phone.replace(/[^\d+\-() ]/g, "").substring(0, 20);
};

// Validation functions
export const validators = {
  // Name validation
  name: (value) => {
    const sanitized = sanitizeString(value);

    if (!sanitized || sanitized.length < 2) {
      return {
        isValid: false,
        message: "Name must be at least 2 characters long",
      };
    }

    if (sanitized.length > 100) {
      return {
        isValid: false,
        message: "Name must not exceed 100 characters",
      };
    }

    if (!/^[a-zA-Z\s.'-]+$/.test(sanitized)) {
      return {
        isValid: false,
        message:
          "Name can only contain letters, spaces, dots, hyphens, and apostrophes",
      };
    }

    return { isValid: true, sanitized };
  },

  // Email validation
  email: (value) => {
    const sanitized = sanitizeEmail(value);

    if (!sanitized) {
      return { isValid: false, message: "Email is required" };
    }

    // RFC 5322 compliant email regex (simplified)
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(sanitized)) {
      return { isValid: false, message: "Please enter a valid email address" };
    }

    return { isValid: true, sanitized };
  },

  // Phone validation (Indian format)
  phone: (value) => {
    const sanitized = sanitizePhone(value);

    if (!sanitized) {
      return { isValid: false, message: "Phone number is required" };
    }

    // Remove all non-digit characters for validation
    const digitsOnly = sanitized.replace(/\D/g, "");

    // Indian phone numbers: 10 digits (with or without country code)
    if (digitsOnly.length === 10) {
      // Must start with 6-9
      if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
        return {
          isValid: false,
          message: "Please enter a valid 10-digit Indian phone number",
        };
      }
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
      // With country code +91
      const without91 = digitsOnly.substring(2);
      if (!/^[6-9]\d{9}$/.test(without91)) {
        return {
          isValid: false,
          message: "Please enter a valid Indian phone number",
        };
      }
    } else {
      return {
        isValid: false,
        message: "Phone number must be 10 digits (or 12 with country code)",
      };
    }

    return { isValid: true, sanitized };
  },

  // Password validation
  password: (value) => {
    if (!value || value.length < 8) {
      return {
        isValid: false,
        message: "Password must be at least 8 characters long",
      };
    }

    if (value.length > 128) {
      return {
        isValid: false,
        message: "Password must not exceed 128 characters",
      };
    }

    // Check for at least one uppercase, one lowercase, and one number
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return {
        isValid: false,
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      };
    }

    return { isValid: true, sanitized: value };
  },

  // Location validation
  location: (value) => {
    const sanitized = sanitizeString(value);

    if (!sanitized || sanitized.length < 2) {
      return {
        isValid: false,
        message: "Location must be at least 2 characters",
      };
    }

    if (sanitized.length > 200) {
      return {
        isValid: false,
        message: "Location must not exceed 200 characters",
      };
    }

    return { isValid: true, sanitized };
  },

  // Service type validation
  serviceType: (value) => {
    const sanitized = sanitizeString(value);

    if (!sanitized) {
      return { isValid: false, message: "Service type is required" };
    }

    if (sanitized.length > 100) {
      return {
        isValid: false,
        message: "Service type must not exceed 100 characters",
      };
    }

    return { isValid: true, sanitized };
  },

  // Review comment validation
  reviewComment: (value) => {
    const sanitized = sanitizeString(value);

    if (!sanitized || sanitized.length < 10) {
      return {
        isValid: false,
        message: "Review must be at least 10 characters long",
      };
    }

    if (sanitized.length > 1000) {
      return {
        isValid: false,
        message: "Review must not exceed 1000 characters",
      };
    }

    return { isValid: true, sanitized };
  },

  // Rating validation
  rating: (value) => {
    const num = Number(value);

    if (isNaN(num) || num < 1 || num > 5) {
      return {
        isValid: false,
        message: "Rating must be between 1 and 5",
      };
    }

    return { isValid: true, sanitized: num };
  },

  // Date validation (for bookings)
  bookingDate: (value) => {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return { isValid: false, message: "Please enter a valid date" };
    }

    const now = new Date();
    const minDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

    if (date < minDate) {
      return {
        isValid: false,
        message: "Booking must be at least 2 hours in advance",
      };
    }

    const maxDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

    if (date > maxDate) {
      return {
        isValid: false,
        message: "Booking cannot be more than 90 days in advance",
      };
    }

    return { isValid: true, sanitized: value };
  },

  // Special instructions validation
  specialInstructions: (value) => {
    if (!value) return { isValid: true, sanitized: "" }; // Optional field

    const sanitized = sanitizeString(value);

    if (sanitized.length > 500) {
      return {
        isValid: false,
        message: "Special instructions must not exceed 500 characters",
      };
    }

    return { isValid: true, sanitized };
  },
};

// Validate multiple fields at once
export const validateForm = (fields) => {
  const errors = {};
  const sanitizedData = {};

  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    if (validators[fieldName]) {
      const result = validators[fieldName](fieldValue);

      if (!result.isValid) {
        errors[fieldName] = result.message;
      } else {
        sanitizedData[fieldName] = result.sanitized;
      }
    } else {
      // If no specific validator, just sanitize as string
      sanitizedData[fieldName] = sanitizeString(fieldValue);
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData,
  };
};

// Real-time field validation hook helper
export const useFieldValidation = () => {
  const validateField = (fieldName, value) => {
    if (validators[fieldName]) {
      return validators[fieldName](value);
    }
    return { isValid: true, sanitized: sanitizeString(value) };
  };

  return { validateField };
};

export default {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  validators,
  validateForm,
  useFieldValidation,
};
