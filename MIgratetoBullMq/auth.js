export function bullBoardAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Basic ")) {
    res.setHeader(
      "WWW-Authenticate",
      'Basic realm="Bull Board"'
    );

    return res.status(401).send("Authentication required");
  }

  const base64Credentials = auth.split(" ")[1];

  const decoded = Buffer.from(
    base64Credentials,
    "base64"
  ).toString("utf8");

  const [username, password] = decoded.split(":");

  const expectedUsername =
    process.env.BULL_BOARD_USERNAME;

  const expectedPassword =
    process.env.BULL_BOARD_PASSWORD;

  if (
    username !== expectedUsername ||
    password !== expectedPassword
  ) {
    res.setHeader(
      "WWW-Authenticate",
      'Basic realm="Bull Board"'
    );

    return res.status(401).send("Invalid credentials");
  }

  next();
}