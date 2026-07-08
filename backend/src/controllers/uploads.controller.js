const asyncHandler = require('../utils/asyncHandler');

exports.upload = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({
    filename: req.file.filename,
    original: req.file.originalname,
    url,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});