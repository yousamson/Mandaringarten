import { Router, type IRouter } from "express";
import healthRouter from "./health";
import billingRouter from "./billing";
import learningRouter from "./learning";
import accountRouter from "./account";
import supportRouter from "./support";
import { accountLifecycleGuard } from "../account-lifecycle";

const router: IRouter = Router();

router.use(accountLifecycleGuard);
router.use(healthRouter);
router.use(billingRouter);
router.use(learningRouter);
router.use(accountRouter);
router.use(supportRouter);

export default router;
