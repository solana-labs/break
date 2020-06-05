const required = (value: string): boolean => {
  return value.length > 0;
};

const email = (value: string): boolean => {
  return (
    value
      .toLowerCase()
      .match(/^([\w-]+\.)*[\w-]+@[a-z0-9_-]+(\.[a-z0-9_-]+)*\.[a-z]{2,6}$/) !==
    null
  );
};

const minLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

const valueIsEmpty = (value: string): boolean => {
  return value.trim().length === 0;
};

const validationSet = {
  required,
  email,
  minLength,
  valueIsEmpty,
};

export default validationSet;
