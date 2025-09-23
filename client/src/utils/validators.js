export const validateEmail = (email) => {
  const re =
    /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

export const validateName = (name) => {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 50;
};
