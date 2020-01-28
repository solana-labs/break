import express from "express";
import cors from "cors";
import path from "path";

const port = process.env.PORT || 8080;
const app = express();
app.use(cors());
app.use(express.json()); // for parsing application/json

const publicPath = process.env.PUBLIC_PATH || "public";
const staticPath = path.join(__dirname, publicPath);
app.use("/", express.static(staticPath));
console.log(`Serving static files from: ${staticPath}`);

app.listen(port);
console.log(`Server listening on port: ${port}`);
