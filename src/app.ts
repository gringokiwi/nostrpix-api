import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes";
import { port } from "./config";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/", routes);

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.status(500).json({ error: "Something went wrong!" });
  }
);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;
