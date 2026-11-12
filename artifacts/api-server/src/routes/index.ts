import { Router, type IRouter } from "express";
import healthRouter from "./health";
import billingRouter from "./billing";
import learningRouter from "./learning";
import examRouter from "./exam";
import accountRouter from "./account";
import supportRouter from "./support";
import translationRouter from "./translation";
import adminDashboardRouter from "./admin-dashboard";
import { accountLifecycleGuard } from "../account-lifecycle";

const router: IRouter = Router();

router.use(accountLifecycleGuard);
router.use(healthRouter);
router.use(billingRouter);
router.use(learningRouter);
router.use(examRouter);
router.use(accountRouter);
router.use(supportRouter);
router.use(translationRouter);
router.use(adminDashboardRouter);

export default router;
