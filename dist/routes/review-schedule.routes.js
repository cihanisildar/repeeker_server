"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_schedule_controller_1 = require("../controllers/review-schedule.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const express_2 = require("../utils/express");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', (0, express_2.withAuth)(review_schedule_controller_1.ReviewScheduleController.getSchedule));
router.post('/', (0, express_2.withAuth)(review_schedule_controller_1.ReviewScheduleController.upsertSchedule));
exports.default = router;
