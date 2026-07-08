const asyncHandler = require('../utils/asyncHandler');
const DoctorProfile = require('../models/DoctorProfile');

exports.get = asyncHandler(async (req, res) => {
  let profile = await DoctorProfile.findOne({ user_id: req.user.id });
  if (!profile) profile = await DoctorProfile.create({ user_id: req.user.id });
  res.json(profile);
});

exports.update = asyncHandler(async (req, res) => {
  const profile = await DoctorProfile.findOneAndUpdate(
    { user_id: req.user.id },
    { $set: req.body },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(profile);
});

exports.clearAsset = asyncHandler(async (req, res) => {
  const field = req.params.field; // header_url | footer_url | signature_url | logo_url
  const allowed = ['header_url', 'footer_url', 'signature_url', 'logo_url'];
  if (!allowed.includes(field)) return res.status(400).json({ error: 'invalid field' });
  const profile = await DoctorProfile.findOneAndUpdate(
    { user_id: req.user.id },
    { $unset: { [field]: '' } },
    { new: true }
  );
  res.json(profile);
});