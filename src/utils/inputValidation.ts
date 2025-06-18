
// Input validation and sanitization utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

export const validatePhone = (phone: string): boolean => {
  // Dutch phone number validation
  const phoneRegex = /^(\+31|0)[0-9]{9}$/;
  const cleanPhone = phone.replace(/[\s-]/g, '');
  return phoneRegex.test(cleanPhone);
};

export const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
  return nameRegex.test(name.trim());
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, 255); // Limit length
};

export const validateShiftTitle = (title: string): boolean => {
  const sanitized = sanitizeInput(title);
  return sanitized.length >= 3 && sanitized.length <= 100;
};

export const validateShiftTime = (startTime: string, endTime: string): boolean => {
  if (!startTime || !endTime) return false;
  
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  return end > start;
};

export const validateShiftDate = (date: string): boolean => {
  const shiftDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return shiftDate >= today;
};

export const validatePeopleCount = (min: number, max: number): boolean => {
  return min >= 1 && max >= min && max <= 50;
};
