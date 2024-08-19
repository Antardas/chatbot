import express, { Application } from "express";
import errorMiddleware from "./shared/global/helpers/error-middleware";
import chatRouter from "./routes/chat-routes";
import cors from "cors";
const app: Application = express();
(async () => {
  app.use(cors({ origin: "*" }));
  app.use(express.json({limit: '50mb'}));
  app.use(chatRouter);
  app.use(errorMiddleware);
})();
export default app;
