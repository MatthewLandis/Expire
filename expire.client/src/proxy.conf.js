// Keep this target aligned with Expire.Server's https launch profile.
module.exports = {
  "/api/**": {
    target: "https://localhost:7018",
    secure: false
  }
};
