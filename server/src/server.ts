import express from "express";
import messageRoutes from "./routes/message.routes.js";

const app = express();

app.use(express.json());

app.use("/msg", messageRoutes);

app.listen(5000, () => {
    console.log("Server running on port 5000");
});