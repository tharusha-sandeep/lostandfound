# Week 11 Integration Checklist

## 1. JWT Auth Integration (with Shiraj)
- [ ] Get shared JWT_SECRET from Shiraj
- [ ] Set USE_MOCK_AUTH=false in .env
- [ ] Set JWT_SECRET=<shared_secret> in .env
- [ ] Verify req.user shape matches: { _id, name, email, role }
- [ ] Test all protected routes with real JWT tokens
- [ ] Remove x-mock-role header handling from axiosClient in production

## 2. Claims Module Integration (with Shiraj)
- [ ] Confirm PATCH /api/posts/:id/status endpoint works with Shiraj's admin JWT
- [ ] Test status transition: matched -> resolved via claim approval
- [ ] Verify post detail page updates when status changes to resolved

## 3. Email Notification Integration (with Shiraj)
- [ ] Replace stub in emailNotificationService.js with real Nodemailer calls
- [ ] Test match:found event triggers email to post author
- [ ] Confirm authorId lookup in Users collection works

## 4. Analytics Integration (with Shiraj)
- [ ] Confirm zone field on Post documents is readable by analytics aggregation
- [ ] Verify analytics_zone_date index is used in heat map query
- [ ] No changes needed to Post API for analytics

## 5. Final Verification
- [ ] Run full Cypress test suite with USE_MOCK_AUTH=false
- [ ] All 4 test files pass
- [ ] Git log shows meaningful commits per layer
- [ ] GitHub Projects board shows completed tasks
