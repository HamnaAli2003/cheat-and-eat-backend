export const bigIntSerializer = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    return originalJson(JSON.parse(JSON.stringify(body, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )));
  };

  next();
};
