const locationService = require('./services/location.services');

async function createLocation(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image.' });
    }

    const locationData = {
      ...req.body,
      imageUrl: `/uploads/${req.file.filename}`,
      uploaderId: req.user.id
    };

    const newLocation = await locationService.createLocation(locationData);

    res.status(201).json({ message: 'Location saved', location: newLocation });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to save location' });
  }
}
async function getLocations(req, res) {
  try {
    const locations = await locationService.getLocations(); 
    
    res.status(200).json(locations); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
}

module.exports = { createLocation, getLocations  };