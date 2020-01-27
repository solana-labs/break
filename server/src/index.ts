import express from "express";
import cors from "cors";
import path from "path";

const port = process.env.PORT || 8080;
const app = express();
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.static(path.join(__dirname, "../../client/dist")));
app.listen(port);
console.log(`Server listening on port: ${port}`);
