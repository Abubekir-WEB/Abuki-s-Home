import jwt from "jsonwebtoken";

export default function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authorization header is missing"
    });
  }

  const token = authHeader.split(" ")[1];
   console.log(token)
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY
    );

    req.user = decoded;
      
    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}