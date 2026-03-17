require("dotenv").config();
const path = require("path");
const app = require("./api/index");

const PORT = process.env.PORT || 3000;

app.use(require("express").static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
