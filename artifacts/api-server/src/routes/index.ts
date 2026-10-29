import { Router, type IRouter } from "express";
import healthRouter from "./health";
import billingRouter from "./billing";
import learningRouter from "./learning";

const router: IRouter = Router();

router.use(healthRouter);
router.use(billingRouter);
router.use(learningRouter);

export default router;
